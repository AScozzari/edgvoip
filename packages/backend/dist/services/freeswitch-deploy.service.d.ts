export declare class FreeSWITCHDeployService {
    private tenantService;
    private freeswitchConfigService;
    private eslService;
    private configBasePath;
    constructor();
    /**
     * Deploy complete tenant configuration to FreeSWITCH
     */
    deployTenantConfig(tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Deploy single extension configuration
     */
    deployExtension(extensionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Deploy single trunk configuration
     */
    deployTrunk(trunkId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Write all configuration files for a tenant
     */
    private writeConfigFiles;
    /**
     * Reload FreeSWITCH configuration
     */
    reloadFreeSWITCH(): Promise<void>;
    /**
     * Verify deployment by checking registrations
     */
    private verifyDeployment;
    /**
     * Create backup of current configuration
     */
    createConfigBackup(tenantId: string): Promise<string>;
    /**
     * Rollback to a previous backup
     */
    rollbackConfig(tenantId: string, backupPath: string): Promise<void>;
    private getExtensionWithTenant;
    private getTrunkWithTenant;
}
//# sourceMappingURL=freeswitch-deploy.service.d.ts.map