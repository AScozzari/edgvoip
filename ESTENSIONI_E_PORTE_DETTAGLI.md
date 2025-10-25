# 📞 ESTENSIONI DEMO E CONFIGURAZIONE PORTE

**Server:** 93.93.113.13  
**Tenant:** demo  
**SIP Domain:** demo.edgvoip.it  
**Data:** 25 Ottobre 2025  

---

## 👥 ESTENSIONI TENANT DEMO

### ✅ Estensione 2000

| Campo | Valore |
|-------|--------|
| **ID Database** | e92652cd-2135-4a0b-a79a-258bd426461c |
| **Extension** | 2000 |
| **Password** | test123456 |
| **Display Name** | Demo Extension 2000 |
| **Domain** | demo.edgvoip.it |
| **SIP URI** | sip:2000@demo.edgvoip.it |
| **Status** | active ✅ |
| **Tenant Slug** | demo |
| **Tenant ID** | 42b7b735-7994-4c54-a451-6ba67cb68f60 |

**Configurazione Softphone:**
```
Server SIP:     93.93.113.13
Porta:          5060
Username:       2000
Password:       test123456
Domain:         demo.edgvoip.it
Transport:      UDP (preferito) o TCP
```

---

### ✅ Estensione 2001

| Campo | Valore |
|-------|--------|
| **ID Database** | 611c4dec-e12a-4e59-a353-56ec43227e22 |
| **Extension** | 2001 |
| **Password** | test123456 |
| **Display Name** | Demo Extension 2001 |
| **Domain** | demo.edgvoip.it |
| **SIP URI** | sip:2001@demo.edgvoip.it |
| **Status** | active ✅ |
| **Tenant Slug** | demo |
| **Tenant ID** | 42b7b735-7994-4c54-a451-6ba67cb68f60 |

**Configurazione Softphone:**
```
Server SIP:     93.93.113.13
Porta:          5060
Username:       2001
Password:       test123456
Domain:         demo.edgvoip.it
Transport:      UDP (preferito) o TCP
```

---

## 🌐 PORTE UTILIZZATE DAL SISTEMA

### 📊 TABELLA COMPLETA PORTE

| Porta | Protocollo | Servizio | Bind Address | Direzione | Descrizione | Firewall Status |
|-------|------------|----------|--------------|-----------|-------------|-----------------|
| **80** | TCP | Nginx | 0.0.0.0 | INBOUND | HTTP Web Server | ✅ Aperta (standard) |
| **5000** | TCP | Node.js Backend | 0.0.0.0 | INBOUND | API REST | ⚠️ Da proteggere |
| **5060** | UDP | FreeSWITCH SIP | 93.93.113.13 | INBOUND/OUTBOUND | **SIP Signaling** | ✅ **APERTA** |
| **5060** | TCP | FreeSWITCH SIP | 93.93.113.13 | INBOUND/OUTBOUND | **SIP Signaling** | ✅ **APERTA** |
| **5066** | TCP | FreeSWITCH | 93.93.113.13 | INBOUND | WebSocket (WS) | ⚠️ Non aperta |
| **5080** | - | **NON USATA** | - | - | **Firewall aperto ma non in uso** | ⚠️ **INUTILE** |
| **7443** | TCP | FreeSWITCH | 93.93.113.13 | INBOUND | WebSocket Secure (WSS) | ⚠️ Non aperta |
| **8021** | TCP | FreeSWITCH ESL | * (all) | INBOUND | Event Socket Layer | ⚠️ Da proteggere |
| **16384-32768** | UDP | FreeSWITCH RTP | 93.93.113.13 | INBOUND/OUTBOUND | **Audio/Video Stream** | ⚠️ **DA APRIRE** |
| **5432** | TCP | PostgreSQL | 127.0.0.1 | LOCAL | Database | ✅ Locale only |

---

## 🔥 CONFIGURAZIONE FIREWALL NECESSARIA

### ✅ PORTE GIÀ APERTE CORRETTAMENTE

```bash
# Già configurate dall'utente:
5060/UDP  ✅ - SIP Signaling (CORRETTO)
5060/TCP  ✅ - SIP Signaling (CORRETTO)
5080/UDP  ⚠️ - NON USATA (può essere chiusa)
5080/TCP  ⚠️ - NON USATA (può essere chiusa)
```

### ⚠️ PORTE DA APRIRE URGENTEMENTE

**Per funzionamento completo VoIP serve:**

