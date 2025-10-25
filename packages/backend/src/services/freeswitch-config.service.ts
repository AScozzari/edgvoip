// @ts-nocheck
import { getClient } from '@w3-voip/database';
// import { Tenant, Store, Extension } from '@w3-voip/shared';
import { logFreeSWITCHEvent } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

// Define types locally
export interface Tenant {
  id: string;
  name: string;
  domain: string;
  sip_domain: string;
  status: 'active' | 'suspended' | 'pending';
}

export interface Store {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  phone: string;
  status: 'active' | 'inactive';
}

export interface Extension {
  id: string;
  tenant_id: string;
  store_id?: string;
  extension: string;
  password: string;
  display_name: string;
  status: 'active' | 'inactive';
  type: 'user' | 'queue' | 'conference';
}

export class FreeSWITCHConfigService {
  private configPath: string;
  private templatePath: string;

  constructor() {
    this.configPath = process.env.FREESWITCH_CONFIG_PATH || '/etc/freeswitch';
    this.templatePath = path.join(__dirname, '../../../../config/freeswitch');
  }

  // Generate tenant domain configuration
  async generateTenantDomainConfig(tenant: Tenant): Promise<void> {
    try {
      const template = await fs.readFile(
        path.join(this.templatePath, 'tenant-template.xml'),
        'utf-8'
      );

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

      const domainConfigPath = path.join(this.configPath, 'domain', `${tenant.domain}.xml`);
      await fs.writeFile(domainConfigPath, config);

      // Create directory structure
      await fs.mkdir(path.join(this.configPath, 'directory', tenant.domain), { recursive: true });
      await fs.mkdir(path.join(this.configPath, 'dialplan', tenant.domain), { recursive: true });
      await fs.mkdir(path.join(this.configPath, 'acl', tenant.domain), { recursive: true });

      logFreeSWITCHEvent('tenant_config_generated', {
        tenant_id: tenant.id,
        tenant_domain: tenant.domain,
        config_path: domainConfigPath
      });

    } catch (error) {
      logFreeSWITCHEvent('tenant_config_error', {
        tenant_id: tenant.id,
        error: error.message
      });
      throw error;
    }
  }

