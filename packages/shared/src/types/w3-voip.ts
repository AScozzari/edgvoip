import { z } from 'zod';

// ===== VOIP TRUNKS =====
export const VoipTrunkSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  sip_domain: z.string(), // es. tenantA.pbx.w3suite.it
  provider: z.string(), // nome carrier (es. Messagenet)
  proxy: z.string(), // host/realm del registrar (es. sip.messagenet.it)
  port: z.number().min(1).max(65535).default(5060),
  transport: z.enum(['udp', 'tcp', 'tls']).default('udp'),
  auth_username: z.string(), // user/URI del trunk
  secret_ref: z.string(), // riferimento a segreto (vault/KMS)
  register: z.boolean().default(true), // registrato o IP auth
  expiry_seconds: z.number().min(60).max(3600).default(300),
  codec_set: z.string().default('G729,PCMA,PCMU'), // priorità codec verso carrier
  status: z.enum(['REG_OK', 'FAIL', 'UNKNOWN']).default('UNKNOWN'),
  note: z.string().optional()
});

export type VoipTrunk = z.infer<typeof VoipTrunkSchema>;

// ===== VOIP DIDS =====
export const VoipDidSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  trunk_id: z.string().uuid(), // riferimento al trunk d'ingresso
  e164: z.string().regex(/^\+[1-9]\d{1,14}$/), // numero in formato E.164
  sip_domain: z.string().optional(), // dominio PBX (utile per lookup)
  route_target_type: z.enum(['ext', 'ivr', 'queue', 'ai']), // destinazione
  route_target_ref: z.string(), // riferimento concreto (es. 1001 o ivr_main)
  label: z.string(), // alias descrittivo (es. "Main Line Roma")
  active: z.boolean().default(true)
});

export type VoipDid = z.infer<typeof VoipDidSchema>;

// ===== VOIP EXTENSIONS =====
export const VoipExtensionSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  sip_domain: z.string(), // dominio PBX del tenant
  ext_number: z.string().regex(/^[0-9]{3,6}$/), // numero interno (unico nel dominio)
  display_name: z.string(), // nome mostrato (caller name)
  enabled: z.boolean().default(true), // registrabile e chiamabile
  voicemail_enabled: z.boolean().default(false), // se abilita VM
  forward_rules: z.record(z.string()).optional(), // JSON semplice (busy/no-answer/off-hours → target)
  class_of_service: z.enum(['agent', 'supervisor', 'admin']).default('agent'), // profilo chiamate consentite
  note: z.string().optional() // testo libero (info/HR)
});

export type VoipExtension = z.infer<typeof VoipExtensionSchema>;

// ===== VOIP ROUTES =====
export const VoipRouteSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(), // nome rotta (es. "Uscita nazionale")
  pattern: z.string(), // regex/pattern (es. ^9(\d+)$)
  strip_digits: z.number().min(0).default(0), // numeri da rimuovere (es. 1 per togliere il 9)
  prepend: z.string().optional(), // prefisso da aggiungere (es. 0)
  trunk_id: z.string().uuid(), // trunk da usare per l'uscita
  priority: z.number().min(1).default(1), // ordine di valutazione
  active: z.boolean().default(true)
});

export type VoipRoute = z.infer<typeof VoipRouteSchema>;

// ===== CONTACT POLICIES =====
export const ContactPolicySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  scope_type: z.enum(['tenant', 'store', 'did', 'ext']), // ambito applicazione
  scope_ref: z.string(), // id di riferimento (es. store_id o e164 o ext)
  rules_json: z.record(z.any()), // JSON con orari apertura/chiusura, fallback (VM/AI/queue), annunci
  active: z.boolean().default(true),
  label: z.string() // alias descrittivo (es. "Orari Roma")
});

export type ContactPolicy = z.infer<typeof ContactPolicySchema>;

// ===== VOIP ACTIVITY LOG =====
export const VoipActivityLogSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  actor: z.string(), // user:<id> o system:w3-provisioner
  action: z.enum(['create', 'update', 'delete', 'provision', 'sync']),
  target_type: z.enum(['trunk', 'did', 'ext', 'route', 'policy']),
  target_id: z.string().uuid(),
  status: z.enum(['ok', 'fail']),
  details_json: z.record(z.any()).optional(), // payload/diff/esito chiamate API verso PBX
  ts: z.string().datetime() // timestamp evento (UTC)
});

export type VoipActivityLog = z.infer<typeof VoipActivityLogSchema>;

// ===== VOIP CDR =====
export const VoipCdrSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  sip_domain: z.string(), // dominio PBX (per correlazione multi-tenant)
  call_id: z.string(), // ID chiamata PBX
  direction: z.enum(['in', 'out']),
  from_uri: z.string(), // sorgente (E.164 o ext)
  to_uri: z.string(), // destinazione (E.164 o ext)
  did_e164: z.string().optional(), // DID coinvolto (se inbound)
  ext_number: z.string().optional(), // interno coinvolto (se presente)
  start_ts: z.string().datetime(),
  answer_ts: z.string().datetime().optional(),
  end_ts: z.string().datetime(),
  billsec: z.number().min(0).default(0), // secondi fatturati
  disposition: z.enum(['ANSWERED', 'NO_ANSWER', 'BUSY', 'FAILED']),
  recording_url: z.string().url().optional(), // link alla registrazione (se disponibile)
  meta_json: z.record(z.any()).optional() // extra (codec, mos, cause codes)
});

export type VoipCdr = z.infer<typeof VoipCdrSchema>;

// ===== API REQUEST/RESPONSE TYPES =====

// Create Trunk Request
export const CreateTrunkRequestSchema = z.object({
  provider: z.string(),
  proxy: z.string(),
  port: z.number().min(1).max(65535).default(5060),
  transport: z.enum(['udp', 'tcp', 'tls']).default('udp'),
  auth_username: z.string(),
  secret_ref: z.string(),
  register: z.boolean().default(true),
  expiry_seconds: z.number().min(60).max(3600).default(300),
  codec_set: z.string().default('G729,PCMA,PCMU'),
  note: z.string().optional(),
  store_id: z.string().uuid().optional()
});

export type CreateTrunkRequest = z.infer<typeof CreateTrunkRequestSchema>;

// Create DID Request
export const CreateDidRequestSchema = z.object({
  trunk_id: z.string().uuid(),
  e164: z.string().regex(/^\+[1-9]\d{1,14}$/),
  route_target_type: z.enum(['ext', 'ivr', 'queue', 'ai']),
  route_target_ref: z.string(),
  label: z.string(),
  active: z.boolean().default(true),
  store_id: z.string().uuid().optional()
});

export type CreateDidRequest = z.infer<typeof CreateDidRequestSchema>;

// Create Extension Request
export const CreateExtensionRequestSchema = z.object({
  ext_number: z.string().regex(/^[0-9]{3,6}$/),
  display_name: z.string(),
  enabled: z.boolean().default(true),
  voicemail_enabled: z.boolean().default(false),
  forward_rules: z.record(z.string()).optional(),
  class_of_service: z.enum(['agent', 'supervisor', 'admin']).default('agent'),
  note: z.string().optional(),
  store_id: z.string().uuid().optional()
});

export type CreateExtensionRequest = z.infer<typeof CreateExtensionRequestSchema>;

// Create Route Request
export const CreateRouteRequestSchema = z.object({
  name: z.string(),
  pattern: z.string(),
  strip_digits: z.number().min(0).default(0),
  prepend: z.string().optional(),
  trunk_id: z.string().uuid(),
  priority: z.number().min(1).default(1),
  active: z.boolean().default(true)
});

export type CreateRouteRequest = z.infer<typeof CreateRouteRequestSchema>;

// Create Contact Policy Request
export const CreateContactPolicyRequestSchema = z.object({
  scope_type: z.enum(['tenant', 'store', 'did', 'ext']),
  scope_ref: z.string(),
  rules_json: z.record(z.any()),
  label: z.string(),
  active: z.boolean().default(true)
});

export type CreateContactPolicyRequest = z.infer<typeof CreateContactPolicyRequestSchema>;
