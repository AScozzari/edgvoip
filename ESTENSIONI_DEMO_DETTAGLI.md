# 📞 ESTENSIONI TENANT DEMO - DETTAGLI COMPLETI

**Server:** 93.93.113.13  
**Tenant:** demo  
**SIP Domain:** demo.edgvoip.it  
**Data Creazione:** 25 Ottobre 2025  

---

## 🎯 ESTENSIONI CREATE

### Estensione 2000

| Parametro | Valore |
|-----------|--------|
| **Username** | `2000` |
| **Password** | `test123456` |
| **Display Name** | Demo Extension 2000 |
| **Domain** | demo.edgvoip.it |
| **Full SIP URI** | sip:2000@demo.edgvoip.it |
| **Status** | active ✅ |
| **Context** | demo.edgvoip.it |
| **Callgroup** | demo |
| **Tenant ID** | 42b7b735-7994-4c54-a451-6ba67cb68f60 |

### Estensione 2001

| Parametro | Valore |
|-----------|--------|
| **Username** | `2001` |
| **Password** | `test123456` |
| **Display Name** | Demo Extension 2001 |
| **Domain** | demo.edgvoip.it |
| **Full SIP URI** | sip:2001@demo.edgvoip.it |
| **Status** | active ✅ |
| **Context** | demo.edgvoip.it |
| **Callgroup** | demo |
| **Tenant ID** | 42b7b735-7994-4c54-a451-6ba67cb68f60 |

---

## 🔧 CONFIGURAZIONE CLIENT SIP

### Parametri Server

```
SIP Server: 93.93.113.13
SIP Port: 5060
Transport: UDP (raccomandato) o TCP
Domain: demo.edgvoip.it
```

### Configurazione Estensione 2000

```
Account Name: Demo 2000
Username: 2000
Password: test123456
Domain/Realm: demo.edgvoip.it
SIP Server/Proxy: 93.93.113.13
Port: 5060
Transport: UDP
```

### Configurazione Estensione 2001

```
Account Name: Demo 2001
Username: 2001
Password: test123456
Domain/Realm: demo.edgvoip.it
SIP Server/Proxy: 93.93.113.13
Port: 5060
Transport: UDP
```

---

## 📱 CONFIGURAZIONE SOFTPHONE

### Zoiper (Desktop/Mobile)

1. **Aggiungi Account**
   - Tipo: SIP
   - Host: `93.93.113.13`
   - Username: `2000` (o `2001`)
   - Password: `test123456`
   - Domain: `demo.edgvoip.it`
   - Outbound Proxy: (vuoto)
   - Port: `5060`
   - Transport: UDP

2. **Opzioni Avanzate**
   - STUN: Disabilitato
   - NAT Traversal: Auto
   - Audio Codec: OPUS, G722, PCMU, PCMA
   - DTMF: RFC2833

### Linphone (Desktop/Mobile)

1. **Aggiungi Account SIP**
   - Username: `2000` (o `2001`)
   - Password: `test123456`
   - Domain: `demo.edgvoip.it`
   - Transport: UDP
   - Server Address: `93.93.113.13`

2. **Preferenze Audio**
   - Codec preferiti: OPUS, G722, PCMU

### MicroSIP (Windows)

1. **Add Account**
   - Account Name: Demo 2000
   - SIP Server: `93.93.113.13`
   - SIP Proxy: `93.93.113.13`
   - Username: `2000`
   - Domain: `demo.edgvoip.it`
   - Login: `2000`
   - Password: `test123456`
   - Port: `5060`

---

## 🔊 CODEC SUPPORTATI (in ordine di priorità)

| Codec | Bitrate | Descrizione | Qualità |
|-------|---------|-------------|---------|
| **OPUS** | 6-510 kbps | Audio HD, adattivo | ⭐⭐⭐⭐⭐ Eccellente |
| **G.722** | 64 kbps | Wideband audio | ⭐⭐⭐⭐ Ottimo |
| **PCMU** | 64 kbps | G.711 μ-law | ⭐⭐⭐ Buono |
| **PCMA** | 64 kbps | G.711 A-law | ⭐⭐⭐ Buono |

