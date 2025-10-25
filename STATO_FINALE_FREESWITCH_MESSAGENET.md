# 📊 STATO FINALE SISTEMA FREESWITCH + MESSAGENET

## ✅ COSA FUNZIONA

### Chiamate Interne
```
✅ 2000 ↔ 2001: PERFETTO
✅ Context routing: demo.edgvoip.it
✅ Audio: RTP funziona
```

### Estensioni Registrate
```
✅ 2000: 148.251.28.182:35060 (UDP)
✅ 2001: 194.79.203.34:59353 (TCP)
```

### Gateway Messagenet
```
✅ Status: REGED
✅ Server: sip.messagenet.it:5060
✅ Username: 5406594427
✅ Password: UjcHYnZa
```

---

## ❌ PROBLEMA ATTUALE: 403 Authentication Username Mismatch

### Errore Messagenet
```
SIP/2.0 407 Proxy Authentication Required
Poi:
SIP/2.0 403 Authentication Username Mismatch
```

### Causa Root

Messagenet richiede che il **From header** nell'INVITE contenga lo stesso username della registrazione:

```
REGISTRAZIONE (OK):
From: <sip:5406594427@sip.messagenet.it>

INVITE CHIAMATA (ERRATO):
From: <sip:0686356924@sip.messagenet.it>
         ^^^^^^^^^^
         Questo è il DID, non lo username!

MESSAGENET RIFIUTA: Username diverso da registrazione!
```

### Configurazione Gateway Attuale

**File:** `/usr/local/freeswitch/etc/freeswitch/sip_profiles/internal/messagenet_demo.xml`

```xml
<gateway name="messagenet_demo">
  <param name="proxy" value="sip.messagenet.it:5060"/>
  <param name="username" value="5406594427"/>     ← Username registrazione
  <param name="password" value="UjcHYnZa"/>
  <param name="from-user" value="5406594427"/>    ← DEVE essere uguale a username
  <param name="from-domain" value="sip.messagenet.it"/>
  <param name="extension" value="0686356924"/>    ← DID/CallerID mostrato
</gateway>
```

---

## 🔧 MODIFICHE APPLICATE

### 1. Dialplan Aggiornato (SENZA override CallerID)

**File:** `/usr/local/freeswitch/etc/freeswitch/dialplan/demo.edgvoip.it.xml`

**PRIMA (Errato):**
```xml
<action application="set" data="effective_caller_id_number=0686356924"/>
<action application="bridge" data="sofia/gateway/messagenet_demo/$1"/>
```

**DOPO (Corretto):**
```xml
<!-- Rimosso override CallerID - usa from-user del gateway -->
<action application="bridge" data="sofia/gateway/messagenet_demo/$1"/>
```

### 2. Numeri Inviati SENZA +39

```
Mobili 3xxx → 3297626144 (non +393297626144)
Fissi 0xxx → 0686356924 (non +390686356924)
```

### 3. Gateway su Porta 5060

```
Server: sip.messagenet.it:5060 (non 5061)
```

---

## 🎯 CONFIGURAZIONE CORRETTA FINALE

### From Headers (quello che Messagenet riceve)

**REGISTRAZIONE:**
```
From: <sip:5406594427@sip.messagenet.it>
To: <sip:5406594427@sip.messagenet.it>
Contact: <sip:0686356924@93.93.113.13:5060>
```

**INVITE (Dopo fix):**
```
From: <sip:5406594427@sip.messagenet.it>     ← Username registrazione
To: <sip:3297626144@sip.messagenet.it>       ← Numero chiamato
P-Asserted-Identity: <sip:0686356924@...>    ← DID mostrato
```

---

## 🧪 TEST ULTIMA CHIAMATA

**Se hai appena fatto una chiamata, dimmi:**

1. **Cosa vedi in Zoiper/MizuDroid?**
   - "Calling..."
   - "403 Forbidden"
   - "Call Failed"
   - Altro?

2. **La chiamata parte dal softphone?**
   - Sì, senti "beep" o tono
   - No, rifiuta subito

3. **Hai fatto chiamata DOPO il reload XML?**
   - Il reload XML era alle 14:30
   - La tua chiamata era dopo?

---

## 📞 SE NON HAI FATTO CHIAMATA DOPO IL FIX:

**FAI UNA NUOVA CHIAMATA ADESSO:**

1. Da Zoiper/MizuDroid estensione **2001**
2. Chiama: **3297626144**
3. Aspetta 5 secondi
4. Dimmi cosa succede

**Poi catturo i nuovi log per vedere se il From header ora è corretto!**

---

## 🔍 VERIFICA ACCOUNT MESSAGENET

**Domande importanti:**

1. L'account Messagenet **5406594427** è attivo per chiamate USCENTI?
2. Hai mai fatto chiamate uscenti con questo account?
3. C'è credito sufficiente (se prepagato)?
4. Il DID **0686356924** è associato a questo account?

**Verifica sul portale:** https://my.messagenet.com/voip/0686356924

Cerca:
- Stato servizio
- Credito residuo
- Chiamate uscenti abilitate
- Log chiamate

---

**DIMMI:**
- Hai fatto una nuova chiamata DOPO il fix?
- Cosa vedi sul softphone?
- Posso verificare l'account Messagenet?