```bash
# Porte SIP (già OK)
5060/UDP  ✅ SIP Signaling
5060/TCP  ✅ SIP Signaling (fallback)

# Porte RTP (MANCANTI - CRITICHE!)
16384-32768/UDP  ⚠️ RTP Media (AUDIO/VIDEO) - DA APRIRE!

# Opzionali (WebSocket SIP)
5066/TCP  ⏳ WebSocket SIP (per WebRTC)
7443/TCP  ⏳ WebSocket Secure (per WebRTC/HTTPS)
```

---

## 🔧 COMANDI FIREWALL

### Se usi UFW (Uncomplicated Firewall)

```bash
# Porte già aperte
ufw allow 5060/udp comment "SIP Signaling"
ufw allow 5060/tcp comment "SIP Signaling TCP"

# Porte DA APRIRE (CRITICHE per audio)
ufw allow 16384:32768/udp comment "FreeSWITCH RTP Media"

# Opzionali per WebRTC
ufw allow 5066/tcp comment "FreeSWITCH WebSocket"
ufw allow 7443/tcp comment "FreeSWITCH WebSocket Secure"

# Chiudi 5080 (non usata)
ufw delete allow 5080/udp
ufw delete allow 5080/tcp

# Ricarica firewall
ufw reload
ufw status numbered
```

### Se usi iptables

```bash
# Porte già aperte (5060)
iptables -A INPUT -p udp --dport 5060 -j ACCEPT
iptables -A INPUT -p tcp --dport 5060 -j ACCEPT

# Porte RTP (CRITICHE)
iptables -A INPUT -p udp --dport 16384:32768 -j ACCEPT
iptables -A OUTPUT -p udp --sport 16384:32768 -j ACCEPT

# Opzionali WebSocket
iptables -A INPUT -p tcp --dport 5066 -j ACCEPT
iptables -A INPUT -p tcp --dport 7443 -j ACCEPT

# Salva regole
iptables-save > /etc/iptables/rules.v4
```

---

## 🎯 DETTAGLIO PORTE FREESWITCH

### Porta 5060 - SIP Signaling ✅
```
Protocollo:   UDP (primario) + TCP (fallback)
Bind:         93.93.113.13:5060
Uso:          Registrazione SIP, INVITE, BYE, etc.
Firewall:     ✅ APERTA
Necessaria:   ✅ CRITICA
Status:       ✅ OPERATIVA
```

**Traffico su questa porta:**
- Registrazione estensioni 2000, 2001
- Segnalazione chiamate (INVITE, RINGING, BYE)
- Trunk Messagenet (registrazione)
- Autenticazione SIP

### Porta 5080 - NON USATA ⚠️
```
Protocollo:   UDP + TCP
Stato:        NON CONFIGURATA
Uso:          Nessuno
Firewall:     Aperta ma inutile
Necessaria:   ❌ NO
Azione:       Può essere chiusa
```

### Porta 5066 - WebSocket ⏳
```
Protocollo:   TCP
Bind:         93.93.113.13:5066
Uso:          WebRTC via WebSocket (WS)
Firewall:     ⚠️ NON APERTA
Necessaria:   ⏳ Solo per WebRTC
Status:       Non ancora utilizzata
```

### Porta 7443 - WebSocket Secure ⏳
```
Protocollo:   TCP
Bind:         93.93.113.13:7443
Uso:          WebRTC via WebSocket Secure (WSS)
Firewall:     ⚠️ NON APERTA
Necessaria:   ⏳ Solo per WebRTC/HTTPS
Status:       Non ancora utilizzata
```

### Porta 8021 - Event Socket Layer (ESL) ⚠️
```
Protocollo:   TCP
Bind:         *:8021 (tutte le interfacce)
Uso:          API FreeSWITCH, controllo remoto
Firewall:     ⚠️ ESPOSTA PUBBLICAMENTE
Necessaria:   ✅ Per backend, ma solo localhost
Azione:       ⚠️ LIMITARE A 127.0.0.1 SOLO!
```

### Porte 16384-32768 - RTP Media ⚠️ CRITICHE
```
Protocollo:   UDP
Bind:         93.93.113.13
Uso:          ⭐ AUDIO e VIDEO delle chiamate
Firewall:     ⚠️ NON APERTE
Necessaria:   ✅ CRITICA - SENZA QUESTE NON C'È AUDIO!
Status:       ⚠️ MANCANTE
```

**SENZA QUESTE PORTE NON FUNZIONA L'AUDIO!**

---

## ⚠️ PROBLEMA CRITICO RILEVATO

### Porta 8021 (ESL) Esposta Pubblicamente

```
Stato attuale: Bind su *:8021 (tutte le interfacce)
Problema:      Accessibile da Internet
Rischio:       Accesso non autorizzato a FreeSWITCH
Soluzione:     Limitare a localhost (127.0.0.1)
```

