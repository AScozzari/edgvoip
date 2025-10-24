"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freeSwitchXmlService = exports.FreeSwitchXmlService = void 0;
const database_1 = require("@w3-voip/database");
class FreeSwitchXmlService {
    /**
     * Genera XML per user registration/authentication
     */
    async generateUserXml(extension, tenant) {
        const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<document type="freeswitch/xml">
  <section name="directory">
    <domain name="${tenant.sip_domain}">
      <params>
        <param name="dial-string" value="{presence_id=\${dialed_user}@\${dialed_domain}}\${sofia_contact(\${dialed_user}@\${dialed_domain})}"/>
      </params>
      <groups>
        <group name="default">
          <users>
            <user id="${extension.extension}">
              <params>
                <param name="password" value="${extension.password}"/>
                <param name="vm-password" value="${extension.extension}"/>
                <param name="dial-string" value="{^^:sip_invite_domain=\${dialed_domain}:presence_id=\${dialed_user}@\${dialed_domain}}\${sofia_contact(*\${dialed_user}@\${dialed_domain})},\${verto_contact(\${dialed_user}@\${dialed_domain})}"/>
              </params>
              <variables>
                <variable name="tenant_id" value="${tenant.id}"/>
                <variable name="tenant_slug" value="${tenant.slug}"/>
                <variable name="toll_allow" value="domestic,international,local"/>
                <variable name="accountcode" value="${extension.extension}"/>
                <variable name="user_context" value="${tenant.slug}"/>
                <variable name="domain_name" value="${tenant.sip_domain}"/>
                <variable name="effective_caller_id_name" value="${extension.display_name || extension.extension}"/>
                <variable name="effective_caller_id_number" value="${extension.extension}"/>
                <variable name="outbound_caller_id_name" value="${extension.display_name || extension.extension}"/>
                <variable name="outbound_caller_id_number" value="${extension.extension}"/>
                <variable name="callgroup" value="${tenant.id}"/>
              </variables>
            </user>
          </users>
        </group>
      </groups>
    </domain>
  </section>
</document>`;
        return xml;
    }
    /**
     * Genera XML per dialplan
     */
    async generateDialplanXml(tenant, extensionNumber) {
        const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<document type="freeswitch/xml">
  <section name="dialplan" description="Tenant Dialplan">
    <context name="${tenant.slug}">
      <!-- Internal extension to extension calls -->
      <extension name="${tenant.slug}_local">
        <condition field="destination_number" expression="^(\\d{3,5})$">
          <action application="set" data="tenant_id=${tenant.id}"/>
          <action application="set" data="tenant_slug=${tenant.slug}"/>
          <action application="set" data="call_direction=internal"/>
          <action application="bridge" data="user/\${destination_number}@${tenant.sip_domain}"/>
        </condition>
      </extension>

      <!-- Outbound calls via trunk -->
      <extension name="${tenant.slug}_outbound">
        <condition field="destination_number" expression="^(\\+?[1-9]\\d{1,14})$">
          <action application="set" data="tenant_id=${tenant.id}"/>
          <action application="set" data="tenant_slug=${tenant.slug}"/>
          <action application="set" data="call_direction=outbound"/>
          <action application="set" data="effective_caller_id_name=${tenant.name}"/>
          <action application="bridge" data="sofia/gateway/messagenet/\${destination_number}"/>
        </condition>
      </extension>
    </context>
  </section>
</document>`;
        return xml;
    }
    /**
     * Genera XML vuoto/not found
     */
    generateNotFoundXml() {
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<document type="freeswitch/xml">
  <section name="result">
    <result status="not found"/>
  </section>
</document>`;
    }
    /**
     * Processa richiesta FreeSWITCH XML curl
     */
    async processXmlRequest(params) {
        try {
            console.log('📞 FreeSWITCH XML Request:', params);
            // Gestisci diversi formati di richiesta FreeSWITCH
            const anyParams = params;
            // Priorità per il dominio SIP
            let sipDomain = params.domain || anyParams.sip_to_host || anyParams.sip_req_host || anyParams.sip_auth_realm;
            // Se tag_name='domain' e key_name='name', il dominio è in key_value
            if (params.tag_name === 'domain' && params.key_name === 'name' && params.key_value) {
                sipDomain = params.key_value.toString();
            }
            // Priorità per l'username
            let user = params.user || anyParams.sip_auth_username || anyParams.sip_to_user || anyParams.sip_from_user;
            // Estrai dominio da formato "user@domain:port" o "domain:port"
            if (sipDomain && sipDomain.includes('@')) {
                sipDomain = sipDomain.split('@')[1];
            }
            if (sipDomain && sipDomain.includes(':')) {
                sipDomain = sipDomain.split(':')[0];
            }
            // Estrai user da formato "user@domain"
            if (user && user.includes('@')) {
                user = user.split('@')[0];
            }
            // Supporto parametri specifici di FreeSWITCH (xml_locate): tag_attr_name/tag_attr_val
            const tagName = anyParams.tag_name || params.tag_name;
            const tagAttrName = anyParams.tag_attr_name;
            const tagAttrVal = anyParams.tag_attr_val;
            // Mappa dominio da tag_attr_name quando tag_name=domain
            if (!sipDomain && tagName === 'domain' && tagAttrName) {
                sipDomain = tagAttrName;
            }
            // Estrai utente da tag_attr_val se nel formato "user 100"
            if (!user && tagAttrVal) {
                user = tagAttrVal.startsWith('user ') ? tagAttrVal.replace('user ', '').trim() : tagAttrVal.trim();
            }
            // section può essere un array, prendi il primo elemento
            const section = Array.isArray(params.section) ? params.section[0] : params.section;
            // Se section=dialplan e abbiamo context, prova a trovare il tenant dal context (slug)
            const context = anyParams.context || anyParams['Caller-Context'] || anyParams['Hunt-Context'];
            const client = await (0, database_1.getClient)();
            if (!sipDomain && section === 'dialplan' && context) {
                // Cerca tenant dal context (che corrisponde allo slug)
                console.log(`🔍 Looking for tenant by context/slug: ${context}`);
                try {
                    const tenantBySlug = await client.query('SELECT id, slug, name, sip_domain FROM tenants WHERE slug = $1 AND status = $2', [context, 'active']);
                    if (tenantBySlug.rows.length > 0) {
                        sipDomain = tenantBySlug.rows[0].sip_domain;
                        console.log(`✅ Found tenant by context: ${context} -> domain: ${sipDomain}`);
                    }
                }
                catch (err) {
                    console.error('Error looking up tenant by context:', err);
                }
            }
            if (!sipDomain) {
                console.log('❌ No SIP domain provided');
                await client.release();
                return this.generateNotFoundXml();
            }
            // Trova tenant dal sip_domain
            try {
                // NO RLS per la query tenants (è una lookup globale)
                const tenantResult = await client.query('SELECT id, slug, name, sip_domain FROM tenants WHERE sip_domain = $1 AND status = $2', [sipDomain, 'active']);
                if (tenantResult.rows.length === 0) {
                    console.log(`❌ Tenant not found for SIP domain: ${sipDomain}`);
                    return this.generateNotFoundXml();
                }
                const tenant = tenantResult.rows[0];
                console.log(`✅ Found tenant: ${tenant.slug} (${tenant.id})`);
                // Imposta RLS context per le query successive
                // NOTA: SET LOCAL non supporta parametri, ma tenant.id è già validato dalla query precedente
                await client.query(`SET LOCAL app.current_tenant_id = '${tenant.id}'`);
                await client.query("SET LOCAL app.user_role = 'system'");
                // Gestisci richiesta directory (user authentication)
                if (section === 'directory' && user) {
                    const extensionResult = await client.query('SELECT * FROM extensions WHERE extension = $1 AND tenant_id = $2 AND status = $3', [user, tenant.id, 'active']);
                    if (extensionResult.rows.length === 0) {
                        console.log(`❌ Extension ${user} not found for tenant ${tenant.slug}`);
                        return this.generateNotFoundXml();
                    }
                    const extension = extensionResult.rows[0];
                    console.log(`✅ Found extension: ${extension.extension}`);
                    return await this.generateUserXml(extension, tenant);
                }
                // Gestisci richiesta dialplan
                if (section === 'dialplan') {
                    console.log(`✅ Generating dialplan for tenant: ${tenant.slug}`);
                    return await this.generateDialplanXml(tenant);
                }
                // Richiesta non gestita
                console.log(`⚠️ Unhandled section: ${section}`);
                return this.generateNotFoundXml();
            }
            finally {
                await client.release();
            }
        }
        catch (error) {
            console.error('❌ FreeSWITCH XML Service Error:', error);
            return this.generateNotFoundXml();
        }
    }
}
exports.FreeSwitchXmlService = FreeSwitchXmlService;
exports.freeSwitchXmlService = new FreeSwitchXmlService();
//# sourceMappingURL=freeswitch-xml.service.js.map