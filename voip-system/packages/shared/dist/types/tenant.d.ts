import { z } from 'zod';
export declare const TenantSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    domain: z.ZodString;
    sip_domain: z.ZodString;
    status: z.ZodEnum<["active", "suspended", "pending"]>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
    settings: z.ZodObject<{
        max_concurrent_calls: z.ZodDefault<z.ZodNumber>;
        recording_enabled: z.ZodDefault<z.ZodBoolean>;
        gdpr_compliant: z.ZodDefault<z.ZodBoolean>;
        timezone: z.ZodDefault<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        max_concurrent_calls: number;
        recording_enabled: boolean;
        gdpr_compliant: boolean;
        timezone: string;
        language: string;
    }, {
        max_concurrent_calls?: number | undefined;
        recording_enabled?: boolean | undefined;
        gdpr_compliant?: boolean | undefined;
        timezone?: string | undefined;
        language?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    domain: string;
    sip_domain: string;
    status: "active" | "suspended" | "pending";
    created_at: Date;
    updated_at: Date;
    settings: {
        max_concurrent_calls: number;
        recording_enabled: boolean;
        gdpr_compliant: boolean;
        timezone: string;
        language: string;
    };
}, {
    id: string;
    name: string;
    domain: string;
    sip_domain: string;
    status: "active" | "suspended" | "pending";
    created_at: Date;
    updated_at: Date;
    settings: {
        max_concurrent_calls?: number | undefined;
        recording_enabled?: boolean | undefined;
        gdpr_compliant?: boolean | undefined;
        timezone?: string | undefined;
        language?: string | undefined;
    };
}>;
export type Tenant = z.infer<typeof TenantSchema>;
export declare const StoreSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    name: z.ZodString;
    store_id: z.ZodString;
    status: z.ZodEnum<["active", "inactive"]>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
    settings: z.ZodObject<{
        business_hours: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            timezone: z.ZodDefault<z.ZodString>;
            schedule: z.ZodRecord<z.ZodString, z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                open: string;
                close: string;
            }, {
                open: string;
                close: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            timezone: string;
            enabled: boolean;
            schedule: Record<string, {
                open: string;
                close: string;
            }>;
        }, {
            schedule: Record<string, {
                open: string;
                close: string;
            }>;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        }>;
        outbound_caller_id: z.ZodOptional<z.ZodString>;
        recording_consent_required: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        business_hours: {
            timezone: string;
            enabled: boolean;
            schedule: Record<string, {
                open: string;
                close: string;
            }>;
        };
        recording_consent_required: boolean;
        outbound_caller_id?: string | undefined;
    }, {
        business_hours: {
            schedule: Record<string, {
                open: string;
                close: string;
            }>;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        };
        outbound_caller_id?: string | undefined;
        recording_consent_required?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    status: "active" | "inactive";
    created_at: Date;
    updated_at: Date;
    settings: {
        business_hours: {
            timezone: string;
            enabled: boolean;
            schedule: Record<string, {
                open: string;
                close: string;
            }>;
        };
        recording_consent_required: boolean;
        outbound_caller_id?: string | undefined;
    };
    tenant_id: string;
    store_id: string;
}, {
    id: string;
    name: string;
    status: "active" | "inactive";
    created_at: Date;
    updated_at: Date;
    settings: {
        business_hours: {
            schedule: Record<string, {
                open: string;
                close: string;
            }>;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        };
        outbound_caller_id?: string | undefined;
        recording_consent_required?: boolean | undefined;
    };
    tenant_id: string;
    store_id: string;
}>;
export type Store = z.infer<typeof StoreSchema>;
export declare const ExtensionSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    extension: z.ZodString;
    password: z.ZodString;
    display_name: z.ZodString;
    status: z.ZodEnum<["active", "inactive", "locked"]>;
    type: z.ZodEnum<["user", "queue", "conference", "voicemail"]>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
    settings: z.ZodObject<{
        voicemail_enabled: z.ZodDefault<z.ZodBoolean>;
        call_forwarding: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            destination: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            destination?: string | undefined;
        }, {
            enabled?: boolean | undefined;
            destination?: string | undefined;
        }>;
        dnd_enabled: z.ZodDefault<z.ZodBoolean>;
        recording_enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        recording_enabled: boolean;
        voicemail_enabled: boolean;
        call_forwarding: {
            enabled: boolean;
            destination?: string | undefined;
        };
        dnd_enabled: boolean;
    }, {
        call_forwarding: {
            enabled?: boolean | undefined;
            destination?: string | undefined;
        };
        recording_enabled?: boolean | undefined;
        voicemail_enabled?: boolean | undefined;
        dnd_enabled?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "active" | "inactive" | "locked";
    type: "user" | "queue" | "conference" | "voicemail";
    created_at: Date;
    updated_at: Date;
    settings: {
        recording_enabled: boolean;
        voicemail_enabled: boolean;
        call_forwarding: {
            enabled: boolean;
            destination?: string | undefined;
        };
        dnd_enabled: boolean;
    };
    tenant_id: string;
    extension: string;
    password: string;
    display_name: string;
    store_id?: string | undefined;
}, {
    id: string;
    status: "active" | "inactive" | "locked";
    type: "user" | "queue" | "conference" | "voicemail";
    created_at: Date;
    updated_at: Date;
    settings: {
        call_forwarding: {
            enabled?: boolean | undefined;
            destination?: string | undefined;
        };
        recording_enabled?: boolean | undefined;
        voicemail_enabled?: boolean | undefined;
        dnd_enabled?: boolean | undefined;
    };
    tenant_id: string;
    extension: string;
    password: string;
    display_name: string;
    store_id?: string | undefined;
}>;
export type Extension = z.infer<typeof ExtensionSchema>;
//# sourceMappingURL=tenant.d.ts.map