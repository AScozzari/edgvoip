import { TenantService, Tenant } from './tenant.service';
import { FreeSWITCHConfigService } from './freeswitch-config.service';
import { ESLService } from './esl.service';
import { logFreeSWITCHEvent } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

export class FreeSWITCHDeployService {
  private tenantService: TenantService;
  private freeswitchConfigService: FreeSWITCHConfigService;
  private eslService: ESLService;
  private configBasePath: string;

  constructor() {
    this.tenantService = new TenantService();
    this.freeswitchConfigService = new FreeSWITCHConfigService();
    this.eslService = new ESLService();
    this.configBasePath = process.env.FREESWITCH_CONFIG_PATH || '/usr/local/freeswitch/conf';
  }

  /**
   * Deploy complete tenant configuration to FreeSWITCH
   */
  async deployTenantConfig(tenantId: string): Promise<{ success: boolean; message: string }> {
    try {
      logFreeSWITCHEvent('deploy_tenant_start', { tenant_id: tenantId });

      // 1. Get tenant data
      const tenant = await this.tenantService.getTenantById(tenantId);
      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      // 2. Generate XML configurations
      const contextsXML = await this.freeswitchConfigService.generateTenantContexts(tenant);
      const extensionsXML = await this.freeswitchConfigService.generateExtensionsXML(tenant);
      const trunksXML = await this.freeswitchConfigService.generateTrunksXML(tenant);

      // 3. Write configuration files
      await this.writeConfigFiles(tenant, contextsXML, extensionsXML, trunksXML);

      // 4. Reload FreeSWITCH
      await this.reloadFreeSWITCH();

      // 5. Verify deployment
      const verificationResult = await this.verifyDeployment(tenant);

      logFreeSWITCHEvent('deploy_tenant_success', {
        tenant_id: tenantId,
        tenant_slug: tenant.slug,
        verification: verificationResult,
      });

      return {
        success: true,
        message: `Tenant ${tenant.name} configuration deployed successfully`,
      };
    } catch (error: any) {
      logFreeSWITCHEvent('deploy_tenant_error', {
        tenant_id: tenantId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Deploy single extension configuration
   */
  async deployExtension(extensionId: string): Promise<{ success: boolean; message: string }> {
    try {
      logFreeSWITCHEvent('deploy_extension_start', { extension_id: extensionId });

      // Get extension with tenant data
      const extension = await this.getExtensionWithTenant(extensionId);

      // Generate extension XML
      const extensionXML = await this.freeswitchConfigService.generateExtensionXML(
        extension,
        extension.tenant
      );

      // Write extension file
      const extensionFilePath = path.join(
        this.configBasePath,
        'directory',
        extension.tenant.sip_domain,
        `${extension.extension}.xml`
      );

      await fs.mkdir(path.dirname(extensionFilePath), { recursive: true });
      await fs.writeFile(extensionFilePath, extensionXML);

      // Reload
      await this.reloadFreeSWITCH();

      logFreeSWITCHEvent('deploy_extension_success', {
        extension_id: extensionId,
        extension_number: extension.extension,
      });

      return {
        success: true,
        message: `Extension ${extension.extension} deployed successfully`,
      };
    } catch (error: any) {
      logFreeSWITCHEvent('deploy_extension_error', {
        extension_id: extensionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Deploy single trunk configuration
   */
  async deployTrunk(trunkId: string): Promise<{ success: boolean; message: string }> {
    try {
      logFreeSWITCHEvent('deploy_trunk_start', { trunk_id: trunkId });

      // Get trunk with tenant data
      const trunk = await this.getTrunkWithTenant(trunkId);

      // Generate trunk gateway XML
      const trunkXML = await this.freeswitchConfigService.generateTrunkGatewayXML(
        trunk,
        trunk.tenant
      );

      // Write trunk file
      const trunkFilePath = path.join(
        this.configBasePath,
        'sip_profiles',
        'external',
        `${trunk.name.toLowerCase().replace(/\s+/g, '_')}_${trunk.tenant.slug}.xml`
      );

      await fs.mkdir(path.dirname(trunkFilePath), { recursive: true });
      await fs.writeFile(trunkFilePath, trunkXML);

      // Reload Sofia profile
      await this.eslService.sendCommand('sofia profile external rescan');

      logFreeSWITCHEvent('deploy_trunk_success', {
        trunk_id: trunkId,
        trunk_name: trunk.name,
      });

      return {
        success: true,
        message: `Trunk ${trunk.name} deployed successfully`,
      };
    } catch (error: any) {
      logFreeSWITCHEvent('deploy_trunk_error', {
        trunk_id: trunkId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Write all configuration files for a tenant
   */
  private async writeConfigFiles(
    tenant: any,
    contextsXML: string,
    extensionsXML: string[],
    trunksXML: string[]
  ): Promise<void> {
    // Write dialplan contexts
    const dialplanPath = path.join(this.configBasePath, 'dialplan', `tenant-${tenant.slug}-contexts.xml`);
    await fs.mkdir(path.dirname(dialplanPath), { recursive: true });
    await fs.writeFile(dialplanPath, contextsXML);

    // Write extensions directory
    const directoryPath = path.join(this.configBasePath, 'directory', tenant.sip_domain);
    await fs.mkdir(directoryPath, { recursive: true });

    for (const extensionXML of extensionsXML) {
      // Extract extension number from XML (simple parsing)
      const match = extensionXML.match(/id="(\d+)"/);
      if (match) {
        const extensionNumber = match[1];
        await fs.writeFile(path.join(directoryPath, `${extensionNumber}.xml`), extensionXML);
      }
    }

    // Write trunk gateways
    const gatewaysPath = path.join(this.configBasePath, 'sip_profiles', 'external');
    await fs.mkdir(gatewaysPath, { recursive: true });

    for (const trunkXML of trunksXML) {
      // Extract trunk name from XML
      const match = trunkXML.match(/name="([^"]+)"/);
      if (match) {
        const trunkName = match[1].toLowerCase().replace(/\s+/g, '_');
        await fs.writeFile(path.join(gatewaysPath, `${trunkName}_${tenant.slug}.xml`), trunkXML);
      }
    }
  }

  /**
   * Reload FreeSWITCH configuration
   */
  async reloadFreeSWITCH(): Promise<void> {
    try {
      // Reload XML
      await this.eslService.sendCommand('reloadxml');
      
      // Reload ACL
      await this.eslService.sendCommand('reloadacl');
      
      // Rescan Sofia profiles
      await this.eslService.sendCommand('sofia profile internal rescan');
      await this.eslService.sendCommand('sofia profile external rescan');

      logFreeSWITCHEvent('freeswitch_reload_success', {});
    } catch (error: any) {
      logFreeSWITCHEvent('freeswitch_reload_error', { error: error.message });
      throw new Error(`Failed to reload FreeSWITCH: ${error.message}`);
    }
  }

  /**
   * Verify deployment by checking registrations
   */
  private async verifyDeployment(tenant: any): Promise<any> {
    try {
      // Check if Sofia profile recognizes the domain
      const statusOutput = await this.eslService.sendCommand(`sofia status profile internal`);

      return {
        domain_loaded: statusOutput.includes(tenant.sip_domain),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        domain_loaded: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create backup of current configuration
   */
  async createConfigBackup(tenantId: string): Promise<string> {
    const tenant = await this.tenantService.getTenantById(tenantId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.configBasePath, 'backups', tenant.slug, timestamp);

    await fs.mkdir(backupDir, { recursive: true });

    // Backup dialplan
    const dialplanSource = path.join(this.configBasePath, 'dialplan', `tenant-${tenant.slug}-contexts.xml`);
    const dialplanDest = path.join(backupDir, 'dialplan.xml');
    try {
      await fs.copyFile(dialplanSource, dialplanDest);
    } catch (error) {
      // File might not exist yet
    }

    // Backup directory
    const directorySource = path.join(this.configBasePath, 'directory', tenant.sip_domain);
    const directoryDest = path.join(backupDir, 'directory');
    try {
      await fs.cp(directorySource, directoryDest, { recursive: true });
    } catch (error) {
      // Directory might not exist yet
    }

    logFreeSWITCHEvent('config_backup_created', {
      tenant_id: tenantId,
      backup_path: backupDir,
    });

    return backupDir;
  }

  /**
   * Rollback to a previous backup
   */
  async rollbackConfig(tenantId: string, backupPath: string): Promise<void> {
    const tenant = await this.tenantService.getTenantById(tenantId);

    // Restore dialplan
    const dialplanBackup = path.join(backupPath, 'dialplan.xml');
    const dialplanDest = path.join(this.configBasePath, 'dialplan', `tenant-${tenant.slug}-contexts.xml`);
    await fs.copyFile(dialplanBackup, dialplanDest);

    // Restore directory
    const directoryBackup = path.join(backupPath, 'directory');
    const directoryDest = path.join(this.configBasePath, 'directory', tenant.sip_domain);
    await fs.rm(directoryDest, { recursive: true, force: true });
    await fs.cp(directoryBackup, directoryDest, { recursive: true });

    // Reload
    await this.reloadFreeSWITCH();

    logFreeSWITCHEvent('config_rollback_success', {
      tenant_id: tenantId,
      backup_path: backupPath,
    });
  }

  // Helper methods to get data with tenant
  private async getExtensionWithTenant(extensionId: string): Promise<any> {
    // This would be implemented in extension service
    // For now, placeholder
    throw new Error('Not implemented');
  }

  private async getTrunkWithTenant(trunkId: string): Promise<any> {
    // This would be implemented in trunk service
    // For now, placeholder
    throw new Error('Not implemented');
  }
}

