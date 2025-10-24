#!/bin/bash

# Test script per verificare che il sistema VoIP sia funzionante

set -e

SERVER_IP="YOUR_SERVER_IP"
SERVER_USER="root"
SERVER_PASSWORD="80gjapA7"

echo "🧪 Test EDG VoIP System Production"
echo "=================================="

# Test 1: Connessione SSH
echo "1. Test connessione SSH..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "echo 'SSH OK'"

# Test 2: Servizi attivi
echo "2. Test servizi attivi..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "Redis: $(systemctl is-active redis-server)"
echo "Nginx: $(systemctl is-active nginx)"
echo "FreeSWITCH: $(systemctl is-active freeswitch)"
echo "VoIP Backend: $(systemctl is-active voip-backend)"
EOF

# Test 3: Porte aperte
echo "3. Test porte..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "netstat -tlnp | grep -E ':(80|5000|5060|8021)'"

# Test 4: API Health
echo "4. Test API Health..."
curl -f http://$SERVER_IP/api/health || echo "API non raggiungibile"

# Test 5: Frontend
echo "5. Test Frontend..."
curl -f http://$SERVER_IP/ || echo "Frontend non raggiungibile"

echo "✅ Test completati!"