**Come correggere:**

1. **Modifica configurazione ESL:**
```bash
nano /usr/local/freeswitch/etc/freeswitch/autoload_configs/event_socket.conf.xml
```

Cambia da:
```xml
<param name="listen-ip" value="::"/>
```

A:
```xml
<param name="listen-ip" value="127.0.0.1"/>
```

2. **Riavvia FreeSWITCH:**
```bash
systemctl restart freeswitch
```

---

## 🔒 CONFIGURAZIONE FIREWALL RACCOMANDATA

### Regole Minime (Solo SIP)

```bash
# Web
ufw allow 80/tcp          # HTTP
ufw allow 443/tcp         # HTTPS (futuro)

# SIP Signaling
ufw allow 5060/udp        # SIP UDP ✅ GIÀ FATTO
ufw allow 5060/tcp        # SIP TCP ✅ GIÀ FATTO

# RTP Media (CRITICHE!)
ufw allow 16384:32768/udp # Audio/Video ⚠️ DA FARE!

# SSH (limitato)
ufw limit 22/tcp          # SSH con rate limiting

# Nega tutto il resto
ufw default deny incoming
ufw default allow outgoing
ufw enable
```

### Regole Complete (Con WebRTC)

```bash
# Base
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5060/udp
ufw allow 5060/tcp
ufw allow 16384:32768/udp

# WebRTC
ufw allow 5066/tcp        # WebSocket
ufw allow 7443/tcp        # WebSocket Secure

# SSH
ufw limit 22/tcp

# Attiva
ufw enable
```

---

## 📊 VERIFICA FIREWALL ATTUALE

```bash
# Verifica stato
ufw status numbered

# Verifica porte aperte
ss -tulnp | grep LISTEN
```

---

## 🎯 PORTE PER TIPO DI FUNZIONALITÀ

### 🟢 Chiamate SIP Standard (Softphone Desktop/Mobile)

**NECESSARIE:**
```
5060/UDP  ✅ SIP Signaling (già aperta)
5060/TCP  ✅ SIP Signaling fallback (già aperta)
16384-32768/UDP  ⚠️ RTP Audio (DA APRIRE!)
```

**Senza porte RTP → Chiamata connessa ma NESSUN AUDIO!**

### 🔵 WebRTC (Browser, Click-to-call)

**NECESSARIE:**
```
5060/UDP  ✅ SIP
16384-32768/UDP  ⚠️ RTP (DA APRIRE!)
5066/TCP  ⏳ WebSocket (da aprire se usi WebRTC)
7443/TCP  ⏳ WebSocket Secure (da aprire se usi WebRTC su HTTPS)
```

### 🟡 Gestione/Amministrazione

**NECESSARIE:**
```
80/TCP    ✅ Web UI
5000/TCP  ⚠️ API Backend (proteggere via Nginx, non esporre direttamente)
8021/TCP  ⚠️ ESL (limitare a 127.0.0.1 SOLO!)
```

---

## 🔴 PORTE IN USO SUL SERVER

### Servizi Pubblici (Accessibili da Internet)

| Porta | Protocollo | Servizio | Necessaria Internet | Firewall Status |
|-------|------------|----------|---------------------|-----------------|
| 80 | TCP | Nginx HTTP | ✅ Sì | ✅ Aperta |
| 5060 | UDP | FreeSWITCH SIP | ✅ Sì | ✅ Aperta |
| 5060 | TCP | FreeSWITCH SIP | ✅ Sì | ✅ Aperta |
| 5066 | TCP | FreeSWITCH WS | ⏳ Solo WebRTC | ⏳ Chiusa |
| 7443 | TCP | FreeSWITCH WSS | ⏳ Solo WebRTC | ⏳ Chiusa |
| **16384-32768** | **UDP** | **FreeSWITCH RTP** | ✅ **Sì** | ⚠️ **CHIUSE** |

### Servizi Interni (Solo Localhost)

| Porta | Protocollo | Servizio | Bind Address | Esposizione |
|-------|------------|----------|--------------|-------------|
| 5000 | TCP | Backend API | 0.0.0.0 | ⚠️ Pubblico (proteggere) |
| 5432 | TCP | PostgreSQL | 127.0.0.1 | ✅ Localhost only |
| 8021 | TCP | FreeSWITCH ESL | *:8021 | ⚠️ **PUBBLICO (PERICOLOSO!)** |

---

## ⚠️ AZIONI URGENTI FIREWALL

### 1. Apri Porte RTP (CRITICO!)

**Senza queste porte NON c'è audio nelle chiamate!**

```bash
ufw allow 16384:32768/udp comment "FreeSWITCH RTP Media"
```

