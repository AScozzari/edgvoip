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
export declare class FreeSWITCHConfigService {
    private configPath;
    private templatePath;
    constructor();
    generateTenantDomainConfig(tenant: Tenant): Promise<void>;
    generateExtensionConfig(extension: Extension, tenant: Tenant): Promise<void>;
    generateTrunkConfig(trunk: any, tenant: Tenant): Promise<void>;
    reloadFreeSWITCHConfig(): Promise<void>;
    deleteTenantConfig(tenant: Tenant): Promise<void>;
    private generateSecurePassword;
    syncAllTenantConfigs(): Promise<void>;
    /**
     * Generate tenant contexts XML from template
     */
    generateTenantContexts(tenant: any): Promise<string>;
    /**
     * Generate all extensions XML for a tenant
     */
    generateExtensionsXML(tenant: any): Promise<string[]>;
    /**
     * Generate single extension XML from template
     */
    generateExtensionXML(extension: any, tenant: any): Promise<string>;
    /**
     * Generate all trunks XML for a tenant
     */
    generateTrunksXML(tenant: any): Promise<string[]>;
    /**
     * Generate single trunk gateway XML from template
     */
    generateTrunkGatewayXML(trunk: any, tenant: any): Promise<string>;
}
//# sourceMappingURL=freeswitch-config.service.d.ts.map