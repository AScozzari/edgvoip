# ⚡ Quick Deploy Guide

## 🎯 Modifiche da Deployare

### 1. Fix JSON.parse (CRITICO)
- **File**: `packages/backend/src/services/extension.service.ts`
- **Bug**: Extensions non visibili in frontend
- **Fix**: Type check prima di JSON.parse per JSONB fields

### 2. Fix Database Timeout
- **File**: `packages/database/src/index.ts`  
- **Bug**: Connection timeout errors
- **Fix**: Timeout aumentato a 10s + keepAlive

## 🚀 Deployment Rapido

### Step 1: Commit da Replit
```bash
git add .
git commit -m "Fix: JSON.parse JSONB + database timeout"
git push origin main
```

### Step 2: Deploy sul Server
```bash
# SSH al server
ssh root@93.93.113.13
cd /root/w3voip-app

# Backup database
pg_dump -U voip_user -d voip_production > /root/backups/db_$(date +%Y%m%d_%H%M).sql

# Pull + Build + Restart
git pull origin main && npm install && npm run build && systemctl restart voip-backend

# Verifica
systemctl status voip-backend
journalctl -u voip-backend -n 20
```

### Step 3: Test
```bash
# Test API
curl http://localhost:3001/api/health

# Verifica extension 100
psql -U voip_user -d voip_production -c "SELECT extension, display_name FROM extensions WHERE extension='100';"
```

## ✅ Done!

Se tutto ok, le extensions dovrebbero essere visibili nel frontend.

## ⚠️ Se qualcosa va storto

```bash
# Rollback Git
git reset --hard HEAD~1

# Ripristina database
psql -U voip_user -d voip_production < /root/backups/db_YYYYMMDD_HHMM.sql

# Riavvia
npm run build && systemctl restart voip-backend
```

---

**Per dettagli completi vedi `DEPLOYMENT.md`**
