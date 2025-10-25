# Multi-Tenant FreeSWITCH Enterprise Architecture

## Panoramica

Sistema VoIP multi-tenant con isolamento completo tra tenant, gestione centralizzata e provisioning automatico FreeSWITCH.

## Architettura Tenant

### Master Tenant (edgvoip)
- **Slug**: `edgvoip`
- **is_master**: `true`
- **parent_tenant_id**: `NULL`
- **Funzioni**:
  - Creazione e gestione di tutti i tenant child
  - Accesso cross-tenant per amministrazione
  - NON ha SIP domain (solo amministrazione)
  - Accesso via `requireSuperAdmin` middleware

### Child Tenants (demo, test, etc.)
- **Slug**: `demo`, `test`, etc.
- **is_master**: `false`
- **parent_tenant_id**: `<id master tenant>`
- **SIP Domain**: `{slug}.edgvoip.it`
- **Context Prefix**: `tenant-{slug}`
- **Funzioni**:
  - Amministrazione solo del proprio tenant
  - NON possono creare altri tenant
  - NON possono accedere ad altri tenant

## FreeSWITCH Contexts

Ogni tenant ha 6 contesti dedicati:

### 1. `tenant-{slug}-internal` (Chiamate Interne)
- **Scopo**: Estensioni → Estensioni
- **Pattern**: `^(1\d{3})$`
- **Azione**: `bridge user/$1@{sip_domain}`

### 2. `tenant-{slug}-outbound` (Chiamate Uscenti)
- **Scopo**: Estensioni → Numeri esterni via trunk
- **Pattern**: Dinamico da tabella `outbound_routes`
- **Azione**: Normalizzazione numero → selezione trunk → bridge

### 3. `tenant-{slug}-external` (Chiamate Entranti)
- **Scopo**: Trunk → Estensioni/IVR/Queue
- **Pattern**: Dinamico da tabella `inbound_routes`
- **Azione**: Match DID → route a destinazione

### 4. `tenant-{slug}-features` (Codici Servizio)
- **Scopo**: Feature codes
- **Pattern**:
  - `*21{ext}` - Abilita call forward
  - `*22` - Disabilita call forward
  - `*76` - Abilita DND
  - `*77` - Disabilita DND
  - `*98` - Controlla voicemail

### 5. `tenant-{slug}-voicemail` (Segreteria)
- **Scopo**: Deposito messaggi voicemail
- **Pattern**: `^\d+$`
- **Azione**: `voicemail default {sip_domain} $1`

### 6. `tenant-{slug}-emergency` (Emergenze)
- **Scopo**: Numeri emergenza (112, 113, 115, 118)
- **Pattern**: `^(112|113|115|118)$`
- **Azione**: Bridge diretto con CLI forzato

## Sofia Profiles

### Internal Profile (Porta 5080)
- **Scopo**: Registrazione device SIP (utenti/extensions)
- **Auth**: Required
- **NAT**: Friendly (force_rport)
- **Domains**: Multi-domain (demo.edgvoip.it, test.edgvoip.it, etc.)

### External Profile (Porta 5060)
- **Scopo**: Connessioni trunk verso provider
- **Auth**: Optional (outbound) / Required (inbound)
- **Gateway**: Per trunk registration

## Flusso Chiamata Inbound (DID → Extension)

```
1. Trunk riceve INVITE da provider
   ↓ Sofia Profile: external (port 5060)
   ↓ Context: tenant-{slug}-external
   
2. Match DID number in inbound_routes table
   ↓ Query: SELECT * FROM inbound_routes WHERE did_number = '$1' AND tenant_id = '{id}'
   
3. Route a destinazione
   ↓ destination_type = 'extension' → bridge user/{extension}@{sip_domain}
   ↓ destination_type = 'ivr' → transfer to IVR menu
   ↓ destination_type = 'queue' → fifo/callcenter
```

## Flusso Chiamata Outbound (Extension → External)

```
1. Extension registrata su internal profile
   ↓ User dials: 0591234567
   ↓ Context: tenant-{slug}-internal
   
2. Transfer a outbound context
   ↓ Pattern: ^0(\d+)$ → transfer $1 XML tenant-{slug}-outbound
   
3. Match pattern in outbound_routes table
   ↓ Query: SELECT * FROM outbound_routes WHERE dial_pattern matches number
   ↓ ORDER BY priority ASC
   
4. Number manipulation
   ↓ Strip digits: 0591234567 → 591234567
   ↓ Add digits: 591234567 → +39591234567
   
5. Bridge to trunk
   ↓ sofia/gateway/{trunk_name}/{normalized_number}
```

## Database Schema

### Tenants Table
```sql
id UUID PRIMARY KEY
slug VARCHAR UNIQUE (demo, test, etc.)
sip_domain VARCHAR UNIQUE (demo.edgvoip.it)
context_prefix VARCHAR (tenant-demo)
parent_tenant_id UUID REFERENCES tenants(id)
is_master BOOLEAN
timezone VARCHAR(50)
language VARCHAR(10)
settings JSONB
```

### Dialplan Rules Table
```sql
id UUID PRIMARY KEY
tenant_id UUID FK
context VARCHAR (tenant-demo-internal)
name VARCHAR
match_pattern VARCHAR (regex)
match_condition JSONB
actions JSONB
priority INT
enabled BOOLEAN
```

### Inbound Routes Table
```sql
id UUID PRIMARY KEY
tenant_id UUID FK
did_number VARCHAR
destination_type VARCHAR (extension|ring_group|queue|ivr)
destination_value VARCHAR
time_condition_id UUID FK
```

### Outbound Routes Table
```sql
id UUID PRIMARY KEY
tenant_id UUID FK
dial_pattern VARCHAR (regex)
trunk_id UUID FK
strip_digits INT
add_digits VARCHAR
priority INT
failover_trunk_id UUID FK
```

## API Endpoints

### Tenant Management (SOLO Master Tenant)
- `POST /api/tenants` - Crea nuovo tenant + contexts automatici
- `GET /api/tenants` - Lista tutti i tenant
- `PUT /api/tenants/:id` - Aggiorna tenant
- `DELETE /api/tenants/:id` - Elimina tenant

### FreeSWITCH Deployment (Owner + Master)
- `POST /api/freeswitch-deploy/tenant/:tenantId` - Deploy completo
- `POST /api/freeswitch-deploy/extension/:extensionId` - Deploy extension
- `POST /api/freeswitch-deploy/trunk/:trunkId` - Deploy trunk
- `POST /api/freeswitch-deploy/reload` - Reload globale

### Dialplan Rules (Owner + Master)
- `GET /api/dialplan/rules?tenant_id={id}&context={ctx}` - Lista regole
- `POST /api/dialplan/rules` - Crea regola
- `PUT /api/dialplan/rules/:id` - Modifica regola
- `DELETE /api/dialplan/rules/:id` - Elimina regola
- `POST /api/dialplan/rules/:id/test` - Test pattern

### Routing (Owner + Master)
- `GET /api/routing/inbound?tenant_id={id}` - Lista inbound routes
- `POST /api/routing/inbound` - Crea inbound route
- `PUT /api/routing/inbound/:id` - Modifica inbound route
- `DELETE /api/routing/inbound/:id` - Elimina inbound route
- Stessi endpoint per `/outbound` e `/time-conditions`

## Frontend Pages

### CreateTenant.tsx (SOLO Master Tenant)
**Campi**:
- Nome Tenant
- Slug (auto-lowercase, genera sip_domain e context_prefix)
- Dominio (per autenticazione web)
- SIP Domain (readonly, auto: `{slug}.edgvoip.it`)
- Context Prefix (readonly, auto: `tenant-{slug}`)
- Timezone (select)
- Lingua IVR (select: it/en/es/fr)
- Max Extensions, Max Trunks, Max Concurrent Calls

**Azione**: Crea tenant + genera automaticamente 6 contesti FreeSWITCH

### Extensions.tsx (Con Tabs)
**Tabs**:
1. **Generali**: Nome, Extension, Password, Email, Status
2. **Chiamate**: Caller ID, Timeout, Call Forward, DND, Pickup Group, Recording
3. **Sicurezza**: Max Calls, Codec Prefs, Force TLS/SRTP, IP Whitelist
4. **Voicemail**: Enable VM, PIN, Email Notification, Delete After Send
5. **Avanzate**: Context (readonly), Timezone, Notes

**Pulsanti**: "Salva" + "Salva e Deploy FreeSWITCH"

### SipTrunks.tsx (Con Tabs)
**Tabs**:
1. **Provider**: Nome, Provider, Host, Port, Transport
2. **Autenticazione**: Username, Password, Realm, Register
3. **Inbound**: DID Numbers (array)
4. **Outbound**: Caller ID, Codec Prefs, Max Calls, Failover
5. **Sicurezza**: Encryption (UDP/TCP/TLS), Status

**Pulsanti**: "Test Chiamata", "Salva", "Salva e Deploy FreeSWITCH"

### CallRouting.tsx (Con Tabs)
**Tabs**:
1. **Inbound Routes**: DID → Destination mapping
2. **Outbound Routes**: Pattern → Trunk mapping con priority
3. **Time Conditions**: Business hours, holidays, actions
4. **Emergency**: Numeri emergenza (112, 113, 115, 118)

## Provisioning Pipeline

1. **Creazione Tenant** (Master UI)
   → POST /api/tenants
   → TenantService.createTenantWithContexts()
   → Genera 6 contesti in dialplan_rules table

2. **Creazione Extension** (Tenant Admin UI)
   → POST /api/voip/sip-extensions
   → ExtensionService.createExtension()
   → Click "Salva e Deploy"
   → POST /api/freeswitch-deploy/extension/{id}
   → FreeSWITCHDeployService.deployExtension()
   → Genera XML da template + scrive file + reload

3. **Creazione Trunk** (Tenant Admin UI)
   → POST /api/sip-trunks
   → TrunkService.createTrunk()
   → Click "Salva e Deploy"
   → POST /api/freeswitch-deploy/trunk/{id}
   → FreeSWITCHDeployService.deployTrunk()
   → Genera gateway XML + sofia rescan

## Best Practices

### Naming Convention
- Tenant slug: lowercase, no spaces (demo, test-tenant)
- SIP Domain: `{slug}.edgvoip.it`
- Context: `tenant-{slug}-{type}`
- Extensions: 1000-1999 (interni)
- Queues: 3000-3999
- Conferences: 4000-4999

### Security
- Master tenant può vedere tutto
- Child tenant può vedere solo proprio dominio
- Middleware `requireTenantOwnerOrMaster` per autorizzazione
- IP Whitelist per extensions critiche
- TLS/SRTP disponibile per security-critical deployments

### Performance
- Context prefix indicizzato
- Dialplan rules ordinate per priority
- Caching route matching results
- Lazy loading tenant configurations

## Deployment

### Create Tenant Demo
```bash
curl -X POST http://localhost:5000/api/tenants \
  -H "Authorization: Bearer {master_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Tenant",
    "slug": "demo",
    "domain": "demo",
    "timezone": "Europe/Rome",
    "language": "it",
    "admin_user": {...},
    "settings": {
      "max_extensions": 50,
      "max_trunks": 5,
      "max_concurrent_calls": 10
    }
  }'
```

Questo crea automaticamente:
- Tenant in DB
- 6 contesti in dialplan_rules
- Admin user
- Companies e contacts

### Deploy Configuration
```bash
curl -X POST http://localhost:5000/api/freeswitch-deploy/tenant/{tenant_id} \
  -H "Authorization: Bearer {token}"
```

Questo genera e deploya:
- `/usr/local/freeswitch/conf/dialplan/tenant-demo-contexts.xml`
- `/usr/local/freeswitch/conf/directory/demo.edgvoip.it/*.xml`
- `/usr/local/freeswitch/conf/sip_profiles/external/trunk_*.xml`
- Reload FreeSWITCH via ESL

## Troubleshooting

### Extension non si registra
1. Verificare context: deve essere `tenant-{slug}-internal`
2. Verificare password in directory XML
3. Verificare domain match: `demo.edgvoip.it`
4. Check Sofia status: `fs_cli -x "sofia status profile internal"`

### Chiamata interna non funziona
1. Verificare context dell'extension
2. Verificare pattern in tenant-{slug}-internal
3. Check dialplan trace: `fs_cli -x "console loglevel debug"`

### Chiamata uscente fallisce (404)
1. Verificare outbound_routes per tenant
2. Verificare trunk registration: `fs_cli -x "sofia status gateway {name}"`
3. Verificare pattern matching
4. Check caller number normalization

### Chiamata entrante non instrada
1. Verificare inbound_routes con DID corretto
2. Verificare context trunk: deve essere `tenant-{slug}-external`
3. Verificare destination_value (extension esiste?)

## File Locations

### FreeSWITCH Configuration
```
/usr/local/freeswitch/conf/
├── dialplan/
│   ├── tenant-demo-contexts.xml
│   └── tenant-demo-outbound-dynamic.xml
├── directory/
│   └── demo.edgvoip.it/
│       ├── 1000.xml
│       ├── 1001.xml
│       └── ...
└── sip_profiles/
    └── external/
        ├── messagenet_demo.xml
        └── ...
```

### Application
```
packages/
├── database/
│   └── src/migrations/
│       ├── 020_enhance_tenant_multitenant.sql
│       ├── 021_create_dialplan_rules.sql
│       ├── 022_create_routing_tables.sql
│       ├── 023_enhance_extensions.sql
│       └── 024_enhance_sip_trunks.sql
├── backend/
│   ├── src/middleware/
│   │   └── tenant-auth.ts
│   ├── src/services/
│   │   ├── dialplan-rules.service.ts
│   │   ├── routing.service.ts
│   │   ├── freeswitch-deploy.service.ts
│   │   ├── tenant.service.ts (enhanced)
│   │   └── freeswitch-config.service.ts (enhanced)
│   └── src/routes/
│       ├── freeswitch-deploy.routes.ts
│       ├── dialplan-rules.routes.ts
│       ├── routing.routes.ts
│       └── tenants.ts (enhanced)
└── frontend/
    └── src/pages/
        ├── CreateTenant.tsx (enhanced)
        ├── Extensions.tsx (new tabs)
        ├── SipTrunks.tsx (new tabs)
        └── CallRouting.tsx (enhanced)
```

## Next Steps

1. Applicare migrations: `npm run migrate`
2. Seed data con master tenant: `npm run seed`
3. Build: `npm run build`
4. Deploy su server
5. Creare tenant demo via UI
6. Deploy FreeSWITCH config
7. Testare chiamate

## Support

Per problemi o domande, verificare:
- Log backend: `packages/backend/logs/`
- Log FreeSWITCH: `/usr/local/freeswitch/var/log/freeswitch/freeswitch.log`
- Database audit_logs: `SELECT * FROM audit_logs ORDER BY created_at DESC`

