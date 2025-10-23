import { z } from 'zod';
export declare const SipTrunkSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    provider: z.ZodString;
    status: z.ZodEnum<["active", "inactive", "testing"]>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
    sip_config: z.ZodObject<{
        host: z.ZodString;
        port: z.ZodDefault<z.ZodNumber>;
        transport: z.ZodDefault<z.ZodEnum<["udp", "tcp", "tls"]>>;
        username: z.ZodString;
        password: z.ZodString;
        realm: z.ZodOptional<z.ZodString>;
        from_user: z.ZodOptional<z.ZodString>;
        from_domain: z.ZodOptional<z.ZodString>;
        register: z.ZodDefault<z.ZodBoolean>;
        register_proxy: z.ZodOptional<z.ZodString>;
        register_transport: z.ZodOptional<z.ZodEnum<["udp", "tcp", "tls"]>>;
        retry_seconds: z.ZodDefault<z.ZodNumber>;
        caller_id_in_from: z.ZodDefault<z.ZodBoolean>;
        contact_params: z.ZodOptional<z.ZodString>;
        ping: z.ZodDefault<z.ZodBoolean>;
        ping_time: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        host: string;
        port: number;
        transport: "udp" | "tcp" | "tls";
        username: string;
        register: boolean;
        retry_seconds: number;
        caller_id_in_from: boolean;
        ping: boolean;
        ping_time: number;
        realm?: string | undefined;
        from_user?: string | undefined;
        from_domain?: string | undefined;
        register_proxy?: string | undefined;
        register_transport?: "udp" | "tcp" | "tls" | undefined;
        contact_params?: string | undefined;
    }, {
        password: string;
        host: string;
        username: string;
        port?: number | undefined;
        transport?: "udp" | "tcp" | "tls" | undefined;
        realm?: string | undefined;
        from_user?: string | undefined;
        from_domain?: string | undefined;
        register?: boolean | undefined;
        register_proxy?: string | undefined;
        register_transport?: "udp" | "tcp" | "tls" | undefined;
        retry_seconds?: number | undefined;
        caller_id_in_from?: boolean | undefined;
        contact_params?: string | undefined;
        ping?: boolean | undefined;
        ping_time?: number | undefined;
    }>;
    did_config: z.ZodObject<{
        number: z.ZodString;
        country_code: z.ZodString;
        area_code: z.ZodOptional<z.ZodString>;
        local_number: z.ZodString;
        provider_did: z.ZodOptional<z.ZodString>;
        inbound_route: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        number: string;
        country_code: string;
        local_number: string;
        area_code?: string | undefined;
        provider_did?: string | undefined;
        inbound_route?: string | undefined;
    }, {
        number: string;
        country_code: string;
        local_number: string;
        area_code?: string | undefined;
        provider_did?: string | undefined;
        inbound_route?: string | undefined;
    }>;
    security: z.ZodObject<{
        encryption: z.ZodDefault<z.ZodEnum<["none", "tls", "srtp"]>>;
        authentication: z.ZodDefault<z.ZodEnum<["none", "digest", "tls"]>>;
        acl: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        rate_limit: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            calls_per_minute: z.ZodDefault<z.ZodNumber>;
            calls_per_hour: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            calls_per_minute: number;
            calls_per_hour: number;
        }, {
            enabled?: boolean | undefined;
            calls_per_minute?: number | undefined;
            calls_per_hour?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        encryption: "tls" | "none" | "srtp";
        authentication: "tls" | "none" | "digest";
        acl: string[];
        rate_limit: {
            enabled: boolean;
            calls_per_minute: number;
            calls_per_hour: number;
        };
    }, {
        rate_limit: {
            enabled?: boolean | undefined;
            calls_per_minute?: number | undefined;
            calls_per_hour?: number | undefined;
        };
        encryption?: "tls" | "none" | "srtp" | undefined;
        authentication?: "tls" | "none" | "digest" | undefined;
        acl?: string[] | undefined;
    }>;
    gdpr: z.ZodObject<{
        data_retention_days: z.ZodDefault<z.ZodNumber>;
        recording_consent_required: z.ZodDefault<z.ZodBoolean>;
        data_processing_purpose: z.ZodDefault<z.ZodString>;
        lawful_basis: z.ZodDefault<z.ZodEnum<["consent", "contract", "legitimate_interest"]>>;
        data_controller: z.ZodString;
        dpo_contact: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        recording_consent_required: boolean;
        data_retention_days: number;
        data_processing_purpose: string;
        lawful_basis: "consent" | "contract" | "legitimate_interest";
        data_controller: string;
        dpo_contact?: string | undefined;
    }, {
        data_controller: string;
        recording_consent_required?: boolean | undefined;
        data_retention_days?: number | undefined;
        data_processing_purpose?: string | undefined;
        lawful_basis?: "consent" | "contract" | "legitimate_interest" | undefined;
        dpo_contact?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    status: "active" | "inactive" | "testing";
    created_at: Date;
    updated_at: Date;
    tenant_id: string;
    provider: string;
    sip_config: {
        password: string;
        host: string;
        port: number;
        transport: "udp" | "tcp" | "tls";
        username: string;
        register: boolean;
        retry_seconds: number;
        caller_id_in_from: boolean;
        ping: boolean;
        ping_time: number;
        realm?: string | undefined;
        from_user?: string | undefined;
        from_domain?: string | undefined;
        register_proxy?: string | undefined;
        register_transport?: "udp" | "tcp" | "tls" | undefined;
        contact_params?: string | undefined;
    };
    did_config: {
        number: string;
        country_code: string;
        local_number: string;
        area_code?: string | undefined;
        provider_did?: string | undefined;
        inbound_route?: string | undefined;
    };
    security: {
        encryption: "tls" | "none" | "srtp";
        authentication: "tls" | "none" | "digest";
        acl: string[];
        rate_limit: {
            enabled: boolean;
            calls_per_minute: number;
            calls_per_hour: number;
        };
    };
    gdpr: {
        recording_consent_required: boolean;
        data_retention_days: number;
        data_processing_purpose: string;
        lawful_basis: "consent" | "contract" | "legitimate_interest";
        data_controller: string;
        dpo_contact?: string | undefined;
    };
    store_id?: string | undefined;
}, {
    id: string;
    name: string;
    status: "active" | "inactive" | "testing";
    created_at: Date;
    updated_at: Date;
    tenant_id: string;
    provider: string;
    sip_config: {
        password: string;
        host: string;
        username: string;
        port?: number | undefined;
        transport?: "udp" | "tcp" | "tls" | undefined;
        realm?: string | undefined;
        from_user?: string | undefined;
        from_domain?: string | undefined;
        register?: boolean | undefined;
        register_proxy?: string | undefined;
        register_transport?: "udp" | "tcp" | "tls" | undefined;
        retry_seconds?: number | undefined;
        caller_id_in_from?: boolean | undefined;
        contact_params?: string | undefined;
        ping?: boolean | undefined;
        ping_time?: number | undefined;
    };
    did_config: {
        number: string;
        country_code: string;
        local_number: string;
        area_code?: string | undefined;
        provider_did?: string | undefined;
        inbound_route?: string | undefined;
    };
    security: {
        rate_limit: {
            enabled?: boolean | undefined;
            calls_per_minute?: number | undefined;
            calls_per_hour?: number | undefined;
        };
        encryption?: "tls" | "none" | "srtp" | undefined;
        authentication?: "tls" | "none" | "digest" | undefined;
        acl?: string[] | undefined;
    };
    gdpr: {
        data_controller: string;
        recording_consent_required?: boolean | undefined;
        data_retention_days?: number | undefined;
        data_processing_purpose?: string | undefined;
        lawful_basis?: "consent" | "contract" | "legitimate_interest" | undefined;
        dpo_contact?: string | undefined;
    };
    store_id?: string | undefined;
}>;
export type SipTrunk = z.infer<typeof SipTrunkSchema>;
export declare const TrunkRegistrationSchema: z.ZodObject<{
    name: z.ZodString;
    provider: z.ZodString;
    host: z.ZodString;
    port: z.ZodDefault<z.ZodNumber>;
    transport: z.ZodDefault<z.ZodEnum<["udp", "tcp", "tls"]>>;
    username: z.ZodString;
    password: z.ZodString;
    realm: z.ZodOptional<z.ZodString>;
    number: z.ZodString;
    country_code: z.ZodString;
    local_number: z.ZodString;
    encryption: z.ZodDefault<z.ZodEnum<["none", "tls", "srtp"]>>;
    authentication: z.ZodDefault<z.ZodEnum<["none", "digest", "tls"]>>;
    data_retention_days: z.ZodDefault<z.ZodNumber>;
    recording_consent_required: z.ZodDefault<z.ZodBoolean>;
    data_controller: z.ZodString;
    dpo_contact: z.ZodOptional<z.ZodString>;
    gdpr_consent: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    terms_accepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    number: string;
    name: string;
    recording_consent_required: boolean;
    password: string;
    provider: string;
    host: string;
    port: number;
    transport: "udp" | "tcp" | "tls";
    username: string;
    country_code: string;
    local_number: string;
    encryption: "tls" | "none" | "srtp";
    authentication: "tls" | "none" | "digest";
    data_retention_days: number;
    data_controller: string;
    gdpr_consent: boolean;
    terms_accepted: boolean;
    realm?: string | undefined;
    dpo_contact?: string | undefined;
}, {
    number: string;
    name: string;
    password: string;
    provider: string;
    host: string;
    username: string;
    country_code: string;
    local_number: string;
    data_controller: string;
    gdpr_consent: boolean;
    terms_accepted: boolean;
    recording_consent_required?: boolean | undefined;
    port?: number | undefined;
    transport?: "udp" | "tcp" | "tls" | undefined;
    realm?: string | undefined;
    encryption?: "tls" | "none" | "srtp" | undefined;
    authentication?: "tls" | "none" | "digest" | undefined;
    data_retention_days?: number | undefined;
    dpo_contact?: string | undefined;
}>;
export type TrunkRegistration = z.infer<typeof TrunkRegistrationSchema>;
//# sourceMappingURL=trunk.d.ts.map