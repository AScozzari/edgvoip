export interface SipTrunkEnhanced {
    id: string;
    tenant_id: string;
    store_id?: string;
    name: string;
    provider: string;
    provider_type: string;
    provider_config: any;
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
    codec_preferences: string[];
    dtmf_mode: 'rfc2833' | 'inband' | 'info';
    nat_traversal: boolean;
    nat_type: 'none' | 'stun' | 'turn' | 'ice';
    session_timers: boolean;
    session_refresh_method: 'uas' | 'uac';
    session_expires: number;
    session_min_se: number;
    media_timeout: number;
    media_hold_timeout: number;
    rtp_timeout: number;
    rtp_hold_timeout: number;
    call_timeout: number;
    call_timeout_code: string;
    hangup_after_bridge: boolean;
    record_calls: boolean;
    record_path?: string;
    record_sample_rate: number;
    record_channels: number;
    failover_trunk_id?: string;
    max_concurrent_calls: number;
    current_calls: number;
    last_registration_attempt?: Date;
    last_successful_registration?: Date;
    registration_attempts: number;
    registration_failures: number;
    last_error_message?: string;
    health_check_interval: number;
    health_check_timeout: number;
    health_check_enabled: boolean;
    last_health_check?: Date;
    health_status: 'healthy' | 'unhealthy' | 'unknown';
    created_at: Date;
    updated_at: Date;
}
export interface SipProviderTemplate {
    id: string;
    name: string;
    provider_type: string;
    description: string;
    default_config: any;
    required_fields: string[];
    optional_fields: string[];
    codec_preferences: string[];
    supported_features: any;
    documentation_url?: string;
    created_at: Date;
    updated_at: Date;
}
export interface SipTrunkHealthLog {
    id: string;
    trunk_id: string;
    check_type: 'registration' | 'ping' | 'call_test';
    status: 'success' | 'failure' | 'timeout';
    response_time?: number;
    error_message?: string;
    details?: any;
    checked_at: Date;
}
export interface SipTrunkUsageStats {
    id: string;
    trunk_id: string;
    date: Date;
    total_calls: number;
    successful_calls: number;
    failed_calls: number;
    total_duration: number;
    total_cost: number;
    peak_concurrent_calls: number;
    created_at: Date;
    updated_at: Date;
}
export declare class SipTrunkEnhancedService {
    getProviderTemplates(): Promise<SipProviderTemplate[]>;
    getProviderTemplate(providerType: string): Promise<SipProviderTemplate | null>;
    createSipTrunk(trunkData: Partial<SipTrunkEnhanced>): Promise<SipTrunkEnhanced>;
    getSipTrunks(tenantId: string, storeId?: string): Promise<SipTrunkEnhanced[]>;
    testSipTrunk(trunkId: string): Promise<{
        success: boolean;
        message: string;
        response_time?: number;
        error?: string;
    }>;
    getHealthLogs(trunkId: string, limit?: number): Promise<SipTrunkHealthLog[]>;
    getUsageStats(trunkId: string, startDate: Date, endDate: Date): Promise<SipTrunkUsageStats[]>;
    private logHealthCheck;
    private simulateSipTrunkTest;
    private mapRowToSipTrunk;
}
export declare const sipTrunkEnhancedService: SipTrunkEnhancedService;
//# sourceMappingURL=sip-trunk-enhanced.service.d.ts.map