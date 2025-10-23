"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateContactPolicyRequestSchema = exports.CreateRouteRequestSchema = exports.CreateExtensionRequestSchema = exports.CreateDidRequestSchema = exports.CreateTrunkRequestSchema = exports.VoipCdrSchema = exports.VoipActivityLogSchema = exports.ContactPolicySchema = exports.VoipRouteSchema = exports.VoipExtensionSchema = exports.VoipDidSchema = exports.VoipTrunkSchema = void 0;
const zod_1 = require("zod");
// ===== VOIP TRUNKS =====
exports.VoipTrunkSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    sip_domain: zod_1.z.string(), // es. tenantA.pbx.w3suite.it
    provider: zod_1.z.string(), // nome carrier (es. Messagenet)
    proxy: zod_1.z.string(), // host/realm del registrar (es. sip.messagenet.it)
    port: zod_1.z.number().min(1).max(65535).default(5060),
    transport: zod_1.z.enum(['udp', 'tcp', 'tls']).default('udp'),
    auth_username: zod_1.z.string(), // user/URI del trunk
    secret_ref: zod_1.z.string(), // riferimento a segreto (vault/KMS)
    register: zod_1.z.boolean().default(true), // registrato o IP auth
    expiry_seconds: zod_1.z.number().min(60).max(3600).default(300),
    codec_set: zod_1.z.string().default('G729,PCMA,PCMU'), // priorità codec verso carrier
    status: zod_1.z.enum(['REG_OK', 'FAIL', 'UNKNOWN']).default('UNKNOWN'),
    note: zod_1.z.string().optional()
});
// ===== VOIP DIDS =====
exports.VoipDidSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    trunk_id: zod_1.z.string().uuid(), // riferimento al trunk d'ingresso
    e164: zod_1.z.string().regex(/^\+[1-9]\d{1,14}$/), // numero in formato E.164
    sip_domain: zod_1.z.string().optional(), // dominio PBX (utile per lookup)
    route_target_type: zod_1.z.enum(['ext', 'ivr', 'queue', 'ai']), // destinazione
    route_target_ref: zod_1.z.string(), // riferimento concreto (es. 1001 o ivr_main)
    label: zod_1.z.string(), // alias descrittivo (es. "Main Line Roma")
    active: zod_1.z.boolean().default(true)
});
// ===== VOIP EXTENSIONS =====
exports.VoipExtensionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    sip_domain: zod_1.z.string(), // dominio PBX del tenant
    ext_number: zod_1.z.string().regex(/^[0-9]{3,6}$/), // numero interno (unico nel dominio)
    display_name: zod_1.z.string(), // nome mostrato (caller name)
    enabled: zod_1.z.boolean().default(true), // registrabile e chiamabile
    voicemail_enabled: zod_1.z.boolean().default(false), // se abilita VM
    forward_rules: zod_1.z.record(zod_1.z.string()).optional(), // JSON semplice (busy/no-answer/off-hours → target)
    class_of_service: zod_1.z.enum(['agent', 'supervisor', 'admin']).default('agent'), // profilo chiamate consentite
    note: zod_1.z.string().optional() // testo libero (info/HR)
});
// ===== VOIP ROUTES =====
exports.VoipRouteSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    name: zod_1.z.string(), // nome rotta (es. "Uscita nazionale")
    pattern: zod_1.z.string(), // regex/pattern (es. ^9(\d+)$)
    strip_digits: zod_1.z.number().min(0).default(0), // numeri da rimuovere (es. 1 per togliere il 9)
    prepend: zod_1.z.string().optional(), // prefisso da aggiungere (es. 0)
    trunk_id: zod_1.z.string().uuid(), // trunk da usare per l'uscita
    priority: zod_1.z.number().min(1).default(1), // ordine di valutazione
    active: zod_1.z.boolean().default(true)
});
// ===== CONTACT POLICIES =====
exports.ContactPolicySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    scope_type: zod_1.z.enum(['tenant', 'store', 'did', 'ext']), // ambito applicazione
    scope_ref: zod_1.z.string(), // id di riferimento (es. store_id o e164 o ext)
    rules_json: zod_1.z.record(zod_1.z.any()), // JSON con orari apertura/chiusura, fallback (VM/AI/queue), annunci
    active: zod_1.z.boolean().default(true),
    label: zod_1.z.string() // alias descrittivo (es. "Orari Roma")
});
// ===== VOIP ACTIVITY LOG =====
exports.VoipActivityLogSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    actor: zod_1.z.string(), // user:<id> o system:w3-provisioner
    action: zod_1.z.enum(['create', 'update', 'delete', 'provision', 'sync']),
    target_type: zod_1.z.enum(['trunk', 'did', 'ext', 'route', 'policy']),
    target_id: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['ok', 'fail']),
    details_json: zod_1.z.record(zod_1.z.any()).optional(), // payload/diff/esito chiamate API verso PBX
    ts: zod_1.z.string().datetime() // timestamp evento (UTC)
});
// ===== VOIP CDR =====
exports.VoipCdrSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    sip_domain: zod_1.z.string(), // dominio PBX (per correlazione multi-tenant)
    call_id: zod_1.z.string(), // ID chiamata PBX
    direction: zod_1.z.enum(['in', 'out']),
    from_uri: zod_1.z.string(), // sorgente (E.164 o ext)
    to_uri: zod_1.z.string(), // destinazione (E.164 o ext)
    did_e164: zod_1.z.string().optional(), // DID coinvolto (se inbound)
    ext_number: zod_1.z.string().optional(), // interno coinvolto (se presente)
    start_ts: zod_1.z.string().datetime(),
    answer_ts: zod_1.z.string().datetime().optional(),
    end_ts: zod_1.z.string().datetime(),
    billsec: zod_1.z.number().min(0).default(0), // secondi fatturati
    disposition: zod_1.z.enum(['ANSWERED', 'NO_ANSWER', 'BUSY', 'FAILED']),
    recording_url: zod_1.z.string().url().optional(), // link alla registrazione (se disponibile)
    meta_json: zod_1.z.record(zod_1.z.any()).optional() // extra (codec, mos, cause codes)
});
// ===== API REQUEST/RESPONSE TYPES =====
// Create Trunk Request
exports.CreateTrunkRequestSchema = zod_1.z.object({
    provider: zod_1.z.string(),
    proxy: zod_1.z.string(),
    port: zod_1.z.number().min(1).max(65535).default(5060),
    transport: zod_1.z.enum(['udp', 'tcp', 'tls']).default('udp'),
    auth_username: zod_1.z.string(),
    secret_ref: zod_1.z.string(),
    register: zod_1.z.boolean().default(true),
    expiry_seconds: zod_1.z.number().min(60).max(3600).default(300),
    codec_set: zod_1.z.string().default('G729,PCMA,PCMU'),
    note: zod_1.z.string().optional(),
    store_id: zod_1.z.string().uuid().optional()
});
// Create DID Request
exports.CreateDidRequestSchema = zod_1.z.object({
    trunk_id: zod_1.z.string().uuid(),
    e164: zod_1.z.string().regex(/^\+[1-9]\d{1,14}$/),
    route_target_type: zod_1.z.enum(['ext', 'ivr', 'queue', 'ai']),
    route_target_ref: zod_1.z.string(),
    label: zod_1.z.string(),
    active: zod_1.z.boolean().default(true),
    store_id: zod_1.z.string().uuid().optional()
});
// Create Extension Request
exports.CreateExtensionRequestSchema = zod_1.z.object({
    ext_number: zod_1.z.string().regex(/^[0-9]{3,6}$/),
    display_name: zod_1.z.string(),
    enabled: zod_1.z.boolean().default(true),
    voicemail_enabled: zod_1.z.boolean().default(false),
    forward_rules: zod_1.z.record(zod_1.z.string()).optional(),
    class_of_service: zod_1.z.enum(['agent', 'supervisor', 'admin']).default('agent'),
    note: zod_1.z.string().optional(),
    store_id: zod_1.z.string().uuid().optional()
});
// Create Route Request
exports.CreateRouteRequestSchema = zod_1.z.object({
    name: zod_1.z.string(),
    pattern: zod_1.z.string(),
    strip_digits: zod_1.z.number().min(0).default(0),
    prepend: zod_1.z.string().optional(),
    trunk_id: zod_1.z.string().uuid(),
    priority: zod_1.z.number().min(1).default(1),
    active: zod_1.z.boolean().default(true)
});
// Create Contact Policy Request
exports.CreateContactPolicyRequestSchema = zod_1.z.object({
    scope_type: zod_1.z.enum(['tenant', 'store', 'did', 'ext']),
    scope_ref: zod_1.z.string(),
    rules_json: zod_1.z.record(zod_1.z.any()),
    label: zod_1.z.string(),
    active: zod_1.z.boolean().default(true)
});
//# sourceMappingURL=w3-voip.js.map