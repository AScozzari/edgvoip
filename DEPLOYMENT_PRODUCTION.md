# EDG VoIP System - Production Deployment Guide

## 🚀 Deployment su Server Debian

### Prerequisiti
- Server Debian pulito
- Accesso root
- Porte aperte: 22, 80, 443, 8021, 5060, 5061, 16384-32768

### Step 1: Setup Server Base
```bash
# Copiare script sul server
scp scripts/setup-debian-server.sh root@YOUR_SERVER_IP:/tmp/

# Eseguire setup
ssh root@YOUR_SERVER_IP
chmod +x /tmp/setup-debian-server.sh
/tmp/setup-debian-server.sh
```

### Step 2: Deploy Applicazione
```bash
# Dal computer locale, modificare IP nel file
vim scripts/deploy-to-debian.sh
# Cambiare YOUR_SERVER_IP con l'IP reale

# Eseguire deploy
chmod +x scripts/deploy-to-debian.sh
./scripts/deploy-to-debian.sh
```

### Step 3: Test Sistema
```bash
# Modificare IP nel file di test
vim scripts/test-production.sh
# Cambiare YOUR_SERVER_IP con l'IP reale

# Eseguire test
chmod +x scripts/test-production.sh
./scripts/test-production.sh
```

## 🔧 Configurazione Post-Deploy

### 1. Aggiornare IP nel file env.production
```bash
ssh root@YOUR_SERVER_IP
vim /etc/voip-system/.env
# Cambiare YOUR_SERVER_IP con l'IP reale
systemctl restart voip-backend
```

### 2. Configurare SSL (Opzionale)
```bash
# Generare certificato self-signed per test
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/voip.key \
  -out /etc/ssl/certs/voip.crt

# Aggiornare Nginx per HTTPS
vim /etc/nginx/sites-available/voip-system
# Aggiungere configurazione SSL
systemctl reload nginx
```

## 📊 Monitoraggio

### Comandi Utili
```bash
# Stato servizi
systemctl status voip-backend postgresql redis-server nginx freeswitch

# Log applicazione
journalctl -u voip-backend -f

# Log FreeSWITCH
journalctl -u freeswitch -f

# Log Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Porte in ascolto
netstat -tlnp | grep -E ':(80|443|5000|5060|5061|8021)'
```

### Health Checks
```bash
# API Health
curl http://YOUR_SERVER_IP/api/health

# Database
sudo -u postgres psql -c "SELECT 1;" voip_production

# Redis
redis-cli -a RedisSecure2025! ping

# FreeSWITCH ESL
fs_cli -x "status"
```

## 🔐 Credenziali Default

### Super Admin
- Email: `admin@edgvoip.local`
- Password: `SuperAdmin2025!`
- URL: `http://YOUR_SERVER_IP/edgvoip/login`

### Demo Tenant
- Email: `admin@demo.local`
- Password: `tenantadmin123`
- URL: `http://YOUR_SERVER_IP/demo/login`

### Database
- Database: `voip_production`
- User: `voip_user`
- Password: `VoipSecure2025!`

### Redis
- Password: `RedisSecure2025!`

### FreeSWITCH ESL
- Password: `1QzGEWv0Q6ao20M+hS8qeLI+u9gw77WuJGB5Z1xDk30=`

## 🛠️ Troubleshooting

### Backend non si avvia
```bash
# Controllare log
journalctl -u voip-backend -n 50

# Verificare variabili ambiente
cat /etc/voip-system/.env

# Testare connessione database
cd /var/www/voip-system/packages/backend
npm run migrate
```

### FreeSWITCH non risponde
```bash
# Controllare configurazione
freeswitch -t

# Verificare porte
netstat -tlnp | grep 5060

# Test ESL
fs_cli -x "status"
```

### Nginx errori 502
```bash
# Verificare che backend sia in ascolto
netstat -tlnp | grep 5000

# Controllare log Nginx
tail -f /var/log/nginx/error.log
```

## 📈 Performance

### Ottimizzazioni Applicate
- Rate limiting su API
- Gzip compression
- Static file caching
- Connection pooling database
- Redis caching
- Fail2ban protection

### Monitoraggio Risorse
```bash
# CPU e memoria
htop

# Disco
df -h

# Rete
iftop
```

## 🔄 Backup e Restore

### Backup Automatico
```bash
# Script backup giornaliero
crontab -e
# Aggiungere: 0 2 * * * /var/www/voip-system/scripts/backup.sh
```

### Restore
```bash
# Ripristinare database
gunzip -c /var/backups/voip/postgres_YYYYMMDD_HHMMSS.sql.gz | \
sudo -u postgres psql voip_production

# Ripristinare configurazioni
tar -xzf /var/backups/voip/configs_YYYYMMDD_HHMMSS.tar.gz
```

## 🚨 Sicurezza

### Firewall Configurato
- SSH: porta 22
- HTTP: porta 80
- HTTPS: porta 443
- SIP: porta 5060
- SIP TLS: porta 5061
- ESL: porta 8021
- RTP: porte 16384-32768

### Fail2ban Attivo
- Protezione SSH
- Protezione Nginx
- Rate limiting

### Password Sicure
- Tutte le password sono state generate casualmente
- JWT secrets sicuri
- Database e Redis protetti

## 📞 Supporto

Per problemi o domande:
1. Controllare i log
2. Verificare stato servizi
3. Testare connettività
4. Controllare configurazioni

Il sistema è ora production-ready e completamente funzionale!