**DTMF:** RFC2833 (payload type 101)

---

## 📞 NUMERI DI TEST

| Numero | Funzione | Descrizione |
|--------|----------|-------------|
| **2000** | Estensione | Chiama l'estensione 2000 |
| **2001** | Estensione | Chiama l'estensione 2001 |
| **9196** | Echo Test | Test audio echo |
| **9664** | Hold Music | Test musica di attesa |

---

## 🧪 TEST DI FUNZIONAMENTO

### Test 1: Registrazione SIP

1. Configura softphone con credenziali estensione 2000
2. Attendi la registrazione
3. Verifica sul server:
```bash
fs_cli -x "show registrations"
```

**Risultato atteso:**
```
Reg-User: 2000
Realm: demo.edgvoip.it
Contact: sip:2000@[IP_CLIENT]:port
Status: Registered
```

### Test 2: Chiamata tra Estensioni

1. Registra entrambe le estensioni (2000 e 2001)
2. Da 2000 chiama: `2001`
3. Risposta su 2001
4. Verifica audio bidirezionale

**Risultato atteso:**
- ✅ Squillo su 2001
- ✅ Audio chiaro in entrambe le direzioni
- ✅ DTMF funzionante

### Test 3: Echo Test

1. Da 2000 chiama: `9196`
2. Parla nel microfono
3. Ascolta l'echo

**Risultato atteso:**
- ✅ Riproduzione immediata di ciò che dici

### Test 4: Hold Music

1. Da 2000 chiama: `9664`
2. Ascolta la musica di attesa

**Risultato atteso:**
- ✅ Riproduzione music on hold

---

## 🔐 SICUREZZA

### Autenticazione
- ✅ **SIP Authentication:** Enabled
- ✅ **Challenge Realm:** auto_from
- ✅ **Password Min Length:** 10 caratteri ✅
- ✅ **Accept Blind Reg:** Disabled
- ✅ **Accept Blind Auth:** Disabled

### Network Security
- ✅ **ACL:** localnet.auto configurato
- ✅ **NAT Detection:** Aggressive (enabled)
- ✅ **NDLB-force-rport:** Enabled

---

## 🌐 ACCESSO WEB

### Login Tenant Demo

**URL:** `http://edgvoip.it/demo/login`  
**URL Alternativo:** `http://93.93.113.13/demo/login`

**Credenziali Admin Tenant:** (da configurare via backend)

---

## 📊 MONITORAGGIO

### Verifica Registrazioni (da server)
```bash
fs_cli -x "sofia status profile internal reg"
fs_cli -x "show registrations"
```

### Verifica Chiamate Attive
```bash
fs_cli -x "show channels"
fs_cli -x "show calls"
```

### Log in Tempo Reale
```bash
fs_cli -x "console loglevel debug"
tail -f /usr/local/freeswitch/var/log/freeswitch/freeswitch.log
```

### Statistiche Tenant Demo
```bash
fs_cli -x "list_users demo.edgvoip.it"
```

---

## 📝 DIALPLAN CONFIGURATO

### Context: demo.edgvoip.it

**Chiamate Interne (1000-1999):**
```xml
Pattern: ^(1[0-9]{3})$
Actions:
  - Set call_direction=internal
  - Set tenant_id=42b7b735-7994-4c54-a451-6ba67cb68f60
  - Set tenant_slug=demo
  - Bridge to user/${destination_number}@demo.edgvoip.it
  - Fallback to voicemail
```

**Echo Test (9196):**
```xml
Pattern: ^9196$
Action: Echo application
```

**Hold Music (9664):**
```xml
Pattern: ^9664$
Action: Play hold music
```

---

## 🔄 AGGIUNTA NUOVE ESTENSIONI

