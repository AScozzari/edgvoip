#!/bin/bash

# EDG VoIP System - Deploy to Debian Server
# Copia il codice sul server e configura l'applicazione

set -e

# Configurazione server
SERVER_IP="93.93.113.13"  # IP del server
SERVER_USER="root"
SERVER_PASSWORD="B66v6My6"
LOCAL_PROJECT_PATH="."

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Verifica che sshpass sia installato
if ! command -v sshpass &> /dev/null; then
    warn "sshpass non trovato. Installazione..."
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Windows con WSL/Git Bash
        echo "Per Windows, installa sshpass manualmente o usa PuTTY"
        exit 1
    else
        # Linux/macOS
        sudo apt-get install -y sshpass || brew install sshpass
    fi
fi

log "🚀 Deploy EDG VoIP System su server Debian"
log "Server: $SERVER_IP"
log "User: $SERVER_USER"

# 1. Creare archivio del progetto
log "Creazione archivio del progetto..."
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.env' \
    --exclude='.env.local' \
    -czf voip-system.tar.gz \
    packages/ \
    scripts/ \
    env.production \
    package.json \
    package-lock.json

# 2. Copiare archivio sul server
log "Copia archivio sul server..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no voip-system.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# 3. Estrarre e configurare sul server
log "Configurazione sul server..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
set -e

echo "📦 Estrazione archivio..."
cd /var/www/voip-system
tar -xzf /tmp/voip-system.tar.gz
rm /tmp/voip-system.tar.gz

echo "🔧 Configurazione permessi..."
chown -R voip:voip /var/www/voip-system
chmod -R 755 /var/www/voip-system

echo "📦 Installazione dipendenze backend..."
cd /var/www/voip-system/packages/backend
npm install --production

echo "📦 Installazione dipendenze frontend..."
cd /var/www/voip-system/packages/frontend
npm install --production
npm run build

echo "📦 Installazione dipendenze database..."
cd /var/www/voip-system/packages/database
npm install --production

echo "📦 Installazione dipendenze shared..."
cd /var/www/voip-system/packages/shared
npm install --production

echo "🔧 Copia file di configurazione..."
cp /var/www/voip-system/env.production /etc/voip-system/.env
chown voip:voip /etc/voip-system/.env
chmod 600 /etc/voip-system/.env

echo "📊 Esecuzione migrazioni database..."
cd /var/www/voip-system/packages/database
source /etc/voip-system/.env
npm run migrate

echo "🌱 Seed database..."
npm run seed

echo "✅ Deploy completato!"
EOF

# 4. Configurare Nginx
log "Configurazione Nginx..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cat > /etc/nginx/sites-available/voip-system << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
    
    # Frontend
    location / {
        root /var/www/voip-system/packages/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API endpoints
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Auth endpoints - stricter rate limiting
    location ~ ^/api/.*/(login|register) {
        limit_req zone=auth_limit burst=3 nodelay;
        
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
NGINX_EOF

# Abilitare il sito
ln -sf /etc/nginx/sites-available/voip-system /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configurazione Nginx
nginx -t

# Riavviare Nginx
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx configurato"
EOF

# 5. Configurare FreeSWITCH
log "Configurazione FreeSWITCH..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
# Backup configurazione originale
cp -r /etc/freeswitch /etc/freeswitch.backup

# Copiare configurazioni personalizzate
cp -r /var/www/voip-system/docker/freeswitch/conf/* /etc/freeswitch/

# Aggiornare password ESL
sed -i "s/ClueCon/1QzGEWv0Q6ao20M+hS8qeLI+u9gw77WuJGB5Z1xDk30=/g" /etc/freeswitch/vars.xml

# Configurare permessi
chown -R freeswitch:freeswitch /etc/freeswitch
chown -R freeswitch:freeswitch /var/lib/freeswitch
chown -R freeswitch:freeswitch /var/log/freeswitch

# Test configurazione
freeswitch -t

# Avviare FreeSWITCH
systemctl start freeswitch
systemctl enable freeswitch

echo "✅ FreeSWITCH configurato"
EOF

# 6. Creare servizio systemd per il backend
log "Creazione servizio systemd..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
cat > /etc/systemd/system/voip-backend.service << 'SERVICE_EOF'
[Unit]
Description=EDG VoIP System Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=voip
Group=voip
WorkingDirectory=/var/www/voip-system/packages/backend
Environment=NODE_ENV=production
EnvironmentFile=/etc/voip-system/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=voip-backend

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Ricaricare systemd e avviare servizio
systemctl daemon-reload
systemctl enable voip-backend
systemctl start voip-backend

echo "✅ Servizio backend creato e avviato"
EOF

# 7. Verificare stato servizi
log "Verifica stato servizi..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
echo "📊 Stato servizi:"
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "Redis: $(systemctl is-active redis-server)"
echo "Nginx: $(systemctl is-active nginx)"
echo "FreeSWITCH: $(systemctl is-active freeswitch)"
echo "VoIP Backend: $(systemctl is-active voip-backend)"

echo ""
echo "🔍 Porte in ascolto:"
netstat -tlnp | grep -E ':(80|443|5000|5060|5061|8021|5432|6379)'

echo ""
echo "📝 Log backend:"
journalctl -u voip-backend --no-pager -n 10
EOF

# 8. Pulizia locale
log "Pulizia file temporanei..."
rm -f voip-system.tar.gz

log "✅ Deploy completato con successo!"
echo ""
echo "🌐 Accesso all'applicazione:"
echo "  Frontend: http://$SERVER_IP"
echo "  API: http://$SERVER_IP/api"
echo "  Super Admin: http://$SERVER_IP/edgvoip/login"
echo ""
echo "🔑 Credenziali di default:"
echo "  Super Admin: admin@edgvoip.local / SuperAdmin2025!"
echo "  Demo Tenant: admin@demo.local / tenantadmin123"
echo ""
echo "📋 Comandi utili:"
echo "  Stato servizi: systemctl status voip-backend"
echo "  Log backend: journalctl -u voip-backend -f"
echo "  Riavvia backend: systemctl restart voip-backend"
echo "  Log FreeSWITCH: journalctl -u freeswitch -f"
