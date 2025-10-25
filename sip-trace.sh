#!/bin/bash
# SIP Trace Script - Monitoraggio continuo traffico SIP

echo '========================================='
echo 'SIP TRACE - Monitoraggio Continuo'
echo 'Server: edgvoip.it (93.93.113.13)'
echo 'Porta SIP: 5060 (UDP/TCP)'
echo '========================================='
echo ''

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}✓ Avvio monitoraggio SIP...${NC}"
echo -e "${CYAN}Premi CTRL+C per terminare${NC}"
echo ''

# Trace SIP con tcpdump - formato leggibile
tcpdump -i any -n -s 0 -A 'port 5060' 2>/dev/null | while read line; do
    if echo "$line" | grep -q "INVITE"; then
        echo -e "${YELLOW}>>> [INVITE]${NC} $line"
    elif echo "$line" | grep -q "REGISTER"; then
        echo -e "${GREEN}>>> [REGISTER]${NC} $line"
    elif echo "$line" | grep -q "BYE"; then
        echo -e "${RED}>>> [BYE]${NC} $line"
    elif echo "$line" | grep -q "ACK"; then
        echo -e "${BLUE}>>> [ACK]${NC} $line"
    elif echo "$line" | grep -q "OPTIONS"; then
        echo -e "${CYAN}>>> [OPTIONS]${NC} $line"
    elif echo "$line" | grep -q "SIP/2.0"; then
        echo -e "${BLUE}<<< [RESPONSE]${NC} $line"
    elif echo "$line" | grep -q "From:\|To:\|Call-ID:\|CSeq:"; then
        echo -e "${GREEN}    $line${NC}"
    else
        echo "$line"
    fi
done