### 2. Proteggi Porta 8021 (Event Socket)

**MOLTO PERICOLOSO se esposta pubblicamente!**

```bash
# Blocca accesso esterno
ufw deny 8021/tcp

# Modifica FreeSWITCH per bind solo localhost
# Edit: /usr/local/freeswitch/etc/freeswitch/autoload_configs/event_socket.conf.xml
# Cambia: <param name="listen-ip" value="::"/> 
# In:     <param name="listen-ip" value="127.0.0.1"/>
```

### 3. Chiudi Porta 5080 (Non Usata)

```bash
ufw delete allow 5080/udp
ufw delete allow 5080/tcp
```

### 4. Proteggi Backend API (Porta 5000)

**Opzione A:** Blocca accesso diretto (usa solo via Nginx)
```bash
ufw deny 5000/tcp
# Il backend sarà accessibile solo via Nginx reverse proxy
```

**Opzione B:** Limita a IP specifici
```bash
ufw allow from TUO_IP_UFFICIO to any port 5000
```

---

## 📡 RANGE PORTE RTP SPIEGATO

### Cos'è RTP?

**RTP (Real-time Transport Protocol)** = Protocollo che trasporta l'AUDIO e il VIDEO delle chiamate.

**Come funziona:**
1. SIP (porta 5060) = negozia la chiamata (chi chiama, chi risponde)
2. RTP (porte 16384-32768) = trasporta l'audio della conversazione

**Esempio chiamata:**
```
Softphone → SIP INVITE → FreeSWITCH (porta 5060)
FreeSWITCH → SIP 200 OK → Softphone
[Chiamata connessa]
Softphone → RTP audio → FreeSWITCH (porta casuale 16384-32768)
FreeSWITCH → RTP audio → Softphone (porta casuale 16384-32768)
```

### Perché Range Ampio?

FreeSWITCH assegna **2 porte UDP casuali** per ogni chiamata:
- 1 porta per l'audio in entrata
- 1 porta per l'audio in uscita

Con 30 chiamate simultanee = 60 porte usate
Range 16384-32768 = 16,384 porte disponibili

**Configurazione FreeSWITCH:**
```xml
Default RTP range: 16384-32768 UDP
Modificabile in: switch.conf.xml
```

---

## 🎯 CONFIGURAZIONE CONSIGLIATA FIREWALL

### Scenario 1: Server Dedicato VoIP

```bash
# Essenziali
ufw allow 22/tcp          # SSH
ufw allow 80/tcp          # HTTP
ufw allow 443/tcp         # HTTPS
ufw allow 5060/udp        # SIP ✅
ufw allow 5060/tcp        # SIP TCP ✅
ufw allow 16384:32768/udp # RTP ⚠️ AGGIUNGI!

# Blocca tutto il resto
ufw default deny incoming
ufw default allow outgoing
ufw enable
```

### Scenario 2: Con WebRTC

```bash
# Base + WebRTC
ufw allow 5066/tcp        # WebSocket
ufw allow 7443/tcp        # WebSocket Secure
ufw allow 16384:32768/udp # RTP
```

### Scenario 3: Sviluppo/Test

```bash
# Più permissivo per debug
ufw allow from TUO_IP to any port 8021 # ESL solo dal tuo IP
ufw allow from TUO_IP to any port 5000 # API solo dal tuo IP
```

---

## 📞 TEST AUDIO

### Problema Comune: "Chiamata connessa ma nessun audio"

**Causa:** Porte RTP bloccate dal firewall

**Sintomi:**
- ✅ Softphone si registra
- ✅ Chiamata si connette
- ❌ Non si sente nulla
- ❌ Silenzio totale

**Soluzione:**
```bash
# Apri porte RTP
ufw allow 16384:32768/udp

# Verifica
ufw status | grep 16384
```

**Test:**
1. Chiama da 2000 al numero **9196** (echo test)
2. Parla nel microfono
3. Dovresti sentire immediatamente la tua voce

**Se non senti l'echo = Porte RTP bloccate!**

---

## 🔍 DIAGNOSTICA PORTE

### Verifica Porte Aperte sul Server

```bash
# Lista porte in ascolto
ss -tulnp | grep freeswitch

# Risultato atteso:
udp   ...  93.93.113.13:5060  ... freeswitch  ✅
tcp   ...  93.93.113.13:5060  ... freeswitch  ✅
tcp   ...  93.93.113.13:5066  ... freeswitch  ✅
tcp   ...  93.93.113.13:7443  ... freeswitch  ✅
tcp   ...  *:8021             ... freeswitch  ⚠️ (da limitare)
```

### Test Connettività Esterna

```bash
# Test SIP dal tuo PC
nc -zvu 93.93.113.13 5060
# Risultato atteso: Connection to 93.93.113.13 5060 port [udp/*] succeeded!

# Test RTP
nc -zvu 93.93.113.13 16384
# Dovrebbe rispondere se porta aperta
```

### Test da FreeSWITCH

```bash
fs_cli -x "sofia status profile internal"
# Verifica: SIP-IP, RTP-IP, Ext-RTP-IP
```

---

## 📋 CHECKLIST FIREWALL

### ✅ Controllo Configurazione

- [x] Porta 5060 UDP aperta (SIP)
- [x] Porta 5060 TCP aperta (SIP fallback)
- [ ] **Porte 16384-32768 UDP aperte (RTP)** ⚠️ **MANCA!**
- [ ] Porta 5080 chiusa (non usata)
- [ ] Porta 8021 limitata a localhost
- [ ] Porta 5000 protetta (via Nginx)

---

## 🎊 RIEPILOGO ESTENSIONI DEMO

### Estensioni Configurate: 2

```
┌─────────────────────────────────────────────────────────┐
│ Estensione 2000                                         │
├─────────────────────────────────────────────────────────┤
│ Username:       2000                                    │
│ Password:       test123456                              │
│ Domain:         demo.edgvoip.it                         │
│ Server:         93.93.113.13:5060                       │
│ CallerID Out:   +39 06 8635 6924 (via Messagenet)      │
│ Status:         ✅ ACTIVE                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Estensione 2001                                         │
├─────────────────────────────────────────────────────────┤
│ Username:       2001                                    │
│ Password:       test123456                              │
│ Domain:         demo.edgvoip.it                         │
│ Server:         93.93.113.13:5060                       │
│ CallerID Out:   +39 06 8635 6924 (via Messagenet)      │
│ Status:         ✅ ACTIVE                               │
└─────────────────────────────────────────────────────────┘
```

### Trunk Outbound: Messagenet

```
Gateway:        messagenet_demo
Status:         ✅ REGED
Server:         sip.messagenet.it:5061
Username:       5406594427
DID Number:     +39 06 8635 6924
Ping:           30.77ms
Uptime:         Attivo
```

---

## 🚨 AZIONE IMMEDIATA RICHIESTA

### APRI PORTE RTP SUBITO!

**Comando rapido:**
```bash
ufw allow 16384:32768/udp
ufw reload
```

**Verifica:**
```bash
ufw status | grep 16384
```

**Risultato atteso:**
```
16384:32768/udp    ALLOW       Anywhere
```

**Senza queste porte le chiamate NON avranno audio!**

---

## 📞 PIANO NUMERAZIONE COMPLETO

| Range/Numero | Tipo | Routing | Trunk | Costo |
|--------------|------|---------|-------|-------|
| **2000** | Estensione | Locale | - | Gratis |
| **2001** | Estensione | Locale | - | Gratis |
| **2000-2999** | Range Interno | Locale | - | Gratis |
| **3xxxxxxxxx** | Mobile IT | Messagenet | messagenet_demo | A consumo |
| **0xxxxxxxx** | Fisso IT | Messagenet | messagenet_demo | A consumo |
| **00xxxxxxxx** | Internazionale | Messagenet | messagenet_demo | A consumo |
| **+xxxxxxxxxx** | Internazionale | Messagenet | messagenet_demo | A consumo |
| **9196** | Echo Test | Locale | - | Gratis |
| **9664** | Hold Music | Locale | - | Gratis |

---

## ✅ SISTEMA PRONTO

**Estensioni Demo:**
- ✅ 2 estensioni create (2000, 2001)
- ✅ Password: test123456
- ✅ Domain: demo.edgvoip.it
- ✅ Caricate in FreeSWITCH

**Trunk Messagenet:**
- ✅ Configurato nel database
- ✅ Gateway FreeSWITCH attivo
- ✅ Registrato con Messagenet
- ✅ Status: UP
- ✅ Dialplan outbound configurato

**Firewall:**
- ✅ Porta 5060 UDP/TCP aperta
- ⚠️ **Porte RTP 16384-32768 UDP DA APRIRE!**
- ⚠️ Porta 8021 da limitare a localhost
- ⚠️ Porta 5080 da chiudere (non usata)

---

**APRI LE PORTE RTP E IL SISTEMA SARÀ 100% FUNZIONANTE!** 🎯

---

**Generato il:** 25 Ottobre 2025  
**Server:** edgvoip (93.93.113.13)  
**Tenant:** demo  
**Trunk:** Messagenet ✅ REGISTERED

