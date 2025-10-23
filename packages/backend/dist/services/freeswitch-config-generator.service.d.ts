export interface Extension {
    id: string;
    extension: string;
    display_name: string;
    password: string;
    tenant_id: string;
    type?: string;
    settings?: any;
}
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
export interface DialplanRoute {
    id: string;
    name: string;
    pattern: string;
    destination: string;
    destination_type: 'extension' | 'ring_group' | 'queue' | 'ivr' | 'conference' | 'voicemail';
    tenant_id: string;
    settings?: any;
}
export declare class FreeSwitchConfigGenerator {
    private extensionService;
    private sipTrunkService;
    private configPath;
    constructor();
    /**
     * Generate XML for a single extension
     */
    generateExtensionXML(extension: Extension): string;
    /**
     * Generate XML for a SIP trunk/gateway
     */
    generateGatewayXML(trunk: SipTrunk): string;
    /**
     * Generate dialplan XML for routing
     */
    generateDialplanXML(routes: DialplanRoute[]): string;
    /**
     * Generate IVR configuration XML
     */
    generateIVRXML(ivrMenus: any[]): string;
    /**
     * Generate conference configuration XML
     */
    generateConferenceXML(conferences: any[]): string;
    /**
     * Sync all configurations to FreeSWITCH
     */
    syncToFreeSWITCH(): Promise<void>;
    /**
     * Sync extensions from database to FreeSWITCH
     */
    syncExtensions(): Promise<void>;
    /**
     * Sync SIP trunks from database to FreeSWITCH
     */
    syncSipTrunks(): Promise<void>;
    /**
     * Sync dialplan from database to FreeSWITCH
     */
    syncDialplan(): Promise<void>;
    /**
     * Reload FreeSWITCH configurations
     */
    reloadFreeSWITCH(): Promise<void>;
    /**
     * Generate all configuration files
     */
    generateAllConfigs(): Promise<void>;
}
export declare const freeSwitchConfigGenerator: FreeSwitchConfigGenerator;
//# sourceMappingURL=freeswitch-config-generator.service.d.ts.map