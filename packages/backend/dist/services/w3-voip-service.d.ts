export interface VoipTrunk {
    id: string;
    tenant_id: string;
    name: string;
    provider: string;
    host: string;
    port: number;
    transport: 'udp' | 'tcp' | 'tls';
    username: string;
    password: string;
    status: 'active' | 'inactive' | 'testing';
    created_at: Date;
    updated_at: Date;
}
export interface VoipDid {
    id: string;
    tenant_id: string;
    trunk_id: string;
    number: string;
    country_code: string;
    local_number: string;
    status: 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
}
export interface VoipExtension {
    id: string;
    tenant_id: string;
    store_id?: string;
    extension: string;
    password: string;
    display_name: string;
    status: 'active' | 'inactive';
    type: 'user' | 'queue' | 'conference';
    created_at: Date;
    updated_at: Date;
}
export interface VoipRoute {
    id: string;
    tenant_id: string;
    name: string;
    pattern: string;
    destination: string;
    priority: number;
    enabled: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface ContactPolicy {
    id: string;
    tenant_id: string;
    name: string;
    rules: any[];
    enabled: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateTrunkRequest {
    name: string;
    provider: string;
    host: string;
    port: number;
    transport: 'udp' | 'tcp' | 'tls';
    username: string;
    password: string;
}
export interface CreateDidRequest {
    trunk_id: string;
    number: string;
    country_code: string;
    local_number: string;
}
export interface CreateExtensionRequest {
    extension: string;
    password: string;
    display_name: string;
    type: 'user' | 'queue' | 'conference';
}
export interface CreateRouteRequest {
    name: string;
    pattern: string;
    destination: string;
    priority: number;
}
export interface CreateContactPolicyRequest {
    name: string;
    rules: any[];
}
export interface TenantContext {
    tenant_id: string;
    sip_domain: string;
    store_id?: string;
}
export declare class W3VoipService {
    private mockTrunks;
    private mockDids;
    private mockExtensions;
    private mockRoutes;
    private mockPolicies;
    createTrunk(tenantContext: TenantContext, data: CreateTrunkRequest): Promise<VoipTrunk>;
    getTrunks(tenantId: string, storeId?: string): Promise<VoipTrunk[]>;
    getTrunkById(trunkId: string, tenantId: string): Promise<VoipTrunk | null>;
    updateTrunk(trunkId: string, tenantId: string, data: Partial<CreateTrunkRequest>): Promise<VoipTrunk | null>;
    deleteTrunk(trunkId: string, tenantId: string): Promise<boolean>;
    createDid(tenantContext: TenantContext, data: CreateDidRequest): Promise<VoipDid>;
    getDids(tenantId: string, storeId?: string): Promise<VoipDid[]>;
    getDidById(didId: string, tenantId: string): Promise<VoipDid | null>;
    updateDid(didId: string, tenantId: string, data: Partial<CreateDidRequest>): Promise<VoipDid | null>;
    deleteDid(didId: string, tenantId: string): Promise<boolean>;
    createExtension(tenantContext: TenantContext, data: CreateExtensionRequest): Promise<VoipExtension>;
    getExtensions(tenantId: string, storeId?: string): Promise<VoipExtension[]>;
    getExtensionById(extensionId: string, tenantId: string): Promise<VoipExtension | null>;
    updateExtension(extensionId: string, tenantId: string, data: Partial<CreateExtensionRequest>): Promise<VoipExtension | null>;
    deleteExtension(extensionId: string, tenantId: string): Promise<boolean>;
    createRoute(tenantContext: TenantContext, data: CreateRouteRequest): Promise<VoipRoute>;
    getRoutes(tenantId: string): Promise<VoipRoute[]>;
    getRouteById(routeId: string, tenantId: string): Promise<VoipRoute | null>;
    updateRoute(routeId: string, tenantId: string, data: Partial<CreateRouteRequest>): Promise<VoipRoute | null>;
    deleteRoute(routeId: string, tenantId: string): Promise<boolean>;
    createContactPolicy(tenantContext: TenantContext, data: CreateContactPolicyRequest): Promise<ContactPolicy>;
    getContactPolicies(tenantId: string): Promise<ContactPolicy[]>;
    getContactPolicyById(policyId: string, tenantId: string): Promise<ContactPolicy | null>;
    updateContactPolicy(policyId: string, tenantId: string, data: Partial<CreateContactPolicyRequest>): Promise<ContactPolicy | null>;
    deleteContactPolicy(policyId: string, tenantId: string): Promise<boolean>;
    getTrunkStatus(trunkId: string, tenantId: string): Promise<'REG_OK' | 'FAIL' | 'UNKNOWN'>;
    updateTrunkStatus(trunkId: string, tenantId: string, status: 'REG_OK' | 'FAIL' | 'UNKNOWN'): Promise<boolean>;
    getExtensionsByStore(tenantId: string, storeId: string): Promise<VoipExtension[]>;
    getDidsByTrunk(tenantId: string, trunkId: string): Promise<VoipDid[]>;
}
//# sourceMappingURL=w3-voip-service.d.ts.map