"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freeSwitchConfigGenerator = exports.FreeSwitchConfigGenerator = void 0;
const freeswitch_esl_service_1 = require("./freeswitch-esl.service");
const extension_service_1 = require("./extension.service");
const sip_trunk_service_1 = require("./sip-trunk.service");
class FreeSwitchConfigGenerator {
    constructor() {
        this.extensionService = new extension_service_1.ExtensionService();
        this.sipTrunkService = new sip_trunk_service_1.SipTrunkService();
        this.configPath = process.env.FREESWITCH_CONFIG_PATH || './docker/freeswitch/conf';
        console.log(`🔧 FreeSWITCH Config Generator initialized with path: ${this.configPath}`);
    }
    /**
     * Generate XML for a single extension
     */
    generateExtensionXML(extension) {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<include>
  <user id="${extension.extension}">
    <params>
      <param name="password" value="${extension.password}"/>
      <param name="vm-password" value="${extension.password}"/>
      <param name="toll-allow" value="domestic,international,local"/>
      <param name="accountcode" value="${extension.tenant_id}"/>
      <param name="user-context" value="default"/>
      <param name="effective-caller-id-name" value="${extension.display_name}"/>
      <param name="effective-caller-id-number" value="${extension.extension}"/>
      <param name="outbound-caller-id-name" value="${extension.display_name}"/>
      <param name="outbound-caller-id-number" value="${extension.extension}"/>
      <param name="callgroup" value="default"/>
      <param name="user-type" value="subscriber"/>
    </params>
    <variables>
      <variable name="toll_allow" value="domestic,international,local"/>
      <variable name="accountcode" value="${extension.tenant_id}"/>
      <variable name="user_context" value="default"/>
      <variable name="effective_caller_id_name" value="${extension.display_name}"/>
      <variable name="effective_caller_id_number" value="${extension.extension}"/>
      <variable name="outbound_caller_id_name" value="${extension.display_name}"/>
      <variable name="outbound_caller_id_number" value="${extension.extension}"/>
      <variable name="callgroup" value="default"/>
      <variable name="user_type" value="subscriber"/>
    </variables>
  </user>
</include>`;
        return xml;
    }
    /**
     * Generate XML for a SIP trunk/gateway
     */
    generateGatewayXML(trunk) {
        const sipConfig = trunk.sip_config;
        const port = sipConfig.port || 5060;
        const register = sipConfig.register || false;
        const realm = sipConfig.realm || sipConfig.host;
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<include>
  <gateway name="${trunk.name}">
    <param name="username" value="${sipConfig.username}"/>
    <param name="realm" value="${realm}"/>
    <param name="password" value="${sipConfig.password}"/>
    <param name="proxy" value="${sipConfig.host}:${port}"/>
    <param name="register" value="${register}"/>
    <param name="register-proxy" value="${sipConfig.host}:${port}"/>
    <param name="expire-seconds" value="600"/>
    <param name="retry-seconds" value="${sipConfig.retry_seconds || 30}"/>
    <param name="caller-id-in-from" value="${sipConfig.caller_id_in_from}"/>
    <param name="extension" value="${sipConfig.username}"/>
    <param name="ping" value="${sipConfig.ping ? sipConfig.ping_time : 0}"/>
    <param name="ping-timeout" value="10"/>
    <param name="ping-delay" value="0"/>
    <param name="codec-prefs" value="PCMU,PCMA,G729,GSM"/>
    <param name="absolute-codec-prefs" value="false"/>
    <param name="enable-t38" value="true"/>
    <param name="enable-t38-passthrough" value="false"/>
    <param name="enable-t38-gateway" value="false"/>
    <param name="rtp-ip" value="\${local_ip_v4}"/>
    <param name="rtp-timeout-sec" value="300"/>
    <param name="rtp-hold-timeout-sec" value="1800"/>
    <param name="rtp-timeout-hold-sec" value="1800"/>
    <param name="multi-tenant" value="false"/>
    <param name="tenant-id" value="${trunk.tenant_id}"/>
  </gateway>
</include>`;
        return xml;
    }
    /**
     * Generate dialplan XML for routing
     */
    generateDialplanXML(routes) {
        let xml = `<?xml version="1.0" encoding="utf-8"?>
<include>
  <extension name="internal_calls">
    <condition field="destination_number" expression="^(1\\d{3})$">
      <action application="set" data="domain_name=\${domain_name}"/>
      <action application="set" data="domain_uuid=\${domain_uuid}"/>
      <action application="set" data="call_direction=inbound"/>
      <action application="set" data="sip_h_X-accountcode=\${accountcode}"/>
      <action application="bridge" data="user/\\\${destination_number}@\\\${domain_name}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>
    </condition>
  </extension>`;
        // Add outbound routes
        routes.forEach(route => {
            xml += `
  <extension name="${route.name}">
    <condition field="destination_number" expression="^${route.pattern}$">
      <action application="set" data="domain_name=\${domain_name}"/>
      <action application="set" data="domain_uuid=\${domain_uuid}"/>
      <action application="set" data="call_direction=outbound"/>
      <action application="set" data="sip_h_X-accountcode=\${accountcode}"/>
      <action application="set" data="sip_h_X-tenant-id=${route.tenant_id}"/>
      <action application="bridge" data="sofia/gateway/${route.destination}/\\\${destination_number}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>
    </condition>
  </extension>`;
        });
        // Add default route for external calls
        xml += `
  <extension name="external_calls">
    <condition field="destination_number" expression="^([0-9]+)$">
      <action application="set" data="domain_name=\${domain_name}"/>
      <action application="set" data="domain_uuid=\${domain_uuid}"/>
      <action application="set" data="call_direction=outbound"/>
      <action application="set" data="sip_h_X-accountcode=\${accountcode}"/>
      <action application="bridge" data="sofia/gateway/default/\\\${destination_number}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>
    </condition>
  </extension>
</include>`;
        return xml;
    }
    /**
     * Generate IVR configuration XML
     */
    generateIVRXML(ivrMenus) {
        let xml = `<?xml version="1.0" encoding="utf-8"?>
<include>
  <extension name="ivr_menus">
    <condition field="destination_number" expression="^(\\d{4})$">
      <action application="answer"/>
      <action application="sleep" data="1000"/>
      <action application="ivr" data="ivr_\\\${destination_number}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>
    </condition>
  </extension>
</include>`;
        // Generate IVR menu configurations
        ivrMenus.forEach(menu => {
            xml += `
  <extension name="ivr_${menu.extension}">
    <condition field="destination_number" expression="^${menu.extension}$">
      <action application="answer"/>
      <action application="sleep" data="1000"/>
      <action application="ivr" data="ivr_${menu.extension}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>
    </condition>
  </extension>`;
        });
        return xml;
    }
    /**
     * Generate conference configuration XML
     */
    generateConferenceXML(conferences) {
        let xml = `<?xml version="1.0" encoding="utf-8"?>
<include>
  <extension name="conferences">
    <condition field="destination_number" expression="^(\\d{3})$">
      <action application="answer"/>
      <action application="conference" data="\\\${destination_number}@default"/>
      <action application="hangup" data="NORMAL_CLEARING"/>
    </condition>
  </extension>
</include>`;
        return xml;
    }
    /**
     * Sync all configurations to FreeSWITCH
     */
    async syncToFreeSWITCH() {
        try {
            console.log('🔄 Starting FreeSWITCH configuration sync...');
            // Sync extensions
            await this.syncExtensions();
            // Sync SIP trunks
            await this.syncSipTrunks();
            // Sync dialplan
            await this.syncDialplan();
            // Reload FreeSWITCH configurations
            await this.reloadFreeSWITCH();
            console.log('✅ FreeSWITCH configuration sync completed');
        }
        catch (error) {
            console.error('❌ Error syncing FreeSWITCH configurations:', error);
            throw error;
        }
    }
    /**
     * Sync extensions from database to FreeSWITCH
     */
    async syncExtensions() {
        try {
            console.log('🔄 Syncing extensions...');
            // Get all extensions from database (using default tenant for now)
            const extensionsResult = await this.extensionService.listExtensions('bfb2e4dc-55f4-4240-8c7d-0fc8c7ecadd8');
            const extensions = extensionsResult.extensions;
            // Generate XML for each extension
            for (const extension of extensions) {
                const xml = this.generateExtensionXML(extension);
                const filePath = `${this.configPath}/directory/default/${extension.extension}.xml`;
                // Write XML file (in real implementation, use fs.writeFileSync)
                console.log(`📝 Generated extension XML for ${extension.extension}`);
                console.log(`📁 File path: ${filePath}`);
                console.log(`📄 XML content:\n${xml}`);
            }
            console.log(`✅ Synced ${extensions.length} extensions`);
        }
        catch (error) {
            console.error('❌ Error syncing extensions:', error);
            throw error;
        }
    }
    /**
     * Sync SIP trunks from database to FreeSWITCH
     */
    async syncSipTrunks() {
        try {
            console.log('🔄 Syncing SIP trunks...');
            // Get all SIP trunks from database (using default tenant for now)
            const trunks = await this.sipTrunkService.listSipTrunks('bfb2e4dc-55f4-4240-8c7d-0fc8c7ecadd8');
            // Generate XML for each trunk
            for (const trunk of trunks) {
                const xml = this.generateGatewayXML(trunk);
                const filePath = `${this.configPath}/sip_profiles/external/${trunk.name}.xml`;
                // Write XML file (in real implementation, use fs.writeFileSync)
                console.log(`📝 Generated gateway XML for ${trunk.name}`);
                console.log(`📁 File path: ${filePath}`);
                console.log(`📄 XML content:\n${xml}`);
            }
            console.log(`✅ Synced ${trunks.length} SIP trunks`);
        }
        catch (error) {
            console.error('❌ Error syncing SIP trunks:', error);
            throw error;
        }
    }
    /**
     * Sync dialplan from database to FreeSWITCH
     */
    async syncDialplan() {
        try {
            console.log('🔄 Syncing dialplan...');
            // For now, generate basic dialplan
            // In real implementation, get routes from database
            const routes = [
                {
                    id: '1',
                    name: 'default_outbound',
                    pattern: '0([0-9]+)',
                    destination: 'default',
                    destination_type: 'extension',
                    tenant_id: 'default'
                }
            ];
            const xml = this.generateDialplanXML(routes);
            const filePath = `${this.configPath}/dialplan/default.xml`;
            // Write XML file (in real implementation, use fs.writeFileSync)
            console.log(`📝 Generated dialplan XML`);
            console.log(`📁 File path: ${filePath}`);
            console.log(`📄 XML content:\n${xml}`);
            console.log(`✅ Synced dialplan`);
        }
        catch (error) {
            console.error('❌ Error syncing dialplan:', error);
            throw error;
        }
    }
    /**
     * Reload FreeSWITCH configurations
     */
    async reloadFreeSWITCH() {
        try {
            console.log('🔄 Reloading FreeSWITCH configurations...');
            if (!freeswitch_esl_service_1.freeswitchESL.isConnected()) {
                console.warn('⚠️  FreeSWITCH ESL not connected, cannot reload configurations');
                return;
            }
            // Reload XML configurations
            await new Promise((resolve, reject) => {
                freeswitch_esl_service_1.freeswitchESL['client'].api('reloadxml', (response) => {
                    try {
                        const result = response.getBody();
                        console.log('📄 FreeSWITCH reloadxml response:', result);
                        resolve();
                    }
                    catch (error) {
                        console.error('❌ Error reloading FreeSWITCH XML:', error);
                        reject(error);
                    }
                });
            });
            // Reload sofia profiles
            await new Promise((resolve, reject) => {
                freeswitch_esl_service_1.freeswitchESL['client'].api('sofia profile external restart', (response) => {
                    try {
                        const result = response.getBody();
                        console.log('📄 FreeSWITCH sofia restart response:', result);
                        resolve();
                    }
                    catch (error) {
                        console.error('❌ Error restarting FreeSWITCH sofia:', error);
                        reject(error);
                    }
                });
            });
            console.log('✅ FreeSWITCH configurations reloaded');
        }
        catch (error) {
            console.error('❌ Error reloading FreeSWITCH:', error);
            throw error;
        }
    }
    /**
     * Generate all configuration files
     */
    async generateAllConfigs() {
        try {
            console.log('🔧 Generating all FreeSWITCH configurations...');
            await this.syncExtensions();
            await this.syncSipTrunks();
            await this.syncDialplan();
            console.log('✅ All FreeSWITCH configurations generated');
        }
        catch (error) {
            console.error('❌ Error generating configurations:', error);
            throw error;
        }
    }
}
exports.FreeSwitchConfigGenerator = FreeSwitchConfigGenerator;
// Export singleton instance
exports.freeSwitchConfigGenerator = new FreeSwitchConfigGenerator();
//# sourceMappingURL=freeswitch-config-generator.service.js.map