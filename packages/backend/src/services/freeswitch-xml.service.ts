import { getClient } from '@w3-voip/database';

export interface FreeSwitchXmlParams {
  section?: string;
  tag_name?: string;
  key_name?: string;
  key_value?: string;
  user?: string;
  domain?: string;
  action?: string;
  'Event-Name'?: string;
  'Caller-Caller-ID-Number'?: string;
  'Caller-Destination-Number'?: string;
  'Hunt-Destination-Number'?: string;
  'variable_domain_name'?: string;
  [key: string]: string | undefined;
}

export class FreeSwitchXmlService {
  /**
   * Genera XML per user registration/authentication
   */
  async generateUserXml(extension: any, tenant: any): Promise<string> {
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
              </params>
              <variables>
                <variable name="tenant_id" value="${tenant.id}"/>
                <variable name="tenant_slug" value="${tenant.slug}"/>
                <variable name="toll_allow" value="domestic,international,local"/>
                <variable name="accountcode" value="${extension.extension}"/>
                <variable name="user_context" value="${tenant.slug}"/>
                <variable name="effective_caller_id_name" value="${extension.display_name || extension.extension}"/>
                <variable name="effective_caller_id_number" value="${extension.extension}"/>
                <variable name="callgroup" value="${tenant.id}"/>
                <variable name="outbound_caller_id_number" value="${extension.extension}"/>
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
   * Genera XML per dialplan completo con routing italiano, trunk, IVR, code, voicemail
   */
  async generateDialplanXml(tenant: any, params: FreeSwitchXmlParams): Promise<string> {
    const client = await getClient();
    
    try {
      // Recupera trunks attivi del tenant
      const trunksResult = await client.query(
        'SELECT * FROM sip_trunks WHERE tenant_id = $1 AND status = $2 ORDER BY name LIMIT 1',
        [tenant.id, 'active']
      );
      
      const trunk = trunksResult.rows.length > 0 ? trunksResult.rows[0] : null;
      const gatewayName = trunk ? `trunk_${trunk.id}` : 'messagenet';
      
      // Recupera IVR menus
      const ivrResult = await client.query(
        'SELECT * FROM ivr_menus WHERE tenant_id = $1 AND enabled = true',
        [tenant.id]
      );
      
      // Recupera call queues
      const queuesResult = await client.query(
        'SELECT * FROM call_queues WHERE tenant_id = $1 AND enabled = true',
        [tenant.id]
      );
      
      // Recupera voicemail boxes
      const voicemailResult = await client.query(
        'SELECT * FROM voicemail_boxes WHERE tenant_id = $1 AND enabled = true',
        [tenant.id]
      );

      // Genera IVR extensions
      let ivrExtensions = '';
      for (const ivr of ivrResult.rows) {
        ivrExtensions += `
      <!-- IVR Menu: ${ivr.name} -->
      <extension name="${tenant.slug}_ivr_${ivr.extension}">
        <condition field="destination_number" expression="^${ivr.extension}$">
          <action application="set" data="tenant_id=${tenant.id}"/>
          <action application="set" data="tenant_slug=${tenant.slug}"/>
          <action application="set" data="call_direction=ivr"/>
          <action application="answer"/>
          <action application="sleep" data="1000"/>
          <action application="ivr" data="ivr_${ivr.id}"/>
        </condition>
      </extension>`;
      }

      // Genera Queue extensions
      let queueExtensions = '';
      for (const queue of queuesResult.rows) {
        queueExtensions += `
      <!-- Call Queue: ${queue.name} -->
      <extension name="${tenant.slug}_queue_${queue.extension}">
        <condition field="destination_number" expression="^${queue.extension}$">
          <action application="set" data="tenant_id=${tenant.id}"/>
          <action application="set" data="tenant_slug=${tenant.slug}"/>
          <action application="set" data="call_direction=queue"/>
          <action application="answer"/>
          <action application="callcenter" data="queue_${queue.id}@${tenant.slug}"/>
        </condition>
      </extension>`;
      }

      // Genera Voicemail extensions
      let voicemailExtensions = '';
      for (const vm of voicemailResult.rows) {
        voicemailExtensions += `
      <!-- Voicemail: ${vm.mailbox_id} -->
      <extension name="${tenant.slug}_voicemail_${vm.mailbox_id}">
        <condition field="destination_number" expression="^\\*97$">
          <action application="set" data="tenant_id=${tenant.id}"/>
          <action application="answer"/>
          <action application="sleep" data="1000"/>
          <action application="voicemail" data="check default \${domain} ${vm.mailbox_id}"/>
        </condition>
      </extension>`;
      }

      const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<document type="freeswitch/xml">
  <section name="dialplan">
    <context name="${tenant.slug}">
      
      <!-- Emergency Numbers -->
      <extension name="${tenant.slug}_emergency">
        <condition field="destination_number" expression="^(112|113|115|118)$">
          <action application="set" data="tenant_id=${tenant.id}"/>
          <action application="set" data="tenant_slug=${tenant.slug}"/>
          <action application="set" data="call_direction=emergency"/>
          <action application="bridge" data="sofia/gateway/${gatewayName}/\${destination_number}"/>
        </condition>
      </extension>
      
      ${ivrExtensions}
      ${queueExtensions}
      ${voicemailExtensions}
      
      <!-- Internal Extension to Extension Calls -->
      <extension name="${tenant.slug}_internal">
        <condition field="destination_number" expression="^(\\d{3,5})$">
          <action application="set" data="tenant_id=${tenant.id}"/>
          <action application="set" data="tenant_slug=${tenant.slug}"/>
          <action application="set" data="call_direction=internal"/>
          <action application="set" data="hangup_after_bridge=true"/>
          <action application="bridge" data="user/\${destination_number}@${tenant.sip_domain}"/>
        </condition>
      </extension>
      
      <!-- Italian Mobile Numbers (cellulari) - 3XX XXXXXXXX -->
      <extension name="${tenant.slug}_italian_mobile">
        <condition field="destination_number" expression="^(3\\d{8,9})$">
          <action application="set" data="tenant_id=${tenant.id}"/>
          <action application="set" data="tenant_slug=${tenant.slug}"/>
          <action application="set" data="call_direction=outbound"/>
          <action application="set" data="destination_type=mobile_it"/>
          <action application="set" data="effective_caller_id_number=\${outbound_caller_id_number}"/>
          <action application="bridge" data="sofia/gateway/${gatewayName}/\${destination_number}"/>
        </condition>
      </extension>
      
      <!-- Italian Landline Numbers (fissi) - 0XX XXXXXXX -->
      <extension name="${tenant.slug}_italian_landline">
        <condition field="destination_number" expression="^(0\\d{8,10})$">
          <action application="set" data="tenant_id=${tenant.id}"/>
          <action application="set" data="tenant_slug=${tenant.slug}"/>
          <action application="set" data="call_direction=outbound"/>
          <action application="set" data="destination_type=landline_it"/>
          <action application="set" data="effective_caller_id_number=\${outbound_caller_id_number}"/>
          <action application="bridge" data="sofia/gateway/${gatewayName}/\${destination_number}"/>
        </condition>
      </extension>
      
      <!-- International Numbers - +XX... -->
      <extension name="${tenant.slug}_international">
        <condition field="destination_number" expression="^(\\+\\d{7,15})$">
          <action application="set" data="tenant_id=${tenant.id}"/>
          <action application="set" data="tenant_slug=${tenant.slug}"/>
          <action application="set" data="call_direction=outbound"/>
          <action application="set" data="destination_type=international"/>
          <action application="set" data="effective_caller_id_number=\${outbound_caller_id_number}"/>
          <action application="bridge" data="sofia/gateway/${gatewayName}/\${destination_number}"/>
        </condition>
      </extension>
      
      <!-- International Numbers without + prefix - 00XX... -->
      <extension name="${tenant.slug}_international_00">
        <condition field="destination_number" expression="^(00\\d{7,15})$">
          <action application="set" data="tenant_id=${tenant.id}"/>
          <action application="set" data="tenant_slug=${tenant.slug}"/>
          <action application="set" data="call_direction=outbound"/>
          <action application="set" data="destination_type=international"/>
          <action application="set" data="effective_caller_id_number=\${outbound_caller_id_number}"/>
          <action application="bridge" data="sofia/gateway/${gatewayName}/\${destination_number}"/>
        </condition>
      </extension>
      
    </context>
  </section>
</document>`;
      
      return xml;
      
    } finally {
      await client.release();
    }
  }

  /**
   * Genera XML vuoto/not found
   */
  generateNotFoundXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<document type="freeswitch/xml">
  <section name="result">
    <result status="not found"/>
  </section>
</document>`;
  }

  /**
   * Processa richiesta FreeSWITCH XML curl con fallback via extension
   */
  async processXmlRequest(params: FreeSwitchXmlParams): Promise<string> {
    try {
      console.log('📞 FreeSWITCH XML Request:', JSON.stringify(params, null, 2));

      // Estrai parametri da diverse sorgenti
      let sipDomain = params.domain || params['variable_domain_name'];
      let user = params.user || params['Caller-Caller-ID-Number'];
      
      // xml_locate può inviare formati diversi
      if (params.key_value) {
        const keyVal = params.key_value.toString();
        if (keyVal.startsWith('user ')) {
          user = keyVal.replace('user ', '').trim();
          sipDomain = sipDomain || params.key_name;
        } else {
          sipDomain = sipDomain || keyVal;
        }
      }
      
      sipDomain = sipDomain || params.key_name;
      
      const section = Array.isArray(params.section) ? params.section[0] : params.section;

      console.log(`🔍 Searching - Section: ${section}, Domain: ${sipDomain}, User: ${user}`);

      const client = await getClient();
      try {
        let tenant = null;
        
        // Tentativo 1: Trova tenant dal sip_domain
        if (sipDomain) {
          const tenantResult = await client.query(
            'SELECT id, slug, name, sip_domain FROM tenants WHERE sip_domain = $1 AND status = $2',
            [sipDomain, 'active']
          );

          if (tenantResult.rows.length > 0) {
            tenant = tenantResult.rows[0];
            console.log(`✅ Found tenant by domain: ${tenant.slug} (${tenant.sip_domain})`);
          }
        }

        // Tentativo 2: Trova tenant dall'extension (FALLBACK CRITICO per dialplan)
        if (!tenant && user) {
          console.log(`🔍 Tenant not found by domain, trying lookup by extension ${user}...`);
          
          const extResult = await client.query(`
            SELECT t.id, t.slug, t.name, t.sip_domain, e.extension
            FROM tenants t
            JOIN extensions e ON e.tenant_id = t.id
            WHERE e.extension = $1 AND t.status = $2 AND e.status = $3
            LIMIT 1
          `, [user, 'active', 'active']);

          if (extResult.rows.length > 0) {
            tenant = extResult.rows[0];
            console.log(`✅ Found tenant by extension: ${tenant.slug} (extension: ${user})`);
          }
        }

        // Nessun tenant trovato
        if (!tenant) {
          console.log(`❌ Tenant not found for domain: ${sipDomain}, user: ${user}`);
          return this.generateNotFoundXml();
        }

        // Gestisci richiesta directory (user authentication)
        if (section === 'directory' && user) {
          const extensionResult = await client.query(
            'SELECT * FROM extensions WHERE extension = $1 AND tenant_id = $2 AND status = $3',
            [user, tenant.id, 'active']
          );

          if (extensionResult.rows.length === 0) {
            console.log(`❌ Extension ${user} not found for tenant ${tenant.slug}`);
            return this.generateNotFoundXml();
          }

          const extension = extensionResult.rows[0];
          console.log(`✅ Found extension: ${extension.extension} for directory auth`);
          return await this.generateUserXml(extension, tenant);
        }

        // Gestisci richiesta dialplan
        if (section === 'dialplan') {
          console.log(`✅ Generating dialplan for tenant: ${tenant.slug}`);
          return await this.generateDialplanXml(tenant, params);
        }

        // Richiesta non gestita
        console.log(`⚠️ Unhandled section: ${section}`);
        return this.generateNotFoundXml();

      } finally {
        await client.release();
      }

    } catch (error) {
      console.error('❌ FreeSWITCH XML Service Error:', error);
      return this.generateNotFoundXml();
    }
  }
}

export const freeSwitchXmlService = new FreeSwitchXmlService();
