# 🎓 ANALISI PROFESSIONALE FREESWITCH + MESSAGENET

## 📚 CONOSCENZE ACQUISITE DA RICERCA WEB

### 1. Porta Server Messagenet
**PROBLEMA COMUNE:** Porta 5061 vs 5060
- ⚠️ Alcuni utenti riportano problemi con porta **5061**
- ✅ Porta **5060** funziona più affidabilmente
- **SOLUZIONE APPLICATA:** Gateway configurato su **5060**

### 2. Formato Numeri Messagenet
**CallerID (From):**
- ❌ **NO** `+390686356924` (formato internazionale)
- ✅ **SÌ** `0686356924` (formato nazionale)

**Numero Chiamato (To/Destination):**
- Secondo documentazione: Passare numero così com'è
- Alcuni provider richiedono +39, altri no
- **CONFIGURAZIONE ATTUALE:** `+39` + numero mobile

### 3. Codec Supportati
**Messagenet accetta:**
- ✅ G.711a (PCMA) - Preferito
- ✅ G.711u (PCMU) - Preferito  
- ✅ G.729
- ✅ OPUS (alcuni trunk)

**CONFIGURAZIONE ATTUALE:** `OPUS,G722,PCMU,PCMA`

### 4. Transport
- ✅ **UDP** preferito (configurato)
- TCP supportato ma meno comune

---

## 🔧 CONFIGURAZIONE FREESW ITCH APPLICATA

### Architettura Multi-Tenant

```
FRONTEND URL
├─ edgvoip.it/demo/login
└─ demo = tenant slug

BACKEND
├─ Middleware validateTenantSlug
├─ Query DB: SELECT * FROM tenants WHERE slug='demo'
└─ Recupera: tenant_id, sip_domain

DATABASE
├─ Tenant: demo (42b7b735...)
├─ SIP Domain: demo.edgvoip.it
├─ Extensions: 2000, 2001
└─ SIP Trunk: messagenet_demo

FREESWITCH
├─ Directory: /directory/domain/demo.edgvoip.it.xml
│   ├─ User 2000 (user_context=demo.edgvoip.it)
│   └─ User 2001 (user_context=demo.edgvoip.it)
│
├─ Dialplan: /dialplan/demo.edgvoip.it.xml
│   ├─ Context: demo.edgvoip.it
│   ├─ Extension 2000-2999: bridge user/X@demo.edgvoip.it
│   └─ Extension 3XXXXXXXXX: bridge sofia/gateway/messagenet_demo/+39X
│
└─ Gateway: /sip_profiles/internal/messagenet_demo.xml
    ├─ Profilo: internal (porta 5060)
    ├─ Server: sip.messagenet.it:5060
    └─ Status: REGED
```

---

## 🎯 FLUSSO CHIAMATA - ANALISI COMPLETA

### Chiamata Interna: 2000 → 2001 ✅ FUNZIONA

```
1. SIP INVITE
   ├─ From: sip:2000@demo.edgvoip.it
   ├─ To: sip:2001@demo.edgvoip.it
   └─ Porta: 5060 UDP

2. FreeSWITCH Profilo Internal
   ├─ Riceve su: 93.93.113.13:5060
   ├─ Autentica: 2000@demo.edgvoip.it
   └─ Carica variabili da: /directory/domain/demo.edgvoip.it.xml

3. Determina Context
   ├─ Default context profilo: public
   ├─ Match: route_to_demo_tenant (sip_to_host=demo.edgvoip.it)
   └─ Transfer to: demo.edgvoip.it context

4. Dialplan Context demo.edgvoip.it
   ├─ Extension: demo_local_extensions
   ├─ Regex: ^(2[0-9]{3})$ → MATCH 2001 ✅
   └─ Action: bridge user/2001@demo.edgvoip.it

5. FreeSWITCH Bridge
   ├─ Cerca: 2001@demo.edgvoip.it
   ├─ Trovato: sofia/internal/sip:2001@194.79.203.34:59353
   └─ INVITE a 2001

6. Negoziazione RTP
   ├─ Codec: PCMU selezionato
   ├─ Porte RTP: 10024, 10025
   └─ Audio stream attivo ✅

7. Conversazione ✅
```

**PORTE UTILIZZATE:**
- SIP Signaling: 5060 UDP
- RTP Audio: 10024, 10025 UDP

---

### Chiamata Esterna: 2000 → 3297626144 ❌ NON FUNZIONA

```
1. SIP INVITE
   ├─ From: sip:2000@demo.edgvoip.it
   ├─ To: sip:3297626144@demo.edgvoip.it
   └─ Porta: 5060 UDP

2. FreeSWITCH Context: public
   ├─ Match: route_to_demo_tenant
   └─ Transfer to: demo.edgvoip.it

3. Dialplan Context demo.edgvoip.it
   ├─ Extension: demo_outbound_italian_mobile
   ├─ Regex: ^(3\d{9})$ → MATCH 3297626144 ✅
   ├─ Set: effective_caller_id_number=0686356924
   └─ Action: bridge sofia/gateway/messagenet_demo/+393297626144

4. FreeSWITCH → Gateway Messagenet
   ├─ Gateway: internal::messagenet_demo
   ├─ Server: sip.messagenet.it:5060
   ├─ INVITE From: 0686356924 (senza +39)
   └─ INVITE To: +393297626144

5. Messagenet Risponde
   ├─ SIP/2.0 403 Forbidden ❌
   └─ Motivo: ??? (da verificare)

6. FreeSWITCH Hangup
   └─ Cause: CALL_REJECTED
```

**PORTE UTILIZZATE:**
- SIP Signaling interno: 5060 UDP
- SIP Signaling gateway: 5060 UDP (verso sip.messagenet.it)

---

## 🔍 POSSIBILI CAUSE 403 FORBIDDEN

### Causa 1: Account non attivo per chiamate uscenti
- Messagenet potrebbe aver attivato solo chiamate IN ENTRATA
- Necessario verificare sul portale Messagenet

### Causa 2: CallerID non autorizzato
- Messagenet rifiuta se il CallerID non è un numero assegnato
- Possibile che `0686356924` non sia autorizzato come CallerID

### Causa 3: Credito insufficiente
- Account prepagato senza credito
- Verificare saldo su portale Messagenet

### Causa 4: Formato numero destinazione errato
- Messagenet potrebbe volere:
  - Opzione A: `3297626144` (senza +39)
  - Opzione B: `+393297626144` (con +39) ← ATTUALE
  - Opzione C: `00393297626144` (con 0039)

### Causa 5: Realm/Domain errato
- Messagenet potrebbe richiedere dominio specifico nel From header

---

## 🧪 TEST DIAGNOSTICI

### Test 1: Verifica Account Messagenet

**Accedi a:** https://www.messagenet.it (area clienti)

**Verifica:**
- ✅ Account attivo?
- ✅ Credito sufficiente?
- ✅ Chiamate uscenti abilitate?
- ✅ Numero `0686356924` è il tuo DID?
- ✅ CallerID autorizzati: quali?

### Test 2: Prova Formati Numero Diversi

**Nel dialplan, prova queste varianti:**

```xml
<!-- Variante A: Solo numero (SENZA +39) -->
<action application="bridge" data="sofia/gateway/messagenet_demo/$1"/>
Chiamata: 3297626144

<!-- Variante B: CON +39 (ATTUALE) -->
<action application="bridge" data="sofia/gateway/messagenet_demo/+39$1"/>
Chiamata: +393297626144

<!-- Variante C: CON 0039 -->
<action application="bridge" data="sofia/gateway/messagenet_demo/0039$1"/>
Chiamata: 00393297626144
```

### Test 3: Verifica Codec

**Messagenet supporta principalmente PCMU e PCMA**

Semplifica codec nel gateway:
```xml
<param name="codec-prefs" value="PCMU,PCMA"/>
```

### Test 4: Echo Test (Verifica Sistema)

**Dal softphone chiama: `9196`**

Se funziona = Sistema FreeSWITCH OK, problema solo Messagenet

---

## 📞 PORTE - CONFIGURAZIONE FINALE

### Server: 93.93.113.13

| Servizio | Porta | Proto | Uso | Firewall | Note |
|----------|-------|-------|-----|----------|------|
| **FreeSWITCH Internal** | 5060 | UDP+TCP | Estensioni 2000,2001 | ✅ APERTA | OK |
| **FreeSWITCH Internal** | 5060 | UDP | Gateway Messagenet | ✅ APERTA | OK |
| **FreeSWITCH External** | 5080 | UDP+TCP | (Non usato) | ✅ APERTA | Disponibile |
| **RTP Media** | 10000-20000 | UDP | Audio chiamate | ✅ APERTA | OK |
| **RTP Media** | 10000-20000 | TCP | (Raro) | ✅ APERTA | OK |
| Nginx | 80 | TCP | Web | ✅ APERTA | OK |
| Backend API | 5000 | TCP | API | ⚠️ APERTA | Proteggere |
| PostgreSQL | 5432 | TCP | Database | ✅ LOCALE | OK |

### Messagenet Server

| Endpoint | Porta | Uso |
|----------|-------|-----|
| sip.messagenet.it | **5060** | SIP Signaling (USATA) |
| sip.messagenet.it | 5061 | SIP Signaling (alternativa) |

---

## 📋 CONFIGURAZIONE TENANT DEMO

### Database

```sql
-- Tenant
SELECT id, slug, sip_domain FROM tenants WHERE slug='demo';
42b7b735-7994-4c54-a451-6ba67cb68f60 | demo | demo.edgvoip.it

-- Estensioni
SELECT extension, password, tenant_id FROM extensions 
WHERE tenant_id='42b7b735-7994-4c54-a451-6ba67cb68f60';
2000 | test123456 | 42b7b735...
2001 | test123456 | 42b7b735...

-- SIP Trunk
SELECT name, provider, sip_config FROM sip_trunks
WHERE tenant_id='42b7b735-7994-4c54-a451-6ba67cb68f60';
Messagenet Trunk | Messagenet | {"server": "sip.messagenet.it", "port": 5060, ...}
```

### FreeSWITCH Files

```
/usr/local/freeswitch/etc/freeswitch/
├── directory/domain/demo.edgvoip.it.xml
│   ├── User 2000: password=test123456, user_context=demo.edgvoip.it
│   └── User 2001: password=test123456, user_context=demo.edgvoip.it
│
├── dialplan/demo.edgvoip.it.xml
│   ├── demo_local_extensions: 2[0-9]{3} → user/X@demo.edgvoip.it
│   └── demo_outbound_italian_mobile: 3\d{9} → sofia/gateway/messagenet_demo/+39X
│
└── sip_profiles/internal/messagenet_demo.xml
    ├── proxy: sip.messagenet.it:5060
    ├── username: 5406594427
    ├── password: UjcHYnZa
    ├── extension: 0686356924
    └── from-user: 5406594427
```

---

## 🔬 DEBUGGING AVANZATO

### Comando 1: Cattura Pacchetto SIP Completo

```bash
# SSH su server
ssh root@93.93.113.13

# Console FreeSWITCH
/usr/local/freeswitch/bin/fs_cli

# Abilita SIP trace
> sofia global siptrace on
> sofia profile internal siptrace on
> console loglevel 9

# Fai chiamata dal softphone...
# Vedrai TUTTO il traffico SIP
```

### Comando 2: Test Bridge Manuale

```bash
fs_cli

# Test gateway diretto
> originate sofia/gateway/messagenet_demo/+393297626144 &echo

# Se funziona = dialplan OK, problema solo routing
# Se non funziona = problema gateway/credenziali
```

### Comando 3: Verifica Variabili Canale

```bash
fs_cli

# Durante una chiamata attiva
> show channels

# Dettagli canale specifico
> uuid_dump <UUID>

# Vedrai TUTTE le variabili incluso effective_caller_id_number
```

---

## 💡 POSSIBILI SOLUZIONI

### Soluzione 1: Rimuovi +39 dal Numero Chiamato

**Modifica dialplan:**
```xml
<!-- PRIMA -->
<action application="bridge" data="sofia/gateway/messagenet_demo/+39$1"/>

<!-- DOPO -->
<action application="bridge" data="sofia/gateway/messagenet_demo/$1"/>
```

**Risultato:** Invia `3297626144` invece di `+393297626144`

### Soluzione 2: Usa 0039 invece di +39

```xml
<action application="bridge" data="sofia/gateway/messagenet_demo/0039$1"/>
```

**Risultato:** Invia `00393297626144`

### Soluzione 3: Aggiungi Prefix al Gateway

**Nel file gateway:**
```xml
<param name="outbound-prefix" value="+39"/>
```

**Nel dialplan:**
```xml
<action application="bridge" data="sofia/gateway/messagenet_demo/$1"/>
```

FreeSWITCH aggiunge automaticamente +39 davanti

### Soluzione 4: Usa Extension del Gateway come CallerID

**Nel dialplan:**
```xml
<!-- NON impostare effective_caller_id_number -->
<!-- Lascia che il gateway usi il suo "extension" parameter -->
<action application="unset" data="effective_caller_id_number"/>
<action application="bridge" data="sofia/gateway/messagenet_demo/$1"/>
```

Il gateway userà `extension=0686356924` come CallerID

---

## 🎯 PROSSIMI PASSI DIAGNOSTICI

### Step 1: Cattura INVITE SIP Reale

**Esegui ORA:**
```bash
ssh root@93.93.113.13
/usr/local/freeswitch/bin/fs_cli

> sofia profile internal siptrace on
> console loglevel 9

# Fai chiamata a 3297626144
# Copia l'output completo dell'INVITE
```

**Cerchiamo nel pacchetto SIP:**
```
INVITE sip:XXXXXX@sip.messagenet.it SIP/2.0
From: <sip:XXXXXX@sip.messagenet.it>
To: <sip:XXXXXX@sip.messagenet.it>
P-Asserted-Identity: ...
```

### Step 2: Verifica Account Messagenet

**Domande per l'utente:**
1. L'account Messagenet è prepagato o postpagato?
2. C'è credito sufficiente?
3. Le chiamate uscenti sono abilitate?
4. Hai mai fatto chiamate uscenti con questo account?
5. Il numero `0686356924` è il tuo DID principale?

### Step 3: Test Numero Diverso

**Prova a chiamare:**
- Un numero fisso: `0686356924` (il tuo DID)
- Un servizio gratuito: `800123456`
- Emergency: `112` o `118`

Se uno funziona = problema formato numero specifico

---

## 📊 STATO CONFIGURAZIONE ATTUALE

### ✅ CORRETTO

- Profilo internal: porta 5060
- Estensioni 2000, 2001: registrate su demo.edgvoip.it
- Chiamate interne: FUNZIONANO
- Gateway messagenet_demo: REGISTRATO (REGED)
- Firewall: porte 5060, 5080, 10000-20000 aperte
- CallerID: 0686356924 (senza +39)
- Numero chiamato: +39 + numero

### ❌ NON FUNZIONA

- Chiamate esterne via Messagenet
- Risposta: 403 Forbidden
- Causa: Da determinare

### ⏳ DA TESTARE

- [ ] Formato numero senza +39: `3297626144`
- [ ] Formato con 0039: `00393297626144`
- [ ] Echo test: `9196`
- [ ] CallerID diverso
- [ ] Account Messagenet attivo?

---

## 🎓 CONOSCENZE PROFESSIONALI ACQUISITE

### FreeSWITCH Architecture

**Profili SIP:**
- Ogni profilo = un user agent separato
- Profilo bind a IP:PORT specifico
- Profili possono avere gateway associati

**Gateway:**
- Gateway = connection a provider esterno
- Sintassi bridge: `sofia/gateway/NOME_GATEWAY/NUMERO`
- Gateway può essere in qualsiasi profilo
- Registrazione separata per ogni gateway

**Dialplan:**
- Context = insieme di extension rules
- Extension = regola di matching
- Condition = if statement
- Action = cosa fare se match
- Transfer = cambio context

**Directory:**
- Domain = SIP domain (es. demo.edgvoip.it)
- User = estensione/utente
- user_context = quale dialplan context usare
- Variabili utente = disponibili nel dialplan

**Multi-Tenancy:**
- Ogni tenant = proprio SIP domain
- Ogni domain = proprio context dialplan
- Isolamento completo tra tenant
- Gateway possono essere condivisi o tenant-specific

---

## 📝 DOMANDE PER L'UTENTE

Per risolvere il 403 Forbidden, ho bisogno di sapere:

1. **L'account Messagenet può fare chiamate USCENTI?**
   - Alcuni account sono solo per ricezione

2. **Hai credito sufficiente?**
   - Se prepagato, serve credito

3. **Qual è il formato numero corretto?**
   - Prova: `3297626144` (senza +39)
   - Prova: `+393297626144` (con +39)
   - Prova: `00393297626144` (con 0039)

4. **Hai documentazione da Messagenet?**
   - Email di attivazione
   - Manuale configurazione
   - Esempi di chiamata

---

## 🚀 COMANDO TEST IMMEDIATO

**Esegui questo per vedere ESATTAMENTE cosa invii a Messagenet:**

```bash
ssh root@93.93.113.13
/usr/local/freeswitch/bin/fs_cli

> sofia profile internal siptrace on
> console loglevel 9

# Fai chiamata a 3297626144 dal softphone
# Cerca nel log:

INVITE sip:XXXXXXX@sip.messagenet.it
From: <sip:XXXXXXX@sip.messagenet.it>
P-Asserted-Identity: <sip:XXXXXXX@sip.messagenet.it>

# Copia TUTTO l'output e inviamelo
```

**Questo mi dirà ESATTAMENTE:**
- Formato numero destinazione inviato
- CallerID usato  
- Headers SIP
- Risposta esatta di Messagenet (non solo 403, ma anche motivo)

---

**Vuoi che esegua io il comando di cattura SIP trace oppure vuoi prima verificare l'account Messagenet?**

