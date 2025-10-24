# 🚀 EDG VoIP - Comandi Deployment VPS Step-by-Step

**Server:** 93.93.113.13  
**Password:** B66v6My6  
**Database:** edgvoip  
**User DB:** edgadmin  
**Password DB:** VoipSecure2024!

---

## PASSO 1: Connessione al VPS

```bash
ssh root@93.93.113.13
# Password: B66v6My6
```

---

## PASSO 2: Installazione Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version
```

---

## PASSO 3: Creazione Directory Progetto

```bash
mkdir -p /opt/edgvoip
cd /opt/edgvoip
```

---

## PASSO 4: Upload Codice (DAL TUO COMPUTER LOCALE)

**Apri un NUOVO terminale sul tuo computer (NON sul VPS):**

```bash
# Vai nella directory del progetto
cd /path/to/your/project

# Comprimi il progetto
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='build' \
    -czf edgvoip-deploy.tar.gz \
    packages/ package.json tsconfig.json

# Carica sul VPS
scp edgvoip-deploy.tar.gz root@93.93.113.13:/opt/edgvoip/
```

---

## PASSO 5: Estrazione e Build (TORNA SUL VPS)

```bash
cd /opt/edgvoip
tar -xzf edgvoip-deploy.tar.gz
npm install
cd packages/database && npm run build && cd ../..
cd packages/backend && npm install && cd ../..
cd packages/frontend && npm install && npm run build && cd ../..
```

---

## PASSO 6: Configurazione Environment Variables

```bash
cat > /opt/edgvoip/packages/backend/.env << 'ENVEOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://edgadmin:VoipSecure2024!@localhost:5432/edgvoip
JWT_SECRET=TEMP_SECRET_WILL_BE_REPLACED
CORS_ORIGIN=http://93.93.113.13,http://demo.edgvoip.it,http://edgvoip.it

FREESWITCH_HOST=localhost
FREESWITCH_PORT=8021
FREESWITCH_PASSWORD=ClueCon
ENVEOF

# Genera JWT Secret sicuro
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s|JWT_SECRET=TEMP_SECRET_WILL_BE_REPLACED|JWT_SECRET=$JWT_SECRET|" /opt/edgvoip/packages/backend/.env

# Verifica
cat /opt/edgvoip/packages/backend/.env
```

---

## PASSO 7: Inizializzazione Database

```bash
cd /opt/edgvoip/packages/backend
npm run db:push
```

---

## PASSO 8: Configurazione Nginx

```bash
apt install -y nginx

cat > /etc/nginx/sites-available/edgvoip << 'NGINXEOF'
server {
    listen 80;
    server_name 93.93.113.13 demo.edgvoip.it edgvoip.it;

    root /opt/edgvoip/packages/frontend/dist;
    index index.html;

    # Disable caching for HTML
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/edgvoip /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx
```

---

## PASSO 9: Configurazione Servizio Backend

```bash
cat > /etc/systemd/system/edgvoip-backend.service << 'SYSTEMDEOF'
[Unit]
Description=EDG VoIP Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/edgvoip/packages/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SYSTEMDEOF

systemctl daemon-reload
systemctl start edgvoip-backend
systemctl enable edgvoip-backend
systemctl status edgvoip-backend
```

---

## PASSO 10: Configurazione Firewall

```bash
apt install -y ufw
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5060/udp
ufw allow 5061/tcp
ufw allow 16384:32768/udp
ufw --force enable
ufw status
```

---

## PASSO 11: Test Finale

```bash
# Test backend locale
curl http://localhost:3001/api/demo/validate

# Test da browser
echo "Apri nel browser: http://93.93.113.13/demo/login"
echo "Credenziali: admin@demo.local / tenantadmin123"
```

---

## COMANDI UTILI POST-DEPLOYMENT

```bash
# Visualizza logs backend
journalctl -u edgvoip-backend -f

# Restart backend
systemctl restart edgvoip-backend

# Stato servizi
systemctl status edgvoip-backend nginx postgresql

# Logs Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Accesso database
sudo -u postgres psql -d edgvoip
```

---

## TROUBLESHOOTING

**Backend non si avvia:**
```bash
journalctl -u edgvoip-backend -n 50
```

**Nginx errori:**
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

**Database problemi:**
```bash
sudo -u postgres psql -d edgvoip -c "\dt"
```

---

✅ **DEPLOYMENT COMPLETATO!**