  // Generate extension configuration
  async generateExtensionConfig(extension: Extension, tenant: Tenant): Promise<void> {
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

      const extensionConfigPath = path.join(
        this.configPath,
        'directory',
        tenant.domain,
        `${extension.extension_number}.xml`
      );

      await fs.writeFile(extensionConfigPath, extensionConfig);

      logFreeSWITCHEvent('extension_config_generated', {
        tenant_id: tenant.id,
        extension_id: extension.id,
        extension_number: extension.extension_number,
        config_path: extensionConfigPath
      });

    } catch (error) {
      logFreeSWITCHEvent('extension_config_error', {
        tenant_id: tenant.id,
        extension_id: extension.id,
        error: error.message
      });
      throw error;
    }
  }

  // Generate trunk configuration
  async generateTrunkConfig(trunk: any, tenant: Tenant): Promise<void> {
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

      const trunkConfigPath = path.join(
        this.configPath,
        'sip_profiles',
        'external',
        `trunk_${tenant.id}.xml`
      );

      await fs.writeFile(trunkConfigPath, trunkConfig);

      logFreeSWITCHEvent('trunk_config_generated', {
        tenant_id: tenant.id,
        trunk_id: trunk.id,
        trunk_name: trunk.name,
        config_path: trunkConfigPath
      });

    } catch (error) {
      logFreeSWITCHEvent('trunk_config_error', {
        tenant_id: tenant.id,
        trunk_id: trunk.id,
        error: error.message
      });
      throw error;
    }
  }

  // Reload FreeSWITCH configuration
  async reloadFreeSWITCHConfig(): Promise<void> {
    try {
      // This would typically use FreeSWITCH Event Socket Library
      // For now, we'll just log the reload request
      logFreeSWITCHEvent('config_reload_requested', {
        timestamp: new Date().toISOString()
      });

      // In a real implementation, you would:
      // 1. Connect to FreeSWITCH ESL
      // 2. Send reloadxml command
      // 3. Send reloadacl command
      // 4. Send reload command for specific modules

    } catch (error) {
      logFreeSWITCHEvent('config_reload_error', {
        error: error.message
      });
      throw error;
    }
  }

  // Delete tenant configuration
  async deleteTenantConfig(tenant: Tenant): Promise<void> {
    try {
      const domainConfigPath = path.join(this.configPath, 'domain', `${tenant.domain}.xml`);
      const directoryPath = path.join(this.configPath, 'directory', tenant.domain);
      const dialplanPath = path.join(this.configPath, 'dialplan', tenant.domain);
      const aclPath = path.join(this.configPath, 'acl', tenant.domain);
      const trunkConfigPath = path.join(this.configPath, 'sip_profiles', 'external', `trunk_${tenant.id}.xml`);

      // Remove configuration files
      await fs.unlink(domainConfigPath).catch(() => {});
      await fs.rmdir(directoryPath, { recursive: true }).catch(() => {});
      await fs.rmdir(dialplanPath, { recursive: true }).catch(() => {});
      await fs.rmdir(aclPath, { recursive: true }).catch(() => {});
      await fs.unlink(trunkConfigPath).catch(() => {});

      logFreeSWITCHEvent('tenant_config_deleted', {
        tenant_id: tenant.id,
        tenant_domain: tenant.domain
      });

    } catch (error) {
      logFreeSWITCHEvent('tenant_config_delete_error', {
        tenant_id: tenant.id,
        error: error.message
      });
      throw error;
    }
  }

  // Generate secure password
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Sync all tenant configurations
  async syncAllTenantConfigs(): Promise<void> {
    try {
      const client = await getClient();
      
      try {
        // Get all tenants
        const tenantsResult = await client.query('SELECT * FROM tenants');
        const tenants = tenantsResult.rows;

        for (const tenant of tenants) {
          // Generate domain configuration
          await this.generateTenantDomainConfig(tenant);

          // Get tenant extensions
          const extensionsResult = await client.query(
            'SELECT * FROM extensions WHERE tenant_id = $1',
            [tenant.id]
          );
          const extensions = extensionsResult.rows;

          // Generate extension configurations
          for (const extension of extensions) {
            await this.generateExtensionConfig(extension, tenant);
          }

          // Get tenant trunks
          const trunksResult = await client.query(
            'SELECT * FROM trunks WHERE tenant_id = $1',
            [tenant.id]
          );
          const trunks = trunksResult.rows;

          // Generate trunk configurations
          for (const trunk of trunks) {
            await this.generateTrunkConfig(trunk, tenant);
          }
        }

        // Reload FreeSWITCH configuration
        await this.reloadFreeSWITCHConfig();

        logFreeSWITCHEvent('all_configs_synced', {
          tenant_count: tenants.length,
          timestamp: new Date().toISOString()
        });

      } finally {
        await client.release();
      }

    } catch (error) {
      logFreeSWITCHEvent('config_sync_error', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate tenant contexts XML from template
   */
  async generateTenantContexts(tenant: any): Promise<string> {
    try {
      const template = await fs.readFile(
        path.join(this.templatePath, 'tenant-contexts-template.xml'),
        'utf-8'
      );

      const contextsXML = template
        .replace(/\{\{TENANT_ID\}\}/g, tenant.id)
        .replace(/\{\{SLUG\}\}/g, tenant.slug || tenant.domain)
        .replace(/\{\{SIP_DOMAIN\}\}/g, tenant.sip_domain)
        .replace(/\{\{CONTEXT_PREFIX\}\}/g, tenant.context_prefix || `tenant-${tenant.slug}`);

      return contextsXML;
    } catch (error: any) {
      logFreeSWITCHEvent('context_generation_error', {
        tenant_id: tenant.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate all extensions XML for a tenant
   */
  async generateExtensionsXML(tenant: any): Promise<string[]> {
    const client = await getClient();
    
    try {
      // Get all extensions for tenant
      const result = await client.query(
        'SELECT * FROM extensions WHERE tenant_id = $1 AND status = $2',
        [tenant.id, 'active']
      );

      const extensionsXML: string[] = [];

      for (const extension of result.rows) {
        const xml = await this.generateExtensionXML(extension, tenant);
        extensionsXML.push(xml);
      }

      return extensionsXML;
    } finally {
      await client.release();
    }
  }

  /**
   * Generate single extension XML from template
   */
  async generateExtensionXML(extension: any, tenant: any): Promise<string> {
    try {
      const template = await fs.readFile(
        path.join(this.templatePath, 'extension-template.xml'),
        'utf-8'
      );

      const settings = extension.settings || {};

      const extensionXML = template
        .replace(/\{\{EXTENSION\}\}/g, extension.extension)
        .replace(/\{\{PASSWORD\}\}/g, extension.password)
        .replace(/\{\{TENANT_ID\}\}/g, tenant.id)
        .replace(/\{\{SLUG\}\}/g, tenant.slug || tenant.domain)
        .replace(/\{\{SIP_DOMAIN\}\}/g, tenant.sip_domain)
        .replace(/\{\{DISPLAY_NAME\}\}/g, extension.display_name)
        .replace(/\{\{CALLER_ID_NUMBER\}\}/g, extension.caller_id_number || extension.extension)
        .replace(/\{\{CONTEXT\}\}/g, extension.context || `tenant-${tenant.slug}-internal`)
        .replace(/\{\{VM_PIN\}\}/g, extension.voicemail_pin || extension.extension)
        .replace(/\{\{VM_ENABLED\}\}/g, settings.voicemail_enabled !== false ? 'true' : 'false')
        .replace(/\{\{VM_EMAIL_ENABLED\}\}/g, settings.email_notification ? 'true' : 'false')
        .replace(/\{\{VM_EMAIL\}\}/g, settings.email || '')
        .replace(/\{\{VM_ATTACH_AUDIO\}\}/g, settings.attach_audio !== false ? 'true' : 'false')
        .replace(/\{\{VM_DELETE_AFTER_EMAIL\}\}/g, settings.delete_after_email ? 'true' : 'false')
        .replace(/\{\{CALL_FORWARD\}\}/g, settings.call_forwarding?.destination || '')
        .replace(/\{\{DND_ENABLED\}\}/g, settings.dnd_enabled ? 'true' : 'false')
        .replace(/\{\{RECORD_CALLS\}\}/g, settings.recording_enabled ? 'true' : 'false')
        .replace(/\{\{PICKUP_GROUP\}\}/g, extension.pickup_group || '')
        .replace(/\{\{LIMIT_MAX\}\}/g, String(extension.limit_max || 3))
        .replace(/\{\{CODEC_PREFS\}\}/g, settings.codec_prefs?.join(',') || 'PCMA,OPUS')
        .replace(/\{\{TIMEZONE\}\}/g, settings.timezone || tenant.timezone || 'Europe/Rome');

      return extensionXML;
    } catch (error: any) {
      logFreeSWITCHEvent('extension_xml_error', {
        extension_id: extension.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate all trunks XML for a tenant
   */
  async generateTrunksXML(tenant: any): Promise<string[]> {
    const client = await getClient();
    
    try {
      // Get all trunks for tenant
      const result = await client.query(
        'SELECT * FROM sip_trunks WHERE tenant_id = $1 AND status != $2',
        [tenant.id, 'inactive']
      );

      const trunksXML: string[] = [];

      for (const trunk of result.rows) {
        const xml = await this.generateTrunkGatewayXML(trunk, tenant);
        trunksXML.push(xml);
      }

      return trunksXML;
    } finally {
      await client.release();
    }
  }

  /**
   * Generate single trunk gateway XML from template
   */
  async generateTrunkGatewayXML(trunk: any, tenant: any): Promise<string> {
    try {
      const template = await fs.readFile(
        path.join(this.templatePath, 'gateway-template.xml'),
        'utf-8'
      );

      const sipConfig = trunk.sip_config || {};

      const gatewayXML = template
        .replace(/\{\{TRUNK_NAME\}\}/g, trunk.name.toLowerCase().replace(/\s+/g, '_'))
        .replace(/\{\{TRUNK_ID\}\}/g, trunk.id)
        .replace(/\{\{TENANT_ID\}\}/g, tenant.id)
        .replace(/\{\{SLUG\}\}/g, tenant.slug || tenant.domain)
        .replace(/\{\{CONTEXT_PREFIX\}\}/g, tenant.context_prefix || `tenant-${tenant.slug}`)
        .replace(/\{\{USERNAME\}\}/g, sipConfig.username || '')
        .replace(/\{\{PASSWORD\}\}/g, sipConfig.password || '')
        .replace(/\{\{HOST\}\}/g, sipConfig.host || '')
        .replace(/\{\{PORT\}\}/g, String(sipConfig.port || 5060))
        .replace(/\{\{REGISTER\}\}/g, sipConfig.register ? 'true' : 'false')
        .replace(/\{\{CALLER_ID_IN_FROM\}\}/g, 'true')
        .replace(/\{\{OUTBOUND_CALLER_ID\}\}/g, trunk.outbound_caller_id || '')
        .replace(/\{\{CODEC_PREFS\}\}/g, trunk.codec_prefs || 'PCMA,OPUS,G729')
        .replace(/\{\{MAX_CONCURRENT_CALLS\}\}/g, String(trunk.max_concurrent_calls || 10))
        .replace(/\{\{TRANSPORT\}\}/g, sipConfig.transport || 'udp');

      return gatewayXML;
    } catch (error: any) {
      logFreeSWITCHEvent('trunk_xml_error', {
        trunk_id: trunk.id,
        error: error.message
      });
      throw error;
    }
  }
}

