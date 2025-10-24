#!/bin/bash

# EDG VoIP System - Debian Server Setup Script
# Per server di produzione con installazione nativa

set -e

echo "🚀 EDG VoIP System - Debian Server Setup"
echo "========================================"
echo "Server: Debian $(lsb_release -d | cut -f2)"
echo "User: $(whoami)"
echo "Date: $(date)"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Verifica che sia root
if [ "$EUID" -ne 0 ]; then
    error "Questo script deve essere eseguito come root"
fi

log "Inizio setup server Debian per EDG VoIP System"

# 1. Aggiornamento sistema
log "Aggiornamento sistema..."
apt update && apt upgrade -y

# 2. Installazione dipendenze base
log "Installazione dipendenze base..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    build-essential \
    python3 \
    python3-pip \
    htop \
    vim \
    ufw \
    fail2ban

# 3. Installazione Node.js 20 LTS
log "Installazione Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verifica installazione Node.js
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "Node.js installato: $NODE_VERSION"
log "npm installato: $NPM_VERSION"

# 4. Installazione PostgreSQL 15
log "Installazione PostgreSQL 15..."
apt install -y postgresql postgresql-contrib postgresql-client

# Configurazione PostgreSQL
log "Configurazione PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Creazione database e utente
sudo -u postgres psql << EOF
CREATE DATABASE voip_production;
CREATE USER voip_user WITH ENCRYPTED PASSWORD 'VoipSecure2025!';
GRANT ALL PRIVILEGES ON DATABASE voip_production TO voip_user;
ALTER USER voip_user CREATEDB;
\q
EOF

log "PostgreSQL configurato con database voip_production"

# 5. Installazione Redis
log "Installazione Redis..."
apt install -y redis-server

# Configurazione Redis
log "Configurazione Redis..."
sed -i 's/^# requirepass foobared/requirepass RedisSecure2025!/' /etc/redis/redis.conf
sed -i 's/^bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf
systemctl restart redis-server
systemctl enable redis-server

log "Redis configurato con password"

# 6. Installazione Nginx
log "Installazione Nginx..."
apt install -y nginx

# Configurazione firewall
log "Configurazione firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5060/tcp
ufw allow 5060/udp
ufw allow 5061/tcp
ufw allow 8021/tcp
ufw allow 16384:32768/udp

log "Firewall configurato"

# 7. Installazione FreeSWITCH
log "Installazione FreeSWITCH..."
apt install -y \
    freeswitch \
    freeswitch-mod-commands \
    freeswitch-mod-conference \
    freeswitch-mod-db \
    freeswitch-mod-dptools \
    freeswitch-mod-enum \
    freeswitch-mod-esf \
    freeswitch-mod-expr \
    freeswitch-mod-fifo \
    freeswitch-mod-hash \
    freeswitch-mod-httapi \
    freeswitch-mod-esl \
    freeswitch-mod-local-stream \
    freeswitch-mod-lua \
    freeswitch-mod-nibblebill \
    freeswitch-mod-rtc \
    freeswitch-mod-say-en \
    freeswitch-mod-sndfile \
    freeswitch-mod-sofia \
    freeswitch-mod-tone-stream \
    freeswitch-mod-voicemail \
    freeswitch-mod-voicemail-ivr \
    freeswitch-mod-dialplan-xml \
    freeswitch-mod-dialplan-asterisk \
    freeswitch-mod-loopback \
    freeswitch-mod-cdr-csv \
    freeswitch-mod-cdr-sqlite \
    freeswitch-mod-cdr-pg-csv \
    freeswitch-mod-curl \
    freeswitch-mod-event-socket \
    freeswitch-mod-format-cdr \
    freeswitch-mod-json-cdr \
    freeswitch-mod-syslog \
    freeswitch-mod-logfile \
    freeswitch-mod-console \
    freeswitch-mod-graylog2 \
    freeswitch-mod-native-file \
    freeswitch-mod-spandsp \
    freeswitch-mod-g723-1 \
    freeswitch-mod-amr \
    freeswitch-mod-amrwb \
    freeswitch-mod-g729 \
    freeswitch-mod-h26x \
    freeswitch-mod-opus \
    freeswitch-mod-vp8 \
    freeswitch-mod-vp9 \
    freeswitch-mod-bv \
    freeswitch-mod-b64

# 8. Creazione directory per l'applicazione
log "Creazione directory applicazione..."
mkdir -p /var/www/voip-system
mkdir -p /var/www/voip-uploads
mkdir -p /var/www/voip-recordings
mkdir -p /var/log/voip-system
mkdir -p /etc/voip-system

# 9. Configurazione servizi
log "Configurazione servizi..."
systemctl enable postgresql
systemctl enable redis-server
systemctl enable nginx
systemctl enable freeswitch

# 10. Installazione PM2 per gestione processi Node.js
log "Installazione PM2..."
npm install -g pm2

# 11. Configurazione fail2ban
log "Configurazione fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl restart fail2ban
systemctl enable fail2ban

log "Fail2ban configurato"

# 12. Ottimizzazioni sistema
log "Ottimizzazioni sistema..."

# Aumentare limiti file descriptor
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Ottimizzazioni kernel per VoIP
cat >> /etc/sysctl.conf << EOF

# VoIP Optimizations
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.udp_mem = 102400 873800 16777216
EOF

sysctl -p

log "Ottimizzazioni sistema applicate"

# 13. Creazione utente per l'applicazione
log "Creazione utente voip..."
useradd -r -s /bin/false -d /var/www/voip-system voip
chown -R voip:voip /var/www/voip-system
chown -R voip:voip /var/www/voip-uploads
chown -R voip:voip /var/www/voip-recordings

# 14. Configurazione logrotate
log "Configurazione logrotate..."
cat > /etc/logrotate.d/voip-system << EOF
/var/log/voip-system/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 voip voip
    postrotate
        systemctl reload voip-backend || true
    endscript
}
EOF

log "Setup base completato!"

echo ""
echo "✅ Setup server Debian completato con successo!"
echo ""
echo "📋 Servizi installati:"
echo "  - Node.js $(node --version)"
echo "  - PostgreSQL 15"
echo "  - Redis 7"
echo "  - Nginx"
echo "  - FreeSWITCH"
echo "  - PM2"
echo "  - Fail2ban"
echo ""
echo "🔧 Prossimi passi:"
echo "  1. Copiare il codice dell'applicazione in /var/www/voip-system"
echo "  2. Configurare le variabili d'ambiente"
echo "  3. Eseguire le migrazioni database"
echo "  4. Configurare Nginx"
echo "  5. Avviare i servizi"
echo ""
echo "📁 Directory create:"
echo "  - /var/www/voip-system (applicazione)"
echo "  - /var/www/voip-uploads (upload files)"
echo "  - /var/www/voip-recordings (registrazioni)"
echo "  - /var/log/voip-system (log applicazione)"
echo "  - /etc/voip-system (configurazioni)"
echo ""