### Via Database
```sql
INSERT INTO extensions (id, tenant_id, extension, password, display_name, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  t.id,
  '2002',  -- Nuovo numero
  'test123456',
  'Demo Extension 2002',
  'active',
  NOW(),
  NOW()
FROM tenants t
WHERE t.slug = 'demo';
```

### Rigenerare Config FreeSWITCH
```bash
/var/www/voip-system/generate-freeswitch-config.sh
fs_cli -x "reloadxml"
```

---

## 📞 ESEMPIO CONFIGURAZIONE COMPLETA

### Zoiper 5 (Esempio Completo)

```
╔════════════════════════════════════════════╗
║     ZOIPER - ACCOUNT SIP CONFIGURATION     ║
╠════════════════════════════════════════════╣
║ Account Name: Demo 2000                    ║
║ ─────────────────────────────────────────  ║
║ Protocol: SIP                              ║
║ ─────────────────────────────────────────  ║
║ Username: 2000                             ║
║ Password: test123456                       ║
║ Domain: demo.edgvoip.it                    ║
║ ─────────────────────────────────────────  ║
║ SIP Settings:                              ║
║   Host: 93.93.113.13                       ║
║   Port: 5060                               ║
║   Transport: UDP                           ║
║   Outbound Proxy: (empty)                  ║
║ ─────────────────────────────────────────  ║
║ Audio Settings:                            ║
║   Codecs: OPUS, G722, PCMU, PCMA           ║
║   DTMF: RFC2833                            ║
║   Payload: 101                             ║
║ ─────────────────────────────────────────  ║
║ NAT Settings:                              ║
║   STUN: Disabled                           ║
║   Keep-alive: 30 seconds                   ║
╚════════════════════════════════════════════╝
```

---

## 🎯 RIEPILOGO QUICK START

### 1️⃣ Installa Softphone
- Zoiper: https://www.zoiper.com/
- Linphone: https://www.linphone.org/
- MicroSIP: https://www.microsip.org/

### 2️⃣ Configura Account
```
Server: 93.93.113.13:5060
Username: 2000 (o 2001)
Password: test123456
Domain: demo.edgvoip.it
```

### 3️⃣ Test Chiamata
- Da 2000 chiama: **2001**
- Da 2001 chiama: **2000**
- Test echo: **9196**

---

## 📊 DATABASE ESTENSIONI

```sql
-- Visualizza tutte le estensioni demo
SELECT 
  extension,
  password,
  display_name,
  status
FROM extensions
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'demo')
ORDER BY extension;
```

**Risultato:**
```
 extension |  password  |    display_name     | status 
-----------+------------+---------------------+--------
 2000      | test123456 | Demo Extension 2000 | active
 2001      | test123456 | Demo Extension 2001 | active
```

---

## 🔑 CREDENZIALI COMPLETE

### Estensione 2000
```json
{
  "username": "2000",
  "password": "test123456",
  "domain": "demo.edgvoip.it",
  "sip_server": "93.93.113.13",
  "sip_port": 5060,
  "transport": "UDP",
  "display_name": "Demo Extension 2000",
  "auth_username": "2000",
  "tenant": "demo",
  "context": "demo.edgvoip.it",
  "codecs": ["OPUS", "G722", "PCMU", "PCMA"],
  "dtmf_mode": "rfc2833"
}
```

### Estensione 2001
```json
{
  "username": "2001",
  "password": "test123456",
  "domain": "demo.edgvoip.it",
  "sip_server": "93.93.113.13",
  "sip_port": 5060,
  "transport": "UDP",
  "display_name": "Demo Extension 2001",
  "auth_username": "2001",
  "tenant": "demo",
  "context": "demo.edgvoip.it",
  "codecs": ["OPUS", "G722", "PCMU", "PCMA"],
  "dtmf_mode": "rfc2833"
}
```

---

## 🎨 STRING DI REGISTRAZIONE SIP

### Estensione 2000
```
sip:2000:test123456@93.93.113.13:5060;transport=udp;domain=demo.edgvoip.it
```

### Estensione 2001
```
sip:2001:test123456@93.93.113.13:5060;transport=udp;domain=demo.edgvoip.it
```

