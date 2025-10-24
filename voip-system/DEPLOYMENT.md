# 🚀 Deployment Guide - W3 VoIP System

## 📋 Pre-requisiti

- Accesso SSH al server production (93.93.113.13)
- Repository Git configurato sul server
- Node.js e npm installati
- PostgreSQL database in esecuzione
- FreeSWITCH installato

## 🔄 Procedura di Deployment

### 1. Commit e Push da Replit (LOCALE)

```bash
# Verifica le modifiche
git status

# Aggiungi tutte le modifiche
git add .

# Commit con messaggio descrittivo
git commit -m "Fix: JSON.parse per JSONB settings + database timeout aumentato"

# Push su repository
git push origin main
```

### 2. Deploy sul Server Production

Connettiti al server:

```bash
ssh root@93.93.113.13
cd /root/w3voip-app
```

Esegui il deployment:

```bash
# 1. Backup del database (IMPORTANTE!)
pg_dump -U voip_user -d voip_production > /root/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull delle modifiche da Git
git fetch origin
git pull origin main

# 3. Installa/aggiorna dipendenze
npm install

# 4. Build del progetto
npm run build

# 5. Verifica schema database (se necessario)
cd packages/backend
npm run db:push

# 6. Riavvia i servizi
systemctl restart voip-backend

# 7. Verifica che il backend sia attivo
systemctl status voip-backend

# 8. Controlla i log per errori
journalctl -u voip-backend -n 50 --no-pager

# 9. Riavvia FreeSWITCH (solo se necessario)
# systemctl restart freeswitch
# systemctl status freeswitch
```

### 3. Verifica Deployment

```bash
# Test API backend
curl -I http://localhost:3001/api/health

# Verifica connessione database
psql -U voip_user -d voip_production -c "SELECT COUNT(*) FROM tenants;"

# Test extension 100
psql -U voip_user -d voip_production -c "SELECT id, extension, display_name FROM extensions WHERE extension = '100';"

# Verifica FreeSWITCH
/usr/local/freeswitch/bin/fs_cli -x "sofia status profile internal"
```

## 📝 Modifiche in Questo Deploy

### Fix JSON.parse per JSONB (CRITICO)
- **File**: `packages/backend/src/services/extension.service.ts`
- **Problema**: PostgreSQL ritorna JSONB come oggetto in production ma come stringa in development
- **Soluzione**: Check del tipo prima di JSON.parse
```typescript
typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
```
- **Occorrenze**: 6 fix applicati

### Fix Database Connection Timeout
- **File**: `packages/database/src/index.ts`
- **Problema**: Timeout di 2s troppo basso per connessioni di rete
- **Modifiche**:
  - `connectionTimeoutMillis`: 2000 → 10000 (10 secondi)
  - Aggiunto `keepAlive: true`
  - Aggiunto `keepAliveInitialDelayMillis: 10000`

## ⚠️ Troubleshooting

### Backend non si avvia

```bash
# Controlla errori nel log
journalctl -u voip-backend -n 100 --no-pager

# Verifica porta 3001 libera
netstat -tuln | grep 3001

# Kill processo bloccato
pkill -f "node.*backend"
systemctl restart voip-backend
```

### Database non si connette

```bash
# Test connessione database
psql -U voip_user -d voip_production -c "SELECT 1;"

# Verifica DATABASE_URL in .env
cat /root/w3voip-app/packages/backend/.env | grep DATABASE_URL
```

### FreeSWITCH non parte

```bash
# NON modificare manualmente i file di configurazione!
# Verifica errori
/usr/local/freeswitch/bin/freeswitch -c 2>&1 | head -50

# Se necessario, ripristina configurazione
cd /usr/local/freeswitch/conf
# Verifica backup disponibili
ls -la *.bak
```

## 🔙 Rollback

Se qualcosa va storto:

```bash
# 1. Torna alla versione precedente
cd /root/w3voip-app
git log --oneline -5  # Vedi commit recenti
git reset --hard <commit-hash-precedente>

# 2. Ripristina database
psql -U voip_user -d voip_production < /root/backups/db_backup_YYYYMMDD_HHMMSS.sql

# 3. Rebuild e riavvia
npm run build
systemctl restart voip-backend
```

## 📊 Monitoring Post-Deployment

```bash
# Monitora log in real-time
journalctl -u voip-backend -f

# Monitora registrazioni SIP
tail -f /usr/local/freeswitch/log/freeswitch.log | grep -i REGISTER

# CPU e memoria
top -bn1 | grep -E "(node|freeswitch)"
```

## ✅ Checklist Post-Deploy

- [ ] Backend risponde su porta 3001
- [ ] Database accessibile
- [ ] FreeSWITCH in esecuzione
- [ ] Extension 100 visibile in frontend
- [ ] Nessun errore nei log
- [ ] Test login su frontend funzionante

## 🆘 Supporto

Se incontri problemi:
1. Controlla i log: `journalctl -u voip-backend -n 100`
2. Verifica status servizi: `systemctl status voip-backend freeswitch`
3. Non modificare manualmente file sul server - usa sempre Git workflow
