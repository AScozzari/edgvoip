# 🚀 Guida Deployment VPS Debian - W3 VoIP System

## Informazioni Server
- **IP:** 93.93.113.13
- **OS:** Debian VPS
- **User:** root
- **Password:** B66v6My6

## Architettura Porte Production
- **Frontend (React + Vite):** Porta 5000
- **Backend (Express API):** Porta 3001
- **PostgreSQL:** Porta 5432
- **FreeSWITCH:** Porta 5060 (SIP), 5080 (WSS)
- **Nginx Proxy:** Porta 80/443

## 📋 Prerequisiti Locali
Prima di iniziare il deployment, assicurati di avere:
```bash
# Installa sshpass per automazione SSH
apt-get install sshpass  # Linux
brew install sshpass      # macOS
```

## 🎯 Deploy Automatico - UN COMANDO

### Opzione 1: Deploy Completo (Raccomandato)
```bash
chmod +x scripts/complete-deploy.sh
./scripts/complete-deploy.sh
```

Questo script esegue automaticamente:
1. ✅ Setup server Debian (Node.js, PostgreSQL, Redis, FreeSWITCH, Nginx)
2. ✅ Deploy applicazione (Backend + Frontend)
3. ✅ Configurazione database e migrazioni
4. ✅ Setup systemd services
5. ✅ Configurazione Nginx reverse proxy
6. ✅ Test endpoint API

**Tempo stimato:** 10-15 minuti

### Opzione 2: Deploy Manuale Step-by-Step

#### Passo 1: Setup Server Base
```bash
# Connetti al server
ssh root@93.93.113.13

# Copia e esegui script setup
scp scripts/setup-debian-server.sh root@93.93.113.13:/tmp/
ssh root@93.93.113.13 "chmod +x /tmp/setup-debian-server.sh && /tmp/setup-debian-server.sh"
```

#### Passo 2: Deploy Applicazione
```bash
chmod +x scripts/auto-deploy.sh
./scripts/auto-deploy.sh
```

## 📦 Cosa Viene Installato

### Software
- Node.js 20 LTS
- PostgreSQL 15
- Redis 7
- Nginx
- FreeSWITCH (con moduli: ESL, XML Curl, Sofia SIP)
- PM2 (process manager)
- Fail2ban (sicurezza)
- UFW (firewall)

### Configurazione Firewall
```
Port 22   (SSH)
Port 80   (HTTP)
Port 443  (HTTPS)
Port 5060 (SIP TCP)
Port 5080 (WSS)
Port 5432 (PostgreSQL - solo localhost)
```

### Directory Create
```
/var/www/voip-system           # Applicazione
/var/www/voip-uploads          # File upload
/var/www/voip-recordings       # Registrazioni chiamate
/var/log/voip-system           # Log applicazione
/etc/voip-system               # Configurazioni
```

## 🔐 Credenziali Default

### Database PostgreSQL
- **Database:** voip_production
- **User:** voip_user
- **Password:** VoipSecure2025!
- **Host:** localhost:5432

### Applicazione Web

#### Super Admin (Master Tenant)
- **Email:** admin@edgvoip.it
- **Password:** admin123
- **URL:** http://93.93.113.13/edgvoip/login

#### Demo Tenant
- **Email:** admin@demo.local
- **Password:** tenantadmin123
- **URL:** http://93.93.113.13/demo/login

## 🛠️ Gestione Servizi Post-Deploy

### Backend API
```bash
# Status
systemctl status voip-backend

# Start/Stop/Restart
systemctl start voip-backend
systemctl stop voip-backend
systemctl restart voip-backend

# Log in tempo reale
journalctl -u voip-backend -f
```

### Nginx
```bash
systemctl status nginx
systemctl restart nginx
systemctl reload nginx  # Ricarica config senza downtime

# Test configurazione
nginx -t
```

### FreeSWITCH
```bash
systemctl status freeswitch
systemctl restart freeswitch

# Console CLI
fs_cli
```

### PostgreSQL
```bash
systemctl status postgresql

# Connetti al database
psql -U voip_user -d voip_production
```

## 🧪 Verifica Deployment

### 1. Test Connessione Server
```bash
ping 93.93.113.13
ssh root@93.93.113.13
```

### 2. Test Servizi
```bash
# Tutti i servizi
ssh root@93.93.113.13 "systemctl status voip-backend nginx postgresql freeswitch"
```

### 3. Test API Endpoints
```bash
# Health check
curl http://93.93.113.13/api/health

# Tenant validation
curl http://93.93.113.13/api/demo/validate

# FreeSWITCH status
curl http://93.93.113.13/api/freeswitch/status
```

### 4. Test Frontend
Apri nel browser:
- Frontend: http://93.93.113.13
- Super Admin: http://93.93.113.13/edgvoip/login
- Demo Tenant: http://93.93.113.13/demo/login

## 🔄 Update/Redeploy

### Quick Update (solo codice)
```bash
chmod +x scripts/deploy-to-debian.sh
./scripts/deploy-to-debian.sh
```

### Full Redeploy
```bash
./scripts/complete-deploy.sh
```

## 📊 Monitoring e Log

### Log Applicazione
```bash
# Backend
journalctl -u voip-backend -f

# Nginx access
tail -f /var/log/nginx/access.log

# Nginx error
tail -f /var/log/nginx/error.log

# FreeSWITCH
tail -f /var/log/freeswitch/freeswitch.log
```

### Monitoring Risorse
```bash
# CPU e RAM
htop

# Disk usage
df -h

# Processi Node
ps aux | grep node
```

## 🔒 Sicurezza Post-Deploy

### 1. Cambia Password Root
```bash
ssh root@93.93.113.13
passwd
```

### 2. Configura SSL/TLS (Certificato Let's Encrypt)
```bash
ssh root@93.93.113.13

# Installa certbot
apt install certbot python3-certbot-nginx

# Genera certificato (sostituisci con il tuo dominio)
certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
systemctl enable certbot.timer
```

### 3. Aggiorna Firewall
```bash
# Blocca accesso PostgreSQL dall'esterno
ufw deny 5432/tcp

# Permetti solo IP specifici per SSH (opzionale)
ufw allow from YOUR_OFFICE_IP to any port 22
```

## 🆘 Troubleshooting

### Backend non si avvia
```bash
# Controlla log
journalctl -u voip-backend -n 100

# Controlla permessi
ls -la /var/www/voip-system
chown -R voip:voip /var/www/voip-system

# Reinstalla dipendenze
cd /var/www/voip-system/packages/backend
npm install
```

### Frontend mostra errore 502
```bash
# Verifica backend è running
systemctl status voip-backend

# Test backend direttamente
curl http://localhost:3001/api/health

# Riavvia nginx
systemctl restart nginx
```

### Database connection error
```bash
# Verifica PostgreSQL
systemctl status postgresql

# Test connessione
psql -U voip_user -d voip_production -h localhost

# Reset password database
sudo -u postgres psql
ALTER USER voip_user WITH PASSWORD 'VoipSecure2025!';
```

## 📞 Supporto

Per problemi di deployment:
1. Controlla i log: `journalctl -u voip-backend -f`
2. Verifica tutti i servizi: `systemctl status voip-backend nginx postgresql`
3. Test connettività: `curl http://localhost:3001/api/health`

---

**Ultimo aggiornamento:** 24 Ottobre 2025  
**Versione:** 1.0.0
