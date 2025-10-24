#!/bin/bash

# EDG VoIP System - Auto Deploy Script
# Deploy automatico su server cloud Debian

set -e

# Configurazione - IP del server
SERVER_IP="93.93.113.13"
SERVER_USER="root"
SERVER_PASSWORD="B66v6My6"

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

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

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verifica parametri
if [ -z "$SERVER_IP" ]; then
    error "SERVER_IP non configurato! Modificare lo script con l'IP del server."
fi

log "🚀 EDG VoIP System - Auto Deploy"
log "Server: $SERVER_IP"
log "User: $SERVER_USER"

# Verifica connessione SSH
log "Test connessione SSH..."
if ! sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "echo 'SSH OK'" >/dev/null 2>&1; then
    error "Impossibile connettersi al server $SERVER_IP"
fi

# 1. Setup server base
log "📦 Setup server base..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no scripts/setup-debian-server.sh $SERVER_USER@$SERVER_IP:/tmp/
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
chmod +x /tmp/setup-debian-server.sh
/tmp/setup-debian-server.sh
EOF

# 2. Aggiorna env.production con IP reale
log "🔧 Configurazione environment..."
sed "s/YOUR_SERVER_IP/$SERVER_IP/g" env.production > env.production.tmp
mv env.production.tmp env.production

# 3. Crea archivio del progetto
log "📦 Creazione archivio progetto..."
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='scripts/auto-deploy.sh' \
    -czf voip-system.tar.gz \
    packages/ \
    scripts/ \
    env.production \
    package.json \
    package-lock.json \
    DEPLOYMENT_PRODUCTION.md

# 4. Copia archivio sul server
log "📤 Upload archivio sul server..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no voip-system.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# 5. Deploy applicazione
log "🚀 Deploy applicazione..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
set -e

echo "📦 Estrazione archivio..."
cd /var/www/voip-system
tar -xzf /tmp/voip-system.tar.gz
rm /tmp/voip-system.tar.gz

echo "🔧 Configurazione permessi..."
chown -R voip:voip /var/www/voip-system
chmod -R 755 /var/www/voip-system

echo "📦 Installazione dipendenze..."
cd /var/www/voip-system/packages/backend && npm install --production
cd /var/www/voip-system/packages/frontend && npm install --production && npm run build
cd /var/www/voip-system/packages/database && npm install --production
cd /var/www/voip-system/packages/shared && npm install --production

echo "🔧 Configurazione environment..."
cp /var/www/voip-system/env.production /etc/voip-system/.env
chown voip:voip /etc/voip-system/.env
chmod 600 /etc/voip-system/.env

echo "📊 Migrazioni database..."
cd /var/www/voip-system/packages/database
source /etc/voip-system/.env
npm run migrate

echo "🌱 Seed database..."
npm run seed

echo "✅ Deploy applicazione completato!"
EOF

# 6. Configura Nginx
log "🌐 Configurazione Nginx..."
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

# 7. Configura FreeSWITCH
log "📞 Configurazione FreeSWITCH..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
# Backup configurazione originale
cp -r /etc/freeswitch /etc/freeswitch.backup

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

# 8. Crea servizio systemd per backend
log "⚙️ Configurazione servizio backend..."
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

# 9. Verifica stato servizi
log "🔍 Verifica stato servizi..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
echo "📊 Stato servizi:"
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "Redis: $(systemctl is-active redis-server)"
echo "Nginx: $(systemctl is-active nginx)"
echo "FreeSWITCH: $(systemctl is-active freeswitch)"
echo "VoIP Backend: $(systemctl is-active voip-backend)"

echo ""
echo "🔍 Porte in ascolto:"
netstat -tlnp | grep -E ':(80|5000|5060|5061|8021|5432|6379)'

echo ""
echo "📝 Log backend (ultimi 10):"
journalctl -u voip-backend --no-pager -n 10
EOF

# 10. Test finale
log "🧪 Test finale sistema..."
sleep 5

# Test API Health
if curl -f -s http://$SERVER_IP/api/health >/dev/null; then
    log "✅ API Health check: OK"
else
    warn "⚠️ API Health check: FAILED"
fi

# Test Frontend
if curl -f -s http://$SERVER_IP/ >/dev/null; then
    log "✅ Frontend: OK"
else
    warn "⚠️ Frontend: FAILED"
fi

# Pulizia locale
rm -f voip-system.tar.gz

log "🎉 Deploy completato con successo!"
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
