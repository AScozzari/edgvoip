import { CreateTenantRequest, Company, TenantContact, CrossTenantStats, TenantStats } from '@w3-voip/shared';
export interface Tenant {
    id: string;
    name: string;
    domain: string;
    sip_domain: string;
    status: 'active' | 'suspended' | 'pending';
    settings: {
        max_extensions: number;
        max_concurrent_calls: number;
        recording_enabled: boolean;
        voicemail_enabled: boolean;
    };
    created_at: Date;
    updated_at: Date;
}
export declare class TenantService {
    createTenant(tenantData: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>): Promise<Tenant>;
    getTenantById(tenantId: string): Promise<Tenant | null>;
    getTenantByDomain(domain: string): Promise<Tenant | null>;
    updateTenant(tenantId: string, updates: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>>): Promise<Tenant>;
    deleteTenant(tenantId: string): Promise<void>;
    listTenants(page?: number, limit?: number, search?: string): Promise<{
        tenants: Tenant[];
        total: number;
        totalPages: number;
    }>;
    getTenantStats(tenantId: string): Promise<{
        store_count: number;
        extension_count: number;
        trunk_count: number;
        total_calls: number;
        active_calls: number;
        last_call_time: Date | null;
    }>;
    activateTenant(tenantId: string): Promise<Tenant>;
    suspendTenant(tenantId: string): Promise<Tenant>;
    validateDomainUniqueness(domain: string, sipDomain: string, excludeTenantId?: string): Promise<boolean>;
    createTenantWithCompanies(data: CreateTenantRequest): Promise<Tenant>;
    getCrossTenantStats(): Promise<CrossTenantStats>;
    getTenantStatsList(): Promise<TenantStats[]>;
    impersonateUser(superAdminId: string, targetUserId: string): Promise<string>;
    getTenantWithDetails(tenantId: string): Promise<{
        tenant: Tenant;
        companies: Company[];
        contacts: TenantContact[];
    }>;
}
//# sourceMappingURL=tenant.service.d.ts.map