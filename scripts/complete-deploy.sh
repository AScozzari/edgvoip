#!/bin/bash

# EDG VoIP System - Complete Deploy Script
# Deploy completo in una volta sola

set -e

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

echo "🚀 EDG VoIP System - Complete Deploy"
echo "===================================="
echo ""

# Verifica prerequisiti
log "Verifica prerequisiti..."
if ! command -v sshpass &> /dev/null; then
    error "sshpass non trovato. Installare con: apt-get install sshpass"
fi

# IP del server configurato
SERVER_IP="93.93.113.13"
log "Server IP configurato: $SERVER_IP"

# Test connessione
log "Test connessione al server $SERVER_IP..."
if ! timeout 5 bash -c "</dev/tcp/$SERVER_IP/22" 2>/dev/null; then
    error "Impossibile connettersi al server $SERVER_IP (porta 22 chiusa)"
fi

# Test credenziali
log "Test credenziali..."
if ! sshpass -p "80gjapA7" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$SERVER_IP "echo 'OK'" >/dev/null 2>&1; then
    error "Credenziali non valide per root@$SERVER_IP"
fi

log "✅ Server $SERVER_IP raggiungibile e credenziali valide!"

# Configura script con IP
log "Configurazione script con IP $SERVER_IP..."
sed -i "s/SERVER_IP=\"\"/SERVER_IP=\"$SERVER_IP\"/" scripts/auto-deploy.sh
sed -i "s/YOUR_SERVER_IP/$SERVER_IP/g" env.production

# Esegui deploy automatico
log "Avvio deploy automatico..."
./scripts/auto-deploy.sh

log "🎉 Deploy completato con successo!"
echo ""
echo "🌐 Accesso all'applicazione:"
echo "  Frontend: http://$SERVER_IP"
echo "  API: http://$SERVER_IP/api"
echo "  Super Admin: http://$SERVER_IP/edgvoip/login"
echo ""
echo "🔑 Credenziali:"
echo "  Super Admin: admin@edgvoip.local / SuperAdmin2025!"
echo "  Demo Tenant: admin@demo.local / tenantadmin123"
echo ""
echo "📋 Comandi utili:"
echo "  ssh root@$SERVER_IP"
echo "  systemctl status voip-backend"
echo "  journalctl -u voip-backend -f"