---

## 🌐 URL SISTEMA

### Web Login
```
Tenant Demo: http://edgvoip.it/demo/login
Tenant Master: http://edgvoip.it/edgvoip/login
Backend API: http://edgvoip.it/api/health
```

### API Direct
```
Health: http://93.93.113.13:5000/api/health
Tenants: http://93.93.113.13:5000/api/tenants
Extensions: http://93.93.113.13:5000/api/extensions
```

---

## 📞 COMANDI FREESSWITCH UTILI

### Verifica Registrazioni
```bash
fs_cli -x "sofia status profile internal reg"
fs_cli -x "show registrations"
```

### Verifica Utenti Caricati
```bash
fs_cli -x "list_users demo.edgvoip.it"
```

### Origina Chiamata Test (da server)
```bash
fs_cli -x "originate user/2000@demo.edgvoip.it &echo"
```

### Monitor Chiamate Real-time
```bash
fs_cli
> console loglevel debug
> (watch live calls)
```

### Statistiche
```bash
fs_cli -x "sofia status"
fs_cli -x "status"
fs_cli -x "show channels"
```

---

## 🎯 SCENARIO TEST COMPLETO

### Test 1: Registrazione Singola
1. Configura Zoiper con estensione 2000
2. Verifica registrazione: `fs_cli -x "show registrations"`
3. Dovresti vedere: `2000@demo.edgvoip.it` registered

### Test 2: Chiamata Interna
1. Registra entrambe le estensioni (2000 e 2001)
2. Da 2000 chiama: `2001`
3. Rispondi su 2001
4. Verifica audio bidirezionale
5. Chiudi chiamata

### Test 3: Echo Test
1. Da 2000 chiama: `9196`
2. Parla nel microfono
3. Dovresti sentire immediatamente l'echo
4. Chiudi chiamata

### Test 4: Hold Music
1. Da 2000 chiama: `9664`
2. Ascolta la musica di attesa
3. Chiudi chiamata

---

## 🔍 TROUBLESHOOTING

### Problema: "Registration Failed"
**Causa:** Password errata o server non raggiungibile  
**Soluzione:** 
- Verifica password: `test123456`
- Verifica server: `93.93.113.13:5060`
- Check firewall: `ufw status`

### Problema: "403 Forbidden"
**Causa:** Username o domain errato  
**Soluzione:**
- Username deve essere: `2000` (non 2000@demo.edgvoip.it)
- Domain deve essere: `demo.edgvoip.it`

### Problema: "No Audio"
**Causa:** Firewall blocca porte RTP  
**Soluzione:**
- Apri porte RTP: 16384-32768 UDP
- Verifica NAT traversal nel softphone

### Problema: "Cannot Call"
**Causa:** Dialplan non caricato  
**Soluzione:**
```bash
fs_cli -x "reloadxml"
fs_cli -x "list_users demo.edgvoip.it"
```

---

## 📈 MONITORAGGIO PERFORMANCE

### CPU e Memoria (FreeSWITCH)
```bash
fs_cli -x "status"
# Verifica: min idle cpu 0.00/99.XX%
```

### Chiamate Attive
```bash
fs_cli -x "show channels"
fs_cli -x "show calls count"
```

### Statistiche Codec
```bash
fs_cli -x "sofia status profile internal"
# Verifica CODECS IN e CODECS OUT
```

---

## 🎊 SISTEMA PRONTO!

✅ Estensioni create nel database  
✅ Configurazione FreeSWITCH aggiornata  
✅ Domini multi-tenant attivi  
✅ Dialplan configurato  
✅ Codec OPUS/G722 abilitati  
✅ WebSocket/WSS disponibili  
✅ ESL Event Socket attivo (porta 8021)  

**Le estensioni 2000 e 2001 sono pronte per essere registrate!** 🚀

---

**Generato il:** 25 Ottobre 2025  
**Server:** edgvoip (93.93.113.13)  
**Sistema:** W3 VoIP Multi-tenant v1.0

