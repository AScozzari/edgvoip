#!/bin/bash

# Script per generare configurazioni FreeSWITCH per ogni tenant
# Basato sul sistema multi-tenant con SIP domain dedicati

set -e

# Configurazione database
DB_HOST="localhost"
DB_USER="edgadmin"
DB_PASS="edgvoip2024"
DB_NAME="edgvoip"

# Directory FreeSWITCH
FS_CONF_DIR="/usr/local/freeswitch/etc/freeswitch"
FS_DOMAIN_DIR="${FS_CONF_DIR}/directory/domain"
FS_DIALPLAN_DIR="${FS_CONF_DIR}/dialplan/default"

echo "🚀 Generazione configurazioni FreeSWITCH multi-tenant"
echo "================================================="

# Crea le directory se non esistono
mkdir -p "${FS_DOMAIN_DIR}"
mkdir -p "${FS_DIALPLAN_DIR}"

# Query per ottenere tutti i tenant attivi con SIP domain
PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -F"|" -c "
SELECT 
  id,
  slug,
  name,
  sip_domain
FROM tenants 
WHERE status = 'active' 
  AND sip_domain IS NOT NULL
ORDER BY created_at;
" | while IFS='|' read -r tenant_id slug name sip_domain; do
  
  echo ""
  echo "📞 Configurando tenant: ${name} (${slug})"
  echo "   SIP Domain: ${sip_domain}"
  
  # Crea file di configurazione domain per il tenant
  DOMAIN_FILE="${FS_DOMAIN_DIR}/${sip_domain}.xml"
  
  cat > "${DOMAIN_FILE}" << 'EOFXML'
<include>
  <!-- Tenant: ${name} (${slug}) -->
  <!-- SIP Domain: ${sip_domain} -->
  <domain name="${sip_domain}">
    <params>
      <param name="dial-string" value="{presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(${dialed_user}@${dialed_domain})}"/>
    </params>
    
    <variables>
      <variable name="tenant_id" value="${tenant_id}"/>
      <variable name="tenant_slug" value="${slug}"/>
      <variable name="tenant_name" value="${name}"/>
    </variables>
    
    <groups>
      <group name="default">
        <users>
          <!-- Users loaded from database via mod_xml_curl -->
        </users>
      </group>
    </groups>
  </domain>
</include>
EOFXML

  # Sostituisci le variabili nel file appena creato
  sed -i "s/\${tenant_id}/${tenant_id}/g" "${DOMAIN_FILE}"
  sed -i "s/\${slug}/${slug}/g" "${DOMAIN_FILE}"
  sed -i "s/\${name}/${name}/g" "${DOMAIN_FILE}"
  sed -i "s/\${sip_domain}/${sip_domain}/g" "${DOMAIN_FILE}"
  
  echo "   ✅ Domain configuration: ${DOMAIN_FILE}"
  
  # Crea dialplan per il tenant
  DIALPLAN_FILE="${FS_DIALPLAN_DIR}/${slug}_dialplan.xml"
  
  cat > "${DIALPLAN_FILE}" << 'EOFXML'
<include>
  <!-- Dialplan for tenant: ${name} (${slug}) -->
  <context name="${sip_domain}">
    
    <!-- Internal extensions (1000-1999) -->
    <extension name="${slug}_internal">
      <condition field="destination_number" expression="^(1[0-9]{3})$">
        <action application="set" data="call_direction=internal"/>
        <action application="set" data="tenant_id=${tenant_id}"/>
        <action application="set" data="tenant_slug=${slug}"/>
        <action application="set" data="hangup_after_bridge=true"/>
        <action application="bridge" data="user/${destination_number}@${sip_domain}"/>
      </condition>
    </extension>
    
    <!-- Outbound calls (international format) -->
    <extension name="${slug}_outbound">
      <condition field="destination_number" expression="^(\+?[1-9]\d{1,14})$">
        <action application="set" data="call_direction=outbound"/>
        <action application="set" data="tenant_id=${tenant_id}"/>
        <action application="set" data="tenant_slug=${slug}"/>
        <action application="set" data="hangup_after_bridge=true"/>
        <action application="bridge" data="sofia/gateway/${slug}_trunk/${destination_number}"/>
      </condition>
    </extension>
    
  </context>
</include>
EOFXML

  # Sostituisci le variabili
  sed -i "s/\${tenant_id}/${tenant_id}/g" "${DIALPLAN_FILE}"
  sed -i "s/\${slug}/${slug}/g" "${DIALPLAN_FILE}"
  sed -i "s/\${name}/${name}/g" "${DIALPLAN_FILE}"
  sed -i "s/\${sip_domain}/${sip_domain}/g" "${DIALPLAN_FILE}"
  
  echo "   ✅ Dialplan configuration: ${DIALPLAN_FILE}"
  
done

echo ""
echo "✅ Configurazioni generate con successo!"
echo ""
echo "📋 Directory configurazioni:"
echo "   Domains: ${FS_DOMAIN_DIR}"
echo "   Dialplans: ${FS_DIALPLAN_DIR}"
echo ""
echo "⚠️  Ricorda di riavviare FreeSWITCH: systemctl restart freeswitch"

