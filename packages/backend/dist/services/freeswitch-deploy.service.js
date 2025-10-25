"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreeSWITCHDeployService = void 0;
const tenant_service_1 = require("./tenant.service");
const freeswitch_config_service_1 = require("./freeswitch-config.service");
const esl_service_1 = require("./esl.service");
const logger_1 = require("../utils/logger");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class FreeSWITCHDeployService {
    constructor() {
        this.tenantService = new tenant_service_1.TenantService();
        this.freeswitchConfigService = new freeswitch_config_service_1.FreeSWITCHConfigService();
        this.eslService = new esl_service_1.ESLService();
        this.configBasePath = process.env.FREESWITCH_CONFIG_PATH || '/usr/local/freeswitch/conf';
    }
    /**
     * Deploy complete tenant configuration to FreeSWITCH
     */
    async deployTenantConfig(tenantId) {
        try {
            (0, logger_1.logFreeSWITCHEvent)('deploy_tenant_start', { tenant_id: tenantId });
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
            (0, logger_1.logFreeSWITCHEvent)('deploy_tenant_success', {
                tenant_id: tenantId,
                tenant_slug: tenant.slug,
                verification: verificationResult,
            });
            return {
                success: true,
                message: `Tenant ${tenant.name} configuration deployed successfully`,
            };
        }
        catch (error) {
            (0, logger_1.logFreeSWITCHEvent)('deploy_tenant_error', {
                tenant_id: tenantId,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Deploy single extension configuration
     */
    async deployExtension(extensionId) {
        try {
            (0, logger_1.logFreeSWITCHEvent)('deploy_extension_start', { extension_id: extensionId });
            // Get extension with tenant data
            const extension = await this.getExtensionWithTenant(extensionId);
            // Generate extension XML
            const extensionXML = await this.freeswitchConfigService.generateExtensionXML(extension, extension.tenant);
            // Write extension file
            const extensionFilePath = path_1.default.join(this.configBasePath, 'directory', extension.tenant.sip_domain, `${extension.extension}.xml`);
            await promises_1.default.mkdir(path_1.default.dirname(extensionFilePath), { recursive: true });
            await promises_1.default.writeFile(extensionFilePath, extensionXML);
            // Reload
            await this.reloadFreeSWITCH();
            (0, logger_1.logFreeSWITCHEvent)('deploy_extension_success', {
                extension_id: extensionId,
                extension_number: extension.extension,
            });
            return {
                success: true,
                message: `Extension ${extension.extension} deployed successfully`,
            };
        }
        catch (error) {
            (0, logger_1.logFreeSWITCHEvent)('deploy_extension_error', {
                extension_id: extensionId,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Deploy single trunk configuration
     */
    async deployTrunk(trunkId) {
        try {
            (0, logger_1.logFreeSWITCHEvent)('deploy_trunk_start', { trunk_id: trunkId });
            // Get trunk with tenant data
            const trunk = await this.getTrunkWithTenant(trunkId);
            // Generate trunk gateway XML
            const trunkXML = await this.freeswitchConfigService.generateTrunkGatewayXML(trunk, trunk.tenant);
            // Write trunk file
            const trunkFilePath = path_1.default.join(this.configBasePath, 'sip_profiles', 'external', `${trunk.name.toLowerCase().replace(/\s+/g, '_')}_${trunk.tenant.slug}.xml`);
            await promises_1.default.mkdir(path_1.default.dirname(trunkFilePath), { recursive: true });
            await promises_1.default.writeFile(trunkFilePath, trunkXML);
            // Reload Sofia profile
            await this.eslService.sendCommand('sofia profile external rescan');
            (0, logger_1.logFreeSWITCHEvent)('deploy_trunk_success', {
                trunk_id: trunkId,
                trunk_name: trunk.name,
            });
            return {
                success: true,
                message: `Trunk ${trunk.name} deployed successfully`,
            };
        }
        catch (error) {
            (0, logger_1.logFreeSWITCHEvent)('deploy_trunk_error', {
                trunk_id: trunkId,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Write all configuration files for a tenant
     */
    async writeConfigFiles(tenant, contextsXML, extensionsXML, trunksXML) {
        // Write dialplan contexts
        const dialplanPath = path_1.default.join(this.configBasePath, 'dialplan', `tenant-${tenant.slug}-contexts.xml`);
        await promises_1.default.mkdir(path_1.default.dirname(dialplanPath), { recursive: true });
        await promises_1.default.writeFile(dialplanPath, contextsXML);
        // Write extensions directory
        const directoryPath = path_1.default.join(this.configBasePath, 'directory', tenant.sip_domain);
        await promises_1.default.mkdir(directoryPath, { recursive: true });
        for (const extensionXML of extensionsXML) {
            // Extract extension number from XML (simple parsing)
            const match = extensionXML.match(/id="(\d+)"/);
            if (match) {
                const extensionNumber = match[1];
                await promises_1.default.writeFile(path_1.default.join(directoryPath, `${extensionNumber}.xml`), extensionXML);
            }
        }
        // Write trunk gateways
        const gatewaysPath = path_1.default.join(this.configBasePath, 'sip_profiles', 'external');
        await promises_1.default.mkdir(gatewaysPath, { recursive: true });
        for (const trunkXML of trunksXML) {
            // Extract trunk name from XML
            const match = trunkXML.match(/name="([^"]+)"/);
            if (match) {
                const trunkName = match[1].toLowerCase().replace(/\s+/g, '_');
                await promises_1.default.writeFile(path_1.default.join(gatewaysPath, `${trunkName}_${tenant.slug}.xml`), trunkXML);
            }
        }
    }
    /**
     * Reload FreeSWITCH configuration
     */
    async reloadFreeSWITCH() {
        try {
            // Reload XML
            await this.eslService.sendCommand('reloadxml');
            // Reload ACL
            await this.eslService.sendCommand('reloadacl');
            // Rescan Sofia profiles
            await this.eslService.sendCommand('sofia profile internal rescan');
            await this.eslService.sendCommand('sofia profile external rescan');
            (0, logger_1.logFreeSWITCHEvent)('freeswitch_reload_success', {});
        }
        catch (error) {
            (0, logger_1.logFreeSWITCHEvent)('freeswitch_reload_error', { error: error.message });
            throw new Error(`Failed to reload FreeSWITCH: ${error.message}`);
        }
    }
    /**
     * Verify deployment by checking registrations
     */
    async verifyDeployment(tenant) {
        try {
            // Check if Sofia profile recognizes the domain
            const statusOutput = await this.eslService.sendCommand(`sofia status profile internal`);
            return {
                domain_loaded: statusOutput.includes(tenant.sip_domain),
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                domain_loaded: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Create backup of current configuration
     */
    async createConfigBackup(tenantId) {
        const tenant = await this.tenantService.getTenantById(tenantId);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path_1.default.join(this.configBasePath, 'backups', tenant.slug, timestamp);
        await promises_1.default.mkdir(backupDir, { recursive: true });
        // Backup dialplan
        const dialplanSource = path_1.default.join(this.configBasePath, 'dialplan', `tenant-${tenant.slug}-contexts.xml`);
        const dialplanDest = path_1.default.join(backupDir, 'dialplan.xml');
        try {
            await promises_1.default.copyFile(dialplanSource, dialplanDest);
        }
        catch (error) {
            // File might not exist yet
        }
        // Backup directory
        const directorySource = path_1.default.join(this.configBasePath, 'directory', tenant.sip_domain);
        const directoryDest = path_1.default.join(backupDir, 'directory');
        try {
            await promises_1.default.cp(directorySource, directoryDest, { recursive: true });
        }
        catch (error) {
            // Directory might not exist yet
        }
        (0, logger_1.logFreeSWITCHEvent)('config_backup_created', {
            tenant_id: tenantId,
            backup_path: backupDir,
        });
        return backupDir;
    }
    /**
     * Rollback to a previous backup
     */
    async rollbackConfig(tenantId, backupPath) {
        const tenant = await this.tenantService.getTenantById(tenantId);
        // Restore dialplan
        const dialplanBackup = path_1.default.join(backupPath, 'dialplan.xml');
        const dialplanDest = path_1.default.join(this.configBasePath, 'dialplan', `tenant-${tenant.slug}-contexts.xml`);
        await promises_1.default.copyFile(dialplanBackup, dialplanDest);
        // Restore directory
        const directoryBackup = path_1.default.join(backupPath, 'directory');
        const directoryDest = path_1.default.join(this.configBasePath, 'directory', tenant.sip_domain);
        await promises_1.default.rm(directoryDest, { recursive: true, force: true });
        await promises_1.default.cp(directoryBackup, directoryDest, { recursive: true });
        // Reload
        await this.reloadFreeSWITCH();
        (0, logger_1.logFreeSWITCHEvent)('config_rollback_success', {
            tenant_id: tenantId,
            backup_path: backupPath,
        });
    }
    // Helper methods to get data with tenant
    async getExtensionWithTenant(extensionId) {
        // This would be implemented in extension service
        // For now, placeholder
        throw new Error('Not implemented');
    }
    async getTrunkWithTenant(trunkId) {
        // This would be implemented in trunk service
        // For now, placeholder
        throw new Error('Not implemented');
    }
}
exports.FreeSWITCHDeployService = FreeSWITCHDeployService;
//# sourceMappingURL=freeswitch-deploy.service.js.map