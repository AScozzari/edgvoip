"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrunkRegistrationSchema = exports.SipTrunkSchema = void 0;
const zod_1 = require("zod");
// SIP Trunk schema
exports.SipTrunkSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(100),
    provider: zod_1.z.string().min(1).max(100),
    status: zod_1.z.enum(['active', 'inactive', 'testing']),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    // SIP Configuration
    sip_config: zod_1.z.object({
        host: zod_1.z.string().min(1),
        port: zod_1.z.number().min(1).max(65535).default(5060),
        transport: zod_1.z.enum(['udp', 'tcp', 'tls']).default('udp'),
        username: zod_1.z.string().min(1),
        password: zod_1.z.string().min(1),
        realm: zod_1.z.string().optional(),
        from_user: zod_1.z.string().optional(),
        from_domain: zod_1.z.string().optional(),
        register: zod_1.z.boolean().default(true),
        register_proxy: zod_1.z.string().optional(),
        register_transport: zod_1.z.enum(['udp', 'tcp', 'tls']).optional(),
        retry_seconds: zod_1.z.number().min(30).max(3600).default(60),
        caller_id_in_from: zod_1.z.boolean().default(false),
        contact_params: zod_1.z.string().optional(),
        ping: zod_1.z.boolean().default(true),
        ping_time: zod_1.z.number().min(30).max(300).default(60)
    }),
    // DID Configuration
    did_config: zod_1.z.object({
        number: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
        country_code: zod_1.z.string().length(2), // ISO 3166-1 alpha-2
        area_code: zod_1.z.string().optional(),
        local_number: zod_1.z.string().min(1),
        provider_did: zod_1.z.string().optional(),
        inbound_route: zod_1.z.string().optional()
    }),
    // Security & Compliance
    security: zod_1.z.object({
        encryption: zod_1.z.enum(['none', 'tls', 'srtp']).default('tls'),
        authentication: zod_1.z.enum(['none', 'digest', 'tls']).default('digest'),
        acl: zod_1.z.array(zod_1.z.string()).default([]), // IP whitelist
        rate_limit: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            calls_per_minute: zod_1.z.number().min(1).max(1000).default(60),
            calls_per_hour: zod_1.z.number().min(1).max(10000).default(1000)
        })
    }),
    // GDPR Compliance
    gdpr: zod_1.z.object({
        data_retention_days: zod_1.z.number().min(30).max(2555).default(365), // 1 year max
        recording_consent_required: zod_1.z.boolean().default(true),
        data_processing_purpose: zod_1.z.string().default('Business communications'),
        lawful_basis: zod_1.z.enum(['consent', 'contract', 'legitimate_interest']).default('legitimate_interest'),
        data_controller: zod_1.z.string().min(1),
        dpo_contact: zod_1.z.string().email().optional()
    })
});
// Trunk registration form schema (for UI)
exports.TrunkRegistrationSchema = zod_1.z.object({
    // Basic Info
    name: zod_1.z.string().min(1, 'Nome trunk richiesto').max(100),
    provider: zod_1.z.string().min(1, 'Provider richiesto').max(100),
    // SIP Settings
    host: zod_1.z.string().min(1, 'Host SIP richiesto'),
    port: zod_1.z.number().min(1).max(65535).default(5060),
    transport: zod_1.z.enum(['udp', 'tcp', 'tls']).default('udp'),
    username: zod_1.z.string().min(1, 'Username SIP richiesto'),
    password: zod_1.z.string().min(1, 'Password SIP richiesta'),
    realm: zod_1.z.string().optional(),
    // DID Settings
    number: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Formato numero non valido (E.164)'),
    country_code: zod_1.z.string().length(2, 'Codice paese richiesto (2 caratteri)'),
    local_number: zod_1.z.string().min(1, 'Numero locale richiesto'),
    // Security
    encryption: zod_1.z.enum(['none', 'tls', 'srtp']).default('tls'),
    authentication: zod_1.z.enum(['none', 'digest', 'tls']).default('digest'),
    // GDPR Compliance
    data_retention_days: zod_1.z.number().min(30).max(2555).default(365),
    recording_consent_required: zod_1.z.boolean().default(true),
    data_controller: zod_1.z.string().min(1, 'Titolare del trattamento richiesto'),
    dpo_contact: zod_1.z.string().email('Email DPO non valida').optional(),
    // Terms acceptance
    gdpr_consent: zod_1.z.boolean().refine(val => val === true, 'Consenso GDPR richiesto'),
    terms_accepted: zod_1.z.boolean().refine(val => val === true, 'Termini e condizioni richiesti')
});
//# sourceMappingURL=trunk.js.map