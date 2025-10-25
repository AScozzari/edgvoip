# ✅ CONFIGURAZIONE FINALE - PORTE E DIALPLAN TENANT DEMO

## 🔥 FIREWALL - PORTE APERTE

### Porte Configurate sul Server (iptables)

```bash
✅ 5060/TCP  - SIP Signaling (Estensioni Interne)
✅ 5060/UDP  - SIP Signaling (Estensioni Interne)
✅ 5080/TCP  - SIP Signaling (Trunk Esterni)
✅ 5080/UDP  - SIP Signaling (Trunk Esterni)
✅ 10000-20000/TCP - RTP Media Streams
✅ 10000-20000/UDP - RTP Media Streams (PRINCIPALE)
```

**Comando usato:**
```bash
iptables -I INPUT -p tcp --dport 5060 -j ACCEPT
iptables -I INPUT -p udp --dport 5060 -j ACCEPT
iptables -I INPUT -p tcp --dport 5080 -j ACCEPT
iptables -I INPUT -p udp --dport 5080 -j ACCEPT
iptables -I INPUT -p udp --dport 10000:20000 -j ACCEPT
iptables -I INPUT -p tcp --dport 10000:20000 -j ACCEPT
```

---

## 📡 ARCHITETTURA PORTE FREESWITCH

### Profilo INTERNAL - Porta 5060

```
Profilo: internal
Porta: 5060 (UDP + TCP)
Bind: 93.93.113.13:5060
Uso: ESTENSIONI INTERNE

Estensioni:
├─ 2000@demo.edgvoip.it → Tenant DEMO
├─ 2001@demo.edgvoip.it → Tenant DEMO
├─ 1000@edgvoip.it → Tenant MASTER
└─ 1001@edgvoip.it → Tenant MASTER
```

### Profilo EXTERNAL - Porta 5080

```
Profilo: external
Porta: 5080 (UDP + TCP)
Bind: 93.93.113.13:5080
Uso: TRUNK SIP ESTERNI (Provider)

Gateway:
└─ messagenet_demo
   ├─ Server: sip.messagenet.it:5061
   ├─ Username: 5406594427
   ├─ DID: +390686356924
   ├─ Tenant: demo (42b7b735...)
   └─ Status: REGISTERING
```

### Porte RTP - Range 10000-20000

```
Protocollo: UDP (principalmente)
Range: 10000-20000
Bind: 93.93.113.13
Uso: AUDIO/VIDEO delle chiamate

FreeSWITCH assegna 2 porte per ogni chiamata:
├─ 1 porta RTP in entrata
└─ 1 porta RTP in uscita

Esempio:
Chiamata 1: usa porte 10024, 10025
Chiamata 2: usa porte 10026, 10027
```

---

## 👥 TENANT DEMO - CONFIGURAZIONE DATABASE

### Tenant

```sql
SELECT id, name, slug, sip_domain FROM tenants WHERE slug = 'demo';
```

| ID | Nome | Slug | SIP Domain |
|----|------|------|------------|
| 42b7b735-7994-4c54-a451-6ba67cb68f60 | Demo Tenant | demo | demo.edgvoip.it |

### Estensioni

```sql
SELECT extension, password, tenant_id 
FROM extensions 
WHERE tenant_id = '42b7b735-7994-4c54-a451-6ba67cb68f60';
```

| Extension | Password | Tenant ID |
|-----------|----------|-----------|
| 2000 | test123456 | 42b7b735... |
| 2001 | test123456 | 42b7b735... |

### SIP Trunk

```sql
SELECT name, provider, sip_config->>'server' as server, 
       sip_config->>'port' as port, tenant_id
FROM sip_trunks 
WHERE tenant_id = '42b7b735-7994-4c54-a451-6ba67cb68f60';
```

| Nome | Provider | Server | Porta | Tenant |
|------|----------|--------|-------|--------|
| Messagenet Trunk | Messagenet | sip.messagenet.it | 5061 | 42b7b735... |

---

## 📂 CONFIGURAZIONE FREESWITCH FILES

### Directory Structure

```
/usr/local/freeswitch/etc/freeswitch/
├── directory/
│   ├── demo.edgvoip.it.xml          ← Domain config
│   └── demo.edgvoip.it/
│       ├── 2000.xml                 ← User 2000
│       └── 2001.xml                 ← User 2001
│
├── dialplan/
│   └── default/
│       └── demo_dialplan.xml        ← Dialplan tenant demo
│
└── sip_profiles/
    ├── internal.xml                 ← Porta 5060 (estensioni)
    ├── internal/
    │   └── (vuota - gateway spostati)
    │
    ├── external.xml                 ← Porta 5080 (trunk)
    └── external/
        └── messagenet_demo.xml      ← Gateway Messagenet
```

### File: demo.edgvoip.it.xml

```xml
<domain name="demo.edgvoip.it">
  <variables>
    <variable name="tenant_id" value="42b7b735-7994-4c54-a451-6ba67cb68f60"/>
    <variable name="tenant_slug" value="demo"/>
    <variable name="domain_name" value="demo.edgvoip.it"/>
  </variables>
  
  <groups>
    <group name="default">
      <users>
        <X-PRE-PROCESS cmd="include" data="demo.edgvoip.it/*.xml"/>
      </users>
    </group>
  </groups>
</domain>
```

### File: demo.edgvoip.it/2000.xml

```xml
<user id="2000">
  <params>
    <param name="password" value="test123456"/>
  </params>
  <variables>
    <variable name="tenant_id" value="42b7b735-7994-4c54-a451-6ba67cb68f60"/>
    <variable name="tenant_slug" value="demo"/>
    <variable name="domain_name" value="demo.edgvoip.it"/>
    <variable name="user_context" value="demo.edgvoip.it"/> ← CRITICO!
    <variable name="effective_caller_id_name" value="Demo 2000"/>
    <variable name="effective_caller_id_number" value="2000"/>
    <variable name="outbound_caller_id_number" value="+390686356924"/>
  </variables>
</user>
```

**Variabile CRITICA:** `user_context = demo.edgvoip.it`

Questa variabile dice a FreeSWITCH di usare il dialplan context `demo.edgvoip.it` invece di `public`!

---

## 🎯 DIALPLAN - ROUTING CHIAMATE

### Context: demo.edgvoip.it

**File:** `/usr/local/freeswitch/etc/freeswitch/dialplan/default/demo_dialplan.xml`

```xml
<context name="demo.edgvoip.it">
  
  <!-- 1. Chiamate INTERNE: 2000-2999 -->
  <extension name="demo_local_extensions">
    <condition field="destination_number" expression="^(2[0-9]{3})$">
      <action application="set" data="tenant_id=42b7b735..."/>
      <action application="bridge" data="user/${destination_number}@demo.edgvoip.it"/>
    </condition>
  </extension>
  
  <!-- 2. Chiamate MOBILI ITALIA: 3xxxxxxxxx -->
  <extension name="demo_outbound_italian_mobile">
    <condition field="destination_number" expression="^(3\d{9})$">
      <action application="set" data="effective_caller_id_number=+390686356924"/>
      <action application="bridge" data="sofia/gateway/messagenet_demo/$1"/>
    </condition>
  </extension>
  
  <!-- 3. Chiamate FISSI ITALIA: 0xxxxxxxxx -->
  <extension name="demo_outbound_italian_landline">
    <condition field="destination_number" expression="^(0\d{6,10})$">
      <action application="set" data="effective_caller_id_number=+390686356924"/>
      <action application="bridge" data="sofia/gateway/messagenet_demo/$1"/>
    </condition>
  </extension>
  
  <!-- 4. Chiamate INTERNAZIONALI: 00xxxxxxxxxxx -->
  <extension name="demo_outbound_international">
    <condition field="destination_number" expression="^(00\d{10,15})$">
      <action application="set" data="effective_caller_id_number=+390686356924"/>
      <action application="bridge" data="sofia/gateway/messagenet_demo/$1"/>
    </condition>
  </extension>
  
</context>
```

---

## 🔄 FLUSSO CHIAMATA COMPLETO

### Scenario 1: Chiamata Interna 2000 → 2001

```
1. Utente preme CALL su softphone 2000
   ├─ Destination: 2001
   └─ Domain: demo.edgvoip.it

2. SIP INVITE inviato
   ├─ From: sip:2000@demo.edgvoip.it
   ├─ To: sip:2001@demo.edgvoip.it
   ├─ Server: 93.93.113.13:5060
   └─ Porta Softphone: random (es. 35060)

3. FreeSWITCH Profilo INTERNAL (porta 5060)
   ├─ Riceve INVITE
   ├─ Autentica: 2000@demo.edgvoip.it ✅
   └─ Carica variabili utente da 2000.xml

4. Determina Context Dialplan
   ├─ Legge: user_context = demo.edgvoip.it
   └─ Usa dialplan context: demo.edgvoip.it

5. Matching Dialplan
   ├─ Context: demo.edgvoip.it
   ├─ Destination: 2001
   ├─ Extension: demo_local_extensions
   ├─ Regex: ^(2[0-9]{3})$ → MATCH ✅
   └─ Action: bridge user/2001@demo.edgvoip.it

6. FreeSWITCH cerca 2001
   ├─ Domain: demo.edgvoip.it
   ├─ User: 2001
   ├─ Registrato: 194.79.203.34:58601 (TCP)
   └─ Invia INVITE a 2001

7. SIP INVITE a 2001
   ├─ To: sip:2001@194.79.203.34:58601
   ├─ From: sip:2000@demo.edgvoip.it
   └─ Via: Profilo internal (porta 5060)

8. Softphone 2001 Risponde
   ├─ 180 Ringing
   └─ 200 OK

9. Negoziazione RTP
   ├─ FreeSWITCH alloca porte RTP: es. 10024, 10025
   ├─ Softphone 2000: usa porta es. 20000
   ├─ Softphone 2001: usa porta es. 20001
   └─ Stream audio: 2000 ↔ FreeSWITCH ↔ 2001

10. Conversazione
    ├─ Audio da 2000 → FreeSWITCH (porta 10024 UDP)
    └─ Audio da FreeSWITCH → 2001 (porta 10025 UDP)

11. Hangup
    ├─ BYE inviato
    └─ Chiamata terminata
```

**Porte utilizzate:**
- SIP Signaling: 5060 TCP/UDP
- RTP Audio 2000: 10024 UDP
- RTP Audio 2001: 10025 UDP

---

### Scenario 2: Chiamata Esterna 2000 → 3297626144 (Mobile)

```
1. Softphone 2000 chiama 3297626144
   ├─ INVITE to: sip:3297626144@demo.edgvoip.it
   └─ Via profilo internal (porta 5060)

2. FreeSWITCH Context: demo.edgvoip.it
   ├─ Destination: 3297626144
   ├─ Extension: demo_outbound_italian_mobile
   ├─ Regex: ^(3\d{9})$ → MATCH ✅
   └─ Action: bridge sofia/gateway/messagenet_demo/3297626144

3. FreeSWITCH → Gateway Messagenet
   ├─ Profilo: external (porta 5080)
   ├─ Gateway: messagenet_demo
   ├─ Server: sip.messagenet.it:5061
   └─ INVITE From: +390686356924

4. Messagenet → Rete Mobile
   ├─ CallerID: +39 06 8635 6924
   ├─ Destination: 329 762 6144
   └─ Routing su rete TIM/Vodafone/Wind

5. Mobile Squilla
   ├─ Numero visualizzato: +39 06 8635 6924
   └─ Risponde: 200 OK

6. Conversazione Audio
   ├─ Softphone 2000 ↔ FreeSWITCH (porta 5060, RTP 10024)
   └─ FreeSWITCH ↔ Messagenet (porta 5080, RTP 10025)
```

**Porte utilizzate:**
- SIP Signaling interno: 5060 UDP
- SIP Signaling trunk: 5080 UDP
- RTP Audio: 10024, 10025 UDP

---

## 📊 STATUS SISTEMA ATTUALE

### FreeSWITCH Profiles

```bash
fs_cli -x "sofia status"
```

**Output:**
```
Name         Type     Data                              State
====================================================================
internal     profile  sip:mod_sofia@93.93.113.13:5060  RUNNING (0)
external     profile  sip:mod_sofia@93.93.113.13:5080  RUNNING (0)
```

### Registrazioni Estensioni

```bash
fs_cli -x "show registrations"
```

**Output:**
```
2000,demo.edgvoip.it,...,sofia/internal/sip:2000@148.251.28.182:35060,...
2001,demo.edgvoip.it,...,sofia/internal/sip:2001@194.79.203.34:58601,...
```

✅ Entrambe registrate su profilo **internal** (porta 5060)

### Gateway Status

```bash
fs_cli -x "sofia status gateway external/messagenet_demo"
```

**Status:** REGISTERING/REGED
**Porta usata:** 5080 (profilo external)

---

## 🧪 TEST CHIAMATE

### Test 1: Chiamata Interna 2000 → 2001

**Dal softphone 2000 chiama:** `2001`

**Comportamento atteso:**
```
1. Softphone 2001 squilla
2. CallerID mostrato: "Demo 2000" (2000)
3. Risposta: conversazione audio OK
4. Hangup: chiamata termina
```

**Porte utilizzate:**
- 5060/UDP: SIP signaling
- 10000-20000/UDP: RTP audio

---

### Test 2: Chiamata Mobile 2000 → 329 762 6144

**Dal softphone 2000 chiama:** `3297626144`

**Comportamento atteso:**
```
1. FreeSWITCH routing via messagenet_demo
2. Mobile 329 762 6144 squilla
3. CallerID mostrato: +39 06 8635 6924
4. Risposta: conversazione audio OK
5. Hangup: chiamata termina
```

**Porte utilizzate:**
- 5060/UDP: SIP signaling (interno)
- 5080/UDP: SIP signaling (trunk Messagenet)
- 10000-20000/UDP: RTP audio

---

### Test 3: Echo Test 2000 → 9196

**Dal softphone 2000 chiama:** `9196`

**Comportamento atteso:**
```
1. Sistema risponde automaticamente
2. Audio: "You have reached the echo test..."
3. Parli nel microfono
4. Senti immediatamente la tua voce (echo)
5. Hangup
```

Se NON senti la tua voce = **Problema porte RTP bloccate**

---

## 🔍 DEBUG CHIAMATE - MONITORAGGIO LIVE

### Comando 1: Monitora Log in Tempo Reale

```bash
ssh root@93.93.113.13
tail -f /usr/local/freeswitch/var/log/freeswitch/freeswitch.log
```

Mentre monitorizioè il log, fai una chiamata dal softphone e osserva:

```
[NOTICE] New Channel sofia/internal/2000@demo.edgvoip.it
Dialplan: sofia/internal/2000@demo.edgvoip.it parsing [demo.edgvoip.it->...]
```

✅ Se vedi `parsing [demo.edgvoip.it->...]` = CONTEXT CORRETTO!
❌ Se vedi `parsing [public->...]` = CONTEXT SBAGLIATO!

---

### Comando 2: Console FreeSWITCH Interattiva

```bash
/usr/local/freeswitch/bin/fs_cli

# Abilita debug dialplan
> console loglevel 7

# Fai una chiamata dal softphone...

# Vedrai output come:
Dialplan: demo.edgvoip.it regex (PASS) [demo_local_extensions] destination_number(2001) =~ /^(2[0-9]{3})$/
EXECUTE [depth=0] bridge user/2001@demo.edgvoip.it
```

✅ `regex (PASS)` = Dialplan match OK
❌ `regex (FAIL)` = Numero non match

---

### Comando 3: Test Bridge Manuale

```bash
fs_cli

> originate user/2000@demo.edgvoip.it &echo
```

Se senti l'echo = User 2000 funziona correttamente

---

## 📞 CONFIGURAZIONE SOFTPHONE (CLIENT)

### Estensione 2000 (Tenant Demo)

```
Account Name:     Demo 2000
Display Name:     Demo 2000

Server/Domain:    93.93.113.13    ← IP SERVER
Port:             5060             ← PORTA INTERNAL
Transport:        UDP (o TCP)

Username:         2000
Auth Username:    2000
Password:         test123456

SIP Domain:       demo.edgvoip.it  ← CRITICO!
SIP URI:          sip:2000@demo.edgvoip.it

Outbound Proxy:   (vuoto o 93.93.113.13:5060)
```

**CRITICO:** Il campo "SIP Domain" o "Realm" DEVE essere `demo.edgvoip.it`!

### Estensione 2001 (Tenant Demo)

```
Account Name:     Demo 2001
Server:           93.93.113.13
Port:             5060
Username:         2001
Password:         test123456
SIP Domain:       demo.edgvoip.it
```

---

## ⚠️ TROUBLESHOOTING

### Problema: Chiamata rifiutata immediatamente

**Log:**
```
[WARNING] IP xxx.xxx.xxx.xxx Rejected by acl "domains"
[NOTICE] Hangup [CALL_REJECTED]
```

**Causa:** ACL bloccante (già risolto)
**Soluzione:** ACL disabilitato in `internal.xml`

---

### Problema: "has executed the last dialplan instruction, hanging up"

**Log:**
```
Dialplan: parsing [public->...]
has executed the last dialplan instruction, hanging up
Hangup [NORMAL_CLEARING]
```

**Causa:** Context sbagliato (usa `public` invece di `demo.edgvoip.it`)
**Soluzione:** Verificare `user_context` in file utente XML

---

### Problema: Chiamata connette ma nessun audio

**Sintomo:**
- Chiamata squilla e risponde
- Entrambi i lati non sentono nulla

**Causa:** Porte RTP bloccate (10000-20000 UDP)
**Soluzione:**
```bash
iptables -I INPUT -p udp --dport 10000:20000 -j ACCEPT
```

**Verifica:**
```bash
iptables -L INPUT -n | grep 10000
```

---

### Problema: Gateway Messagenet TRYING (non REGED)

**Log:**
```
external::messagenet_demo  gateway  TRYING (retry: 30s)
[WARNING] Timeout Registering messagenet_demo
```

**Cause possibili:**
1. Porta 5080 bloccata (già aperta ✅)
2. Credenziali errate
3. Server Messagenet irraggiungibile

**Verifica:**
```bash
# Test connettività a Messagenet
ping sip.messagenet.it

# Test porta 5061
nc -zvu sip.messagenet.it 5061
```

---

## ✅ CHECKLIST SISTEMA

- [x] **Firewall:** Porte 5060, 5080, 10000-20000 aperte
- [x] **Profilo Internal:** Porta 5060, estensioni interne
- [x] **Profilo External:** Porta 5080, trunk esterni
- [x] **Estensioni:** 2000, 2001 registrate
- [x] **Directory:** File XML con `user_context=demo.edgvoip.it`
- [x] **Dialplan:** Context `demo.edgvoip.it` caricato
- [x] **Gateway:** messagenet_demo su profilo external
- [ ] **Test:** Chiamata interna 2000 → 2001
- [ ] **Test:** Chiamata esterna 2000 → mobile
- [ ] **Test:** Echo test 2000 → 9196

---

## 🚀 PROSSIMI PASSI

### 1. Test Chiamata Interna

**Prova ORA dal softphone:**
```
Da 2000 chiama: 2001
```

Monitora log:
```bash
ssh root@93.93.113.13
tail -f /usr/local/freeswitch/var/log/freeswitch/freeswitch.log | grep -i demo
```

---

### 2. Test Chiamata Mobile

**Prova:**
```
Da 2000 chiama: 3297626144
```

Verifica CallerID visualizzato sul mobile: `+39 06 8635 6924`

---

### 3. Test Echo

**Prova:**
```
Da 2000 chiama: 9196
```

Parla e verifica di sentire la tua voce.

---

## 📋 RIEPILOGO PORTE

| Porta | Protocollo | Servizio | Uso | Firewall |
|-------|------------|----------|-----|----------|
| **5060** | TCP+UDP | FreeSWITCH Internal | Estensioni 2000,2001 | ✅ Aperta |
| **5080** | TCP+UDP | FreeSWITCH External | Trunk Messagenet | ✅ Aperta |
| **10000-20000** | UDP | RTP Media | Audio chiamate | ✅ Aperta |
| **10000-20000** | TCP | RTP/RTCP | Controllo stream | ✅ Aperta |
| 5066 | TCP | WebSocket | WebRTC (futuro) | ⏳ Chiusa |
| 7443 | TCP | WebSocket Secure | WebRTC HTTPS | ⏳ Chiusa |
| 8021 | TCP | Event Socket | API interna | ⚠️ Solo localhost |

---

**PROVA ORA UNA CHIAMATA E DIMMI COSA SUCCEDE!** 📞

Monitora i log con:
```bash
ssh root@93.93.113.13
/usr/local/freeswitch/bin/fs_cli
> console loglevel 7
```

Poi chiama dal softphone 2000 al 2001 e guarda l'output!

