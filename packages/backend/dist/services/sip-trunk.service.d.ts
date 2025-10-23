export interface SipTrunk {
    id: string;
    tenant_id: string;
    store_id?: string;
    name: string;
    provider: string;
    status: 'active' | 'inactive' | 'testing';
    sip_config: {
        host: string;
        port: number;
        transport: 'udp' | 'tcp' | 'tls';
        username: string;
        password: string;
        realm?: string;
        from_user?: string;
        from_domain?: string;
        register: boolean;
        register_proxy?: string;
        register_transport?: 'udp' | 'tcp' | 'tls';
        retry_seconds: number;
        caller_id_in_from: boolean;
        contact_params?: string;
        ping: boolean;
        ping_time: number;
    };
    did_config: {
        number: string;
        country_code: string;
        area_code?: string;
        local_number: string;
        provider_did?: string;
        inbound_route?: string;
    };
    security: {
        encryption: 'none' | 'tls' | 'srtp';
        authentication: 'none' | 'digest' | 'tls';
        acl: string[];
        rate_limit: {
            enabled: boolean;
            calls_per_minute: number;
            calls_per_hour: number;
        };
    };
    gdpr: {
        data_retention_days: number;
        recording_consent_required: boolean;
        data_processing_purpose: string;
        lawful_basis: 'consent' | 'contract' | 'legitimate_interest';
        data_controller: string;
        dpo_contact?: string;
    };
    created_at: Date;
    updated_at: Date;
}
export declare class SipTrunkService {
    createSipTrunk(trunkData: Omit<SipTrunk, 'id' | 'created_at' | 'updated_at'>): Promise<SipTrunk>;
    getSipTrunkById(trunkId: string, tenantId: string): Promise<SipTrunk | null>;
    listSipTrunks(tenantId: string, storeId?: string): Promise<SipTrunk[]>;
    updateSipTrunk(trunkId: string, tenantId: string, updateData: Partial<Omit<SipTrunk, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>): Promise<SipTrunk>;
    deleteSipTrunk(trunkId: string, tenantId: string): Promise<void>;
    testSipTrunk(trunkId: string, tenantId: string): Promise<{
        success: boolean;
        message: string;
        details?: any;
    }>;
    getSipTrunkStats(trunkId: string, tenantId: string): Promise<any>;
}
export declare const sipTrunkService: SipTrunkService;
//# sourceMappingURL=sip-trunk.service.d.ts.map