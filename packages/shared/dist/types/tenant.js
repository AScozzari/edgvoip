"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionSchema = exports.StoreSchema = exports.TenantSchema = void 0;
const zod_1 = require("zod");
// Tenant base schema
exports.TenantSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    domain: zod_1.z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/),
    sip_domain: zod_1.z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/),
    status: zod_1.z.enum(['active', 'suspended', 'pending']),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    settings: zod_1.z.object({
        max_concurrent_calls: zod_1.z.number().min(1).max(1000).default(20),
        recording_enabled: zod_1.z.boolean().default(true),
        gdpr_compliant: zod_1.z.boolean().default(true),
        timezone: zod_1.z.string().default('Europe/Rome'),
        language: zod_1.z.string().default('it')
    })
});
// Store schema
exports.StoreSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    store_id: zod_1.z.string().min(1).max(50), // W3 Suite store ID
    status: zod_1.z.enum(['active', 'inactive']),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    settings: zod_1.z.object({
        business_hours: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            timezone: zod_1.z.string().default('Europe/Rome'),
            schedule: zod_1.z.record(zod_1.z.object({
                open: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
                close: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            }))
        }),
        outbound_caller_id: zod_1.z.string().optional(),
        recording_consent_required: zod_1.z.boolean().default(true)
    })
});
// Extension/Internal schema
exports.ExtensionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    extension: zod_1.z.string().regex(/^[0-9]{3,6}$/),
    password: zod_1.z.string().min(8).max(32),
    display_name: zod_1.z.string().min(1).max(100),
    status: zod_1.z.enum(['active', 'inactive', 'locked']),
    type: zod_1.z.enum(['user', 'queue', 'conference', 'voicemail']),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    settings: zod_1.z.object({
        voicemail_enabled: zod_1.z.boolean().default(true),
        call_forwarding: zod_1.z.object({
            enabled: zod_1.z.boolean().default(false),
            destination: zod_1.z.string().optional()
        }),
        dnd_enabled: zod_1.z.boolean().default(false),
        recording_enabled: zod_1.z.boolean().default(true)
    })
});
//# sourceMappingURL=tenant.js.map