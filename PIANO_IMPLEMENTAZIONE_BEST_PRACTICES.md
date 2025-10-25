# 🎯 PIANO IMPLEMENTAZIONE BEST PRACTICES MULTI-TENANT FREESWITCH

## 📊 ANALISI STATO ATTUALE

### ✅ GIÀ IMPLEMENTATO

**Backend:**
- ✅ Schema Zod completi per Tenant, Extensions, SipTrunks
- ✅ Servizi esistenti: dialplan-generator, freeswitch-config, extension, sip-trunk
- ✅ Multi-tenancy database con tenant_id
- ✅ Time Conditions, IVR, Queues, Ring Groups schema
- ✅ CDR tracking
- ✅ ESL Service (Event Socket Layer)

**Frontend:**
- ✅ Pagine esistenti: Extensions, SipTrunks, CallRouting, IVR, TimeConditions
- ✅ Autenticazione multi-tenant
- ✅ UI components (Shadcn)

### ❌ DA IMPLEMENTARE (Best Practices)

**Backend:**
1. **Contesti FreeSWITCH per tenant** (naming: `tenant-{slug}-internal`, `tenant-{slug}-outbound`, ecc.)
2. **Profili Sofia separati** (internal:5080, external:5060)
3. **Generazione dinamica XML** per multi-domain
4. **Context-aware dialplan** (6 context per tenant)
5. **Trunk isolation** con variabili tenant

**Frontend:**
6. **UI Tenant Settings** completa
7. **UI Extension** con tabs (Generali, Chiamate, Sicurezza, Voicemail, Avanzate)
8. **UI Trunk** con tabs (Dati provider, Auth, Inbound, Outbound, Sicurezza)
9. **Visual Dialplan Editor** (React Flow)
10. **Context Management UI**

---

## 🏗️ ARCHITETTURA TARGET (Best Practice)

### Profili Sofia

```
Profile         Porta    Scopo                           NAT
======================================================================
internal        5080     Registrazione dispositivi       Friendly
external        5060     Trunk provider esterni          Public IP
```

### Contesti per Tenant (6 context)

```
tenant-demo-internal     → Chiamate interne estensioni
tenant-demo-outbound     → Chiamate esterne (normalizza + seleziona trunk)
tenant-demo-external     → Chiamate entranti (DID → estensione/IVR)
tenant-demo-features     → Codici servizio (*21, *72, *98, ecc.)
tenant-demo-voicemail    → Gestione caselle vocali
tenant-demo-emergency    → Numeri emergenza (112, 118)
```

### Directory Structure FreeSWITCH

```
/usr/local/freeswitch/etc/freeswitch/
├── sip_profiles/
│   ├── internal.xml (5080 - devices)
│   ├── external.xml (5060 - trunks)
│   ├── internal/
│   │   └── (vuoto - no gateway)
│   └── external/
│       └── messagenet_demo.xml
│
├── directory/
│   ├── domain/
│   │   ├── demo.edgvoip.it.xml
│   │   └── edgvoip.it.xml
│   └── demo.edgvoip.it/
│       ├── 2000.xml
│       └── 2001.xml
│
└── dialplan/
    ├── tenant-demo-internal.xml
    ├── tenant-demo-outbound.xml
    ├── tenant-demo-external.xml
    ├── tenant-demo-features.xml
    ├── tenant-demo-voicemail.xml
    └── tenant-demo-emergency.xml
```

---

## 📝 TASK LIST - IMPLEMENTAZIONE

### FASE 1: Backend - Database Schema Update

**File:** `packages/database/src/migrations/019_add_context_fields.sql`

```sql
-- Aggiungi campi per naming convention context
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS context_prefix VARCHAR(50),
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Europe/Rome',
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'it';

-- Update tenant demo
UPDATE tenants 
SET context_prefix = 'tenant-demo',
    timezone = 'Europe/Rome',
    language = 'it'
WHERE slug = 'demo';

-- Aggiungi campi extension
ALTER TABLE extensions
  ADD COLUMN IF NOT EXISTS user_context VARCHAR(100),
  ADD COLUMN IF NOT EXISTS voicemail_pin VARCHAR(20),
  ADD COLUMN IF NOT EXISTS call_forward_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS call_forward_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS dnd_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS record_calls BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pickup_group VARCHAR(50),
  ADD COLUMN IF NOT EXISTS limit_max INTEGER DEFAULT 3;

-- Update extensions demo
UPDATE extensions
SET user_context = 'tenant-demo-internal'
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'demo');

-- Aggiungi tabella dialplan_contexts
CREATE TABLE IF NOT EXISTS dialplan_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  context_name VARCHAR(100) NOT NULL,
  context_type VARCHAR(50) NOT NULL, -- internal, outbound, external, features, voicemail, emergency
  description TEXT,
  xml_content TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, context_name)
);

-- Insert contexts per tenant demo
INSERT INTO dialplan_contexts (tenant_id, context_name, context_type, description) VALUES
  ((SELECT id FROM tenants WHERE slug='demo'), 'tenant-demo-internal', 'internal', 'Chiamate interne ed estensioni'),
  ((SELECT id FROM tenants WHERE slug='demo'), 'tenant-demo-outbound', 'outbound', 'Chiamate esterne verso trunk'),
  ((SELECT id FROM tenants WHERE slug='demo'), 'tenant-demo-external', 'external', 'Chiamate entranti da DID'),
  ((SELECT id FROM tenants WHERE slug='demo'), 'tenant-demo-features', 'features', 'Codici di servizio (*21, *72, ecc.)'),
  ((SELECT id FROM tenants WHERE slug='demo'), 'tenant-demo-voicemail', 'voicemail', 'Caselle vocali'),
  ((SELECT id FROM tenants WHERE slug='demo'), 'tenant-demo-emergency', 'emergency', 'Numeri emergenza 112/118');
```

### FASE 2: Backend - FreeSWITCH Config Service Enhancement

**File:** `packages/backend/src/services/freeswitch-config-enhanced.service.ts` (NUOVO)

Implementa metodi:
- `generateDomainXML(tenant)` → `/directory/domain/{sip_domain}.xml`
- `generateUserXML(extension, tenant)` → `/directory/{sip_domain}/{extension}.xml`
- `generateContextDialplan(tenant, contextType)` → `/dialplan/tenant-{slug}-{type}.xml`
- `generateGatewayXML(trunk, tenant)` → `/sip_profiles/external/{trunk_name}.xml`
- `generateProfileXML(profileType)` → `/sip_profiles/{internal|external}.xml`

### FASE 3: Backend - API Endpoints

**File:** `packages/backend/src/routes/freeswitch.ts` (NUOVO/UPDATE)

Endpoint necessari:
```typescript
// Genera tutti i file FreeSWITCH per un tenant
POST /api/:tenantSlug/freeswitch/generate
→ Genera directory, dialplan, gateway per il tenant

// Ricarica configurazione FreeSWITCH
POST /api/:tenantSlug/freeswitch/reload
→ fs_cli -x "reloadxml"

// Test gateway
POST /api/:tenantSlug/freeswitch/gateway/:gatewayName/test
→ Testa registrazione trunk

// Status profili
GET /api/:tenantSlug/freeswitch/profiles
→ sofia status

// Registrazioni attive
GET /api/:tenantSlug/freeswitch/registrations
→ show registrations filtrato per domain

// Context list
GET /api/:tenantSlug/freeswitch/contexts
→ Lista dialplan contexts del tenant
```

### FASE 4: Frontend - Tenant Settings Page

**File:** `packages/frontend/src/pages/TenantSettings.tsx` (NUOVO)

Layout con tabs:
```tsx
<Tabs>
  <Tab label="Generale">
    - Nome tenant
    - Dominio SIP (readonly: demo.edgvoip.it)
    - Context Prefix (readonly: tenant-demo)
    - Timezone (select)
    - Lingua IVR (select: it/en)
    - Max utenti (number)
    - Max trunk (number)
  </Tab>
  
  <Tab label="Contesti FreeSWITCH">
    <ContextList>
      {contexts.map(ctx => (
        <Card>
          <Badge>{ctx.type}</Badge>
          <h3>{ctx.name}</h3>
          <p>{ctx.description}</p>
          <Button onClick={() => viewXML(ctx)}>Vedi XML</Button>
          <Button onClick={() => editContext(ctx)}>Modifica</Button>
        </Card>
      ))}
    </ContextList>
    <Button onClick={generateAllContexts}>Rigenera Tutti i Contesti</Button>
  </Tab>
  
  <Tab label="Profili SIP">
    <ProfilesList>
      <ProfileCard name="internal" port="5080" />
      <ProfileCard name="external" port="5060" />
    </ProfilesList>
  </Tab>
  
  <Tab label="Sicurezza">
    - IP Whitelist
    - Max chiamate concorrenti
    - SRTP requirement
    - TLS enforcement
  </Tab>
</Tabs>
```

### FASE 5: Frontend - Extensions Page Enhancement

**File:** `packages/frontend/src/pages/Extensions.tsx` (UPDATE)

Aggiungi tabs secondo best practice:

```tsx
<Dialog open={editMode}>
  <Tabs>
    <Tab label="Generali">
      - Display Name
      - Extension Number
      - SIP Domain (readonly)
      - Password (con generatore)
      - Email
      - Abilitato
    </Tab>
    
    <Tab label="Chiamate">
      - Caller ID Nome
      - Caller ID Numero
      - Timeout squillo (slider 5-60s)
      - Deviazione chiamate
        → Numero/Estensione
        → Sempre/Occupato/Non risponde
      - DND (toggle)
      - Gruppo chiamata (multi-select)
      - Pickup group (multi-select)
      - Registrazione auto (toggle)
    </Tab>
    
    <Tab label="Sicurezza">
      - ACL / IP consentiti (lista)
      - Forza TLS
      - Forza SRTP
      - Limite chiamate simultanee
      - Codec preferiti (PCMU, PCMA, OPUS, G729)
    </Tab>
    
    <Tab label="Voicemail">
      - Abilita segreteria
      - PIN
      - Email notifiche
      - Elimina dopo invio email
      - Attach audio file
    </Tab>
    
    <Tab label="Avanzate">
      - Context (readonly: tenant-demo-internal)
      - Timezone
      - Language
      - Custom variables (key-value pairs)
      - Note admin
    </Tab>
  </Tabs>
</Dialog>
```

### FASE 6: Frontend - Trunk Page Enhancement

**File:** `packages/frontend/src/pages/SipTrunks.tsx` (UPDATE)

Tabs secondo best practice:

```tsx
<Dialog open={editTrunkMode}>
  <Tabs>
    <Tab label="Dati Provider">
      - Nome trunk
      - Provider (select o custom)
      - Host SIP
      - Porta (5060/5061)
      - Transport (UDP/TCP/TLS)
      - Stato (badge Online/Offline)
    </Tab>
    
    <Tab label="Autenticazione">
      - Username
      - Password
      - Realm
      - Auth Username (opzionale)
      - Registrazione (toggle)
      - Register Proxy
      - Expire seconds
    </Tab>
    
    <Tab label="Chiamate Entranti">
      - DIDs assegnati (lista)
      - Inbound caller ID
      - Context (tenant-demo-external)
      - Routing DID → Destination
    </Tab>
    
    <Tab label="Chiamate Uscenti">
      - Outbound Caller ID
      - Prefix da aggiungere
      - Strip digits
      - Codec preferiti
      - Max chiamate
    </Tab>
    
    <Tab label="Sicurezza">
      - IP Whitelist
      - Encryption (TLS/SRTP)
      - Auth method
      - Rate limiting
    </Tab>
    
    <Tab label="Test">
      - Test Registrazione (button → API call)
      - Test Chiamata (originate test)
      - View SIP Trace (log)
      - Ping Status
    </Tab>
  </Tabs>
</Dialog>
```

### FASE 7: Frontend - Visual Dialplan Editor

**File:** `packages/frontend/src/pages/DialplanEditor.tsx` (NUOVO)

Usa React Flow per drag & drop:

```tsx
<DialplanEditor tenantSlug={tenantSlug} context="tenant-demo-outbound">
  <Toolbar>
    <BlockPalette>
      - Condition (regex, time, CID)
      - Action (bridge, transfer, playback, hangup)
      - Variable (set, unset)
    </BlockPalette>
  </Toolbar>
  
  <Canvas>
    <ReactFlow
      nodes={[
        { type: 'condition', data: { regex: '^(3\\d{9})$' } },
        { type: 'action', data: { app: 'bridge', data: 'sofia/gateway/...' } }
      ]}
      edges={[...]}
    />
  </Canvas>
  
  <Preview>
    <XMLPreview>{generatedXML}</XMLPreview>
  </Preview>
  
  <Actions>
    <Button onClick={saveDialplan}>Salva</Button>
    <Button onClick={deployToFreeSWITCH}>Deploy</Button>
    <Button onClick={testDialplan}>Simula Chiamata</Button>
  </Actions>
</DialplanEditor>
```

---

## 🔧 IMPLEMENTAZIONE PRIORITARIA

### 🚨 URGENTE: Risolvi Messagenet 403 Forbidden

Prima di implementare tutto, devo risolvere il trunk Messagenet.

**Azione immediata:**

1. Catturo SIP trace completo della prossima chiamata
2. Verifico ESATTAMENTE cosa Messagenet rifiuta
3. Correggo configurazione gateway

**Comando debug:**
```bash
ssh root@93.93.113.13
/usr/local/freeswitch/bin/fs_cli

> sofia global siptrace on
> console loglevel 9

# Fai chiamata, copia output completo INVITE + risposta 403
```

---

## 📋 CHECKLIST IMPLEMENTAZIONE

### Backend

- [ ] Migration 019: Aggiungi campi context_prefix, timezone, language a tenants
- [ ] Migration 020: Aggiungi campi avanzati a extensions
- [ ] Migration 021: Crea tabella dialplan_contexts
- [ ] Service: FreeSwitchConfigEnhancedService
  - [ ] generateDomainXML()
  - [ ] generateUserXML()
  - [ ] generateContextDialplan()
  - [ ] generateGatewayXML()
- [ ] Service: ContextManagerService
  - [ ] createContext(tenant, type)
  - [ ] listContexts(tenant)
  - [ ] generateXML(context)
  - [ ] deploy(context)
- [ ] Routes: /api/:tenantSlug/freeswitch/*
  - [ ] POST /generate
  - [ ] POST /reload
  - [ ] GET /profiles
  - [ ] GET /registrations
  - [ ] GET /contexts

### Frontend

- [ ] Page: TenantSettings.tsx (NUOVO)
  - [ ] Tab Generale
  - [ ] Tab Contesti FreeSWITCH
  - [ ] Tab Profili SIP
  - [ ] Tab Sicurezza
- [ ] Page: Extensions.tsx (UPDATE)
  - [ ] Tab Generali
  - [ ] Tab Chiamate (call forwarding, DND, groups)
  - [ ] Tab Sicurezza (ACL, TLS, codec)
  - [ ] Tab Voicemail (pin, email)
  - [ ] Tab Avanzate (context, variables)
- [ ] Page: SipTrunks.tsx (UPDATE)
  - [ ] Tab Dati Provider
  - [ ] Tab Autenticazione
  - [ ] Tab Chiamate Entranti
  - [ ] Tab Chiamate Uscenti
  - [ ] Tab Sicurezza
  - [ ] Tab Test (registrazione, ping, trace)
- [ ] Page: DialplanEditor.tsx (NUOVO)
  - [ ] React Flow integration
  - [ ] Block palette
  - [ ] XML preview
  - [ ] Deploy functionality
- [ ] Component: ContextManager.tsx (NUOVO)
  - [ ] Lista contesti tenant
  - [ ] Crea/modifica/elimina
  - [ ] Preview XML
  - [ ] Deploy button

---

## 🎯 PRIORITÀ

### 1. URGENTE (Ora)
**Risolvi 403 Forbidden Messagenet**
- Catturo SIP trace
- Testo formato numero diversi
- Verifico account Messagenet

### 2. ALTA (Prossime ore)
**Implementa Context Naming Best Practice**
- Migration database
- Update dialplan generator
- Rigenera config FreeSWITCH sul server

### 3. MEDIA (Prossimi giorni)
**Frontend UI/UX Enhancement**
- TenantSettings page
- Extensions tabs
- Trunk tabs

### 4. BASSA (Prossime settimane)
**Advanced Features**
- Visual Dialplan Editor
- Context Manager
- Real-time monitoring

---

## 🚀 PROPOSTA OPERATIVA

### Opzione A: RISOLVI PRIMA MESSAGENET (Consigliato)

**Steps:**
1. Catturo SIP trace chiamata 2000 → 3297626144
2. Analizzo risposta 403 di Messagenet
3. Correggo configurazione
4. Testo chiamata funzionante
5. POI implemento best practice

**Tempo:** 30-60 minuti

### Opzione B: IMPLEMENTA BEST PRACTICE ORA

**Steps:**
1. Crei migrations database
2. Implementi services backend
3. Crei/aggiorni pagine frontend
4. Deploy su server
5. Risolvi Messagenet dopo

**Tempo:** 4-6 ore

---

## 💬 DOMANDA PER TE

**Cosa preferisci?**

**A)** Risolviamo prima il 403 Forbidden di Messagenet (catturo SIP trace ora)?

**B)** Implementiamo subito tutte le best practice e poi risolviamo Messagenet?

**C)** Ibrido: Implemento context naming + risolvo Messagenet in parallelo?

**La mia raccomandazione:** **Opzione A**  
Risolviamo prima il trunk (è critico per testare tutto) e POI implementiamo le best practice con sistema funzionante.

**Cosa dici?** 🎯

