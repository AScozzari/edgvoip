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
  async generateDialplanXml(tenant: any, extensionNumber?: string): Promise<string> {
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
          <action application="bridge" data="sofia/gateway/trunk_${tenant.id}/\${destination_number}"/>
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
  generateNotFoundXml(): string {
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
  async processXmlRequest(params: FreeSwitchXmlParams): Promise<string> {
    try {
      console.log('📞 FreeSWITCH XML Request:', params);

      // Gestisci diversi formati di richiesta FreeSWITCH
      let sipDomain = params.domain || params.key_name;
      let user = params.user;
      
      // xml_locate invia: key_name='domain.com' key_value='user 123'
      if (params.key_value) {
        const keyVal = params.key_value.toString();
        user = keyVal.startsWith('user ') ? keyVal.replace('user ', '').trim() : keyVal.trim();
      }
      
      // section può essere un array, prendi il primo elemento
      const section = Array.isArray(params.section) ? params.section[0] : params.section;

      if (!sipDomain) {
        console.log('❌ No SIP domain provided');
        return this.generateNotFoundXml();
      }

      // Trova tenant dal sip_domain
      const client = await getClient();
      try {
        const tenantResult = await client.query(
          'SELECT id, slug, name, sip_domain FROM tenants WHERE sip_domain = $1 AND status = $2',
          [sipDomain, 'active']
        );

        if (tenantResult.rows.length === 0) {
          console.log(`❌ Tenant not found for SIP domain: ${sipDomain}`);
          return this.generateNotFoundXml();
        }

        const tenant = tenantResult.rows[0];
        console.log(`✅ Found tenant: ${tenant.slug} (${tenant.id})`);

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

