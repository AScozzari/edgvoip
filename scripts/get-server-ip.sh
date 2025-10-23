#!/bin/bash

# Script per ottenere l'IP del server e configurare il deployment

echo "🔍 EDG VoIP System - Server IP Configuration"
echo "============================================="

# Funzione per testare connessione
test_connection() {
    local ip=$1
    echo -n "Test connessione $ip... "
    if timeout 5 bash -c "</dev/tcp/$ip/22" 2>/dev/null; then
        echo "✅ SSH aperto"
        return 0
    else
        echo "❌ SSH chiuso"
        return 1
    fi
}

# Funzione per testare credenziali
test_credentials() {
    local ip=$1
    echo -n "Test credenziali $ip... "
    if sshpass -p "80gjapA7" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$ip "echo 'OK'" >/dev/null 2>&1; then
        echo "✅ Credenziali valide"
        return 0
    else
        echo "❌ Credenziali non valide"
        return 1
    fi
}

echo ""
echo "Inserisci l'IP del server Debian:"
read -p "IP: " SERVER_IP

if [ -z "$SERVER_IP" ]; then
    echo "❌ IP non inserito!"
    exit 1
fi

echo ""
echo "🧪 Test connessione al server $SERVER_IP..."

# Test connessione SSH
if ! test_connection $SERVER_IP; then
    echo "❌ Impossibile connettersi al server $SERVER_IP"
    echo "Verificare che:"
    echo "  - L'IP sia corretto"
    echo "  - La porta 22 sia aperta"
    echo "  - Il server sia raggiungibile"
    exit 1
fi

# Test credenziali
if ! test_credentials $SERVER_IP; then
    echo "❌ Credenziali non valide per $SERVER_IP"
    echo "Verificare che:"
    echo "  - L'utente sia 'root'"
    echo "  - La password sia '80gjapA7'"
    exit 1
fi

echo ""
echo "✅ Server $SERVER_IP raggiungibile e credenziali valide!"

# Aggiorna script di deployment
echo ""
echo "🔧 Configurazione script di deployment..."

# Aggiorna auto-deploy.sh
sed -i "s/SERVER_IP=\"\"/SERVER_IP=\"$SERVER_IP\"/" scripts/auto-deploy.sh

# Aggiorna env.production
sed -i "s/YOUR_SERVER_IP/$SERVER_IP/g" env.production

echo "✅ Script configurati con IP: $SERVER_IP"

echo ""
echo "🚀 Pronto per il deployment!"
echo ""
echo "Per procedere con il deployment automatico:"
echo "  chmod +x scripts/auto-deploy.sh"
echo "  ./scripts/auto-deploy.sh"
echo ""
echo "Il deployment includerà:"
echo "  ✅ Setup completo server Debian"
echo "  ✅ Installazione PostgreSQL, Redis, FreeSWITCH, Nginx"
echo "  ✅ Deploy applicazione VoIP"
echo "  ✅ Configurazione servizi e firewall"
echo "  ✅ Test finale del sistema"
echo ""
echo "Tempo stimato: 10-15 minuti"
