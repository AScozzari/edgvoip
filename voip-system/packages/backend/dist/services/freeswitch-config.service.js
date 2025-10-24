"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreeSWITCHConfigService = void 0;
// @ts-nocheck
const database_1 = require("@w3-voip/database");
// import { Tenant, Store, Extension } from '@w3-voip/shared';
const logger_1 = require("../utils/logger");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class FreeSWITCHConfigService {
    constructor() {
        this.configPath = process.env.FREESWITCH_CONFIG_PATH || '/etc/freeswitch';
        this.templatePath = path_1.default.join(__dirname, '../../../../config/freeswitch');
    }
    // Generate tenant domain configuration
    async generateTenantDomainConfig(tenant) {
        try {
            const template = await promises_1.default.readFile(path_1.default.join(this.templatePath, 'tenant-template.xml'), 'utf-8');
            const config = template
                .replace(/TENANT_ID/g, tenant.id)
                .replace(/TENANT_NAME/g, tenant.name)
                .replace(/TENANT_DOMAIN/g, tenant.domain)
                .replace(/RECORDING_ENABLED/g, 'true')
                .replace(/RECORDING_CONSENT/g, 'true')
                .replace(/MAX_CONCURRENT_CALLS/g, '20')
                .replace(/ALLOWED_CODECS/g, 'PCMU,PCMA,G722,OPUS')
                .replace(/TIMEZONE/g, 'Europe/Rome')
                .replace(/TENANT_PASSWORD/g, this.generateSecurePassword())
                .replace(/TENANT_VM_PASSWORD/g, this.generateSecurePassword())
                .replace(/TENANT_TOLL_ALLOW/g, 'domestic,international')
                .replace(/TENANT_MAIN_NUMBER/g, tenant.main_number || '')
                .replace(/TENANT_RECORDING_TEMPLATE/g, `tenant_${tenant.id}_%Y%m%d_%H%M%S`)
                .replace(/TENANT_IP_RANGE/g, tenant.allowed_ip_range || '0.0.0.0/0')
                .replace(/TENANT_TRUNK/g, `trunk_${tenant.id}`);
            const domainConfigPath = path_1.default.join(this.configPath, 'domain', `${tenant.domain}.xml`);
            await promises_1.default.writeFile(domainConfigPath, config);
            // Create directory structure
            await promises_1.default.mkdir(path_1.default.join(this.configPath, 'directory', tenant.domain), { recursive: true });
            await promises_1.default.mkdir(path_1.default.join(this.configPath, 'dialplan', tenant.domain), { recursive: true });
            await promises_1.default.mkdir(path_1.default.join(this.configPath, 'acl', tenant.domain), { recursive: true });
            (0, logger_1.logFreeSWITCHEvent)('tenant_config_generated', {
                tenant_id: tenant.id,
                tenant_domain: tenant.domain,
                config_path: domainConfigPath
            });
        }
        catch (error) {
            (0, logger_1.logFreeSWITCHEvent)('tenant_config_error', {
                tenant_id: tenant.id,
                error: error.message
            });
            throw error;
        }
    }
    // Generate extension configuration
    async generateExtensionConfig(extension, tenant) {
        try {
            const extensionConfig = `<?xml version="1.0" encoding="utf-8"?>
<include>
  <user id="${extension.extension_number}">
    <params>
      <param name="password" value="${extension.password}"/>
      <param name="vm-password" value="${extension.password}"/>
    </params>
    
    <variables>
      <variable name="toll_allow" value="domestic,international"/>
      <variable name="accountcode" value="${tenant.id}"/>
      <variable name="user_context" value="${tenant.domain}"/>
      <variable name="effective_caller_id_name" value="${extension.caller_id_name || extension.extension_number}"/>
      <variable name="effective_caller_id_number" value="${extension.caller_id_number || extension.extension_number}"/>
      <variable name="outbound_caller_id_name" value="${extension.caller_id_name || extension.extension_number}"/>
      <variable name="outbound_caller_id_number" value="${extension.caller_id_number || extension.extension_number}"/>
      <variable name="callgroup" value="${tenant.id}"/>
      <variable name="user_record" value="${extension.recording_enabled ? 'true' : 'false'}"/>
      <variable name="record_stereo" value="true"/>
      <variable name="record_sample_rate" value="8000"/>
      <variable name="record_channels" value="2"/>
      <variable name="record_template" value="tenant_${tenant.id}_ext_${extension.extension_number}_%Y%m%d_%H%M%S"/>
    </variables>
  </user>
</include>`;
            const extensionConfigPath = path_1.default.join(this.configPath, 'directory', tenant.domain, `${extension.extension_number}.xml`);
            await promises_1.default.writeFile(extensionConfigPath, extensionConfig);
            (0, logger_1.logFreeSWITCHEvent)('extension_config_generated', {
                tenant_id: tenant.id,
                extension_id: extension.id,
                extension_number: extension.extension_number,
                config_path: extensionConfigPath
            });
        }
        catch (error) {
            (0, logger_1.logFreeSWITCHEvent)('extension_config_error', {
                tenant_id: tenant.id,
                extension_id: extension.id,
                error: error.message
            });
            throw error;
        }
    }
    // Generate trunk configuration
    async generateTrunkConfig(trunk, tenant) {
        try {
            const trunkConfig = `<?xml version="1.0" encoding="utf-8"?>
<include>
  <gateway name="trunk_${tenant.id}">
    <param name="username" value="${trunk.username}"/>
    <param name="realm" value="${trunk.from_domain}"/>
    <param name="password" value="${trunk.password}"/>
    <param name="register" value="${trunk.register_string}"/>
    <param name="caller-id-in-from" value="true"/>
    <param name="supress-cng" value="true"/>
    <param name="extension" value="${trunk.username}"/>
    <param name="proxy" value="${trunk.outbound_proxy}"/>
    <param name="register-proxy" value="${trunk.outbound_proxy}"/>
    <param name="outbound-proxy" value="${trunk.outbound_proxy}"/>
    <param name="expire-seconds" value="600"/>
    <param name="register-transport" value="udp"/>
    <param name="contact-params" value="t=${tenant.id}"/>
    <param name="ping" value="25"/>
    <param name="context" value="${tenant.domain}"/>
    <param name="codec-prefs" value="PCMU,PCMA,G722,OPUS"/>
    <param name="absolute-codec-string" value="PCMU,PCMA"/>
    <param name="enable" value="${trunk.enabled ? 'true' : 'false'}"/>
  </gateway>
</include>`;
            const trunkConfigPath = path_1.default.join(this.configPath, 'sip_profiles', 'external', `trunk_${tenant.id}.xml`);
            await promises_1.default.writeFile(trunkConfigPath, trunkConfig);
            (0, logger_1.logFreeSWITCHEvent)('trunk_config_generated', {
                tenant_id: tenant.id,
                trunk_id: trunk.id,
                trunk_name: trunk.name,
                config_path: trunkConfigPath
            });
        }
        catch (error) {
            (0, logger_1.logFreeSWITCHEvent)('trunk_config_error', {
                tenant_id: tenant.id,
                trunk_id: trunk.id,
                error: error.message
            });
            throw error;
        }
    }
    // Reload FreeSWITCH configuration
    async reloadFreeSWITCHConfig() {
        try {
            // This would typically use FreeSWITCH Event Socket Library
            // For now, we'll just log the reload request
            (0, logger_1.logFreeSWITCHEvent)('config_reload_requested', {
                timestamp: new Date().toISOString()
            });
            // In a real implementation, you would:
            // 1. Connect to FreeSWITCH ESL
            // 2. Send reloadxml command
            // 3. Send reloadacl command
            // 4. Send reload command for specific modules
        }
        catch (error) {
            (0, logger_1.logFreeSWITCHEvent)('config_reload_error', {
                error: error.message
            });
            throw error;
        }
    }
    // Delete tenant configuration
    async deleteTenantConfig(tenant) {
        try {
            const domainConfigPath = path_1.default.join(this.configPath, 'domain', `${tenant.domain}.xml`);
            const directoryPath = path_1.default.join(this.configPath, 'directory', tenant.domain);
            const dialplanPath = path_1.default.join(this.configPath, 'dialplan', tenant.domain);
            const aclPath = path_1.default.join(this.configPath, 'acl', tenant.domain);
            const trunkConfigPath = path_1.default.join(this.configPath, 'sip_profiles', 'external', `trunk_${tenant.id}.xml`);
            // Remove configuration files
            await promises_1.default.unlink(domainConfigPath).catch(() => { });
            await promises_1.default.rmdir(directoryPath, { recursive: true }).catch(() => { });
            await promises_1.default.rmdir(dialplanPath, { recursive: true }).catch(() => { });
            await promises_1.default.rmdir(aclPath, { recursive: true }).catch(() => { });
            await promises_1.default.unlink(trunkConfigPath).catch(() => { });
            (0, logger_1.logFreeSWITCHEvent)('tenant_config_deleted', {
                tenant_id: tenant.id,
                tenant_domain: tenant.domain
            });
        }
        catch (error) {
            (0, logger_1.logFreeSWITCHEvent)('tenant_config_delete_error', {
                tenant_id: tenant.id,
                error: error.message
            });
            throw error;
        }
    }
    // Generate secure password
    generateSecurePassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
    // Sync all tenant configurations
    async syncAllTenantConfigs() {
        try {
            const client = await (0, database_1.getClient)();
            try {
                // Get all tenants
                const tenantsResult = await client.query('SELECT * FROM tenants');
                const tenants = tenantsResult.rows;
                for (const tenant of tenants) {
                    // Generate domain configuration
                    await this.generateTenantDomainConfig(tenant);
                    // Get tenant extensions
                    const extensionsResult = await client.query('SELECT * FROM extensions WHERE tenant_id = $1', [tenant.id]);
                    const extensions = extensionsResult.rows;
                    // Generate extension configurations
                    for (const extension of extensions) {
                        await this.generateExtensionConfig(extension, tenant);
                    }
                    // Get tenant trunks
                    const trunksResult = await client.query('SELECT * FROM trunks WHERE tenant_id = $1', [tenant.id]);
                    const trunks = trunksResult.rows;
                    // Generate trunk configurations
                    for (const trunk of trunks) {
                        await this.generateTrunkConfig(trunk, tenant);
                    }
                }
                // Reload FreeSWITCH configuration
                await this.reloadFreeSWITCHConfig();
                (0, logger_1.logFreeSWITCHEvent)('all_configs_synced', {
                    tenant_count: tenants.length,
                    timestamp: new Date().toISOString()
                });
            }
            finally {
                await client.release();
            }
        }
        catch (error) {
            (0, logger_1.logFreeSWITCHEvent)('config_sync_error', {
                error: error.message
            });
            throw error;
        }
    }
}
exports.FreeSWITCHConfigService = FreeSWITCHConfigService;
//# sourceMappingURL=freeswitch-config.service.js.map