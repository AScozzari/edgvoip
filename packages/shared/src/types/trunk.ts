import { z } from 'zod';

// SIP Trunk schema
export const SipTrunkSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  provider: z.string().min(1).max(100),
  status: z.enum(['active', 'inactive', 'testing']),
  created_at: z.date(),
  updated_at: z.date(),
  
  // SIP Configuration
  sip_config: z.object({
    host: z.string().min(1),
    port: z.number().min(1).max(65535).default(5060),
    transport: z.enum(['udp', 'tcp', 'tls']).default('udp'),
    username: z.string().min(1),
    password: z.string().min(1),
    realm: z.string().optional(),
    from_user: z.string().optional(),
    from_domain: z.string().optional(),
    register: z.boolean().default(true),
    register_proxy: z.string().optional(),
    register_transport: z.enum(['udp', 'tcp', 'tls']).optional(),
    retry_seconds: z.number().min(30).max(3600).default(60),
    caller_id_in_from: z.boolean().default(false),
    contact_params: z.string().optional(),
    ping: z.boolean().default(true),
    ping_time: z.number().min(30).max(300).default(60)
  }),
  
  // DID Configuration
  did_config: z.object({
    number: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
    country_code: z.string().length(2), // ISO 3166-1 alpha-2
    area_code: z.string().optional(),
    local_number: z.string().min(1),
    provider_did: z.string().optional(),
    inbound_route: z.string().optional()
  }),
  
  // Security & Compliance
  security: z.object({
    encryption: z.enum(['none', 'tls', 'srtp']).default('tls'),
    authentication: z.enum(['none', 'digest', 'tls']).default('digest'),
    acl: z.array(z.string()).default([]), // IP whitelist
    rate_limit: z.object({
      enabled: z.boolean().default(true),
      calls_per_minute: z.number().min(1).max(1000).default(60),
      calls_per_hour: z.number().min(1).max(10000).default(1000)
    })
  }),
  
  // GDPR Compliance
  gdpr: z.object({
    data_retention_days: z.number().min(30).max(2555).default(365), // 1 year max
    recording_consent_required: z.boolean().default(true),
    data_processing_purpose: z.string().default('Business communications'),
    lawful_basis: z.enum(['consent', 'contract', 'legitimate_interest']).default('legitimate_interest'),
    data_controller: z.string().min(1),
    dpo_contact: z.string().email().optional()
  })
});

export type SipTrunk = z.infer<typeof SipTrunkSchema>;

// Trunk registration form schema (for UI)
export const TrunkRegistrationSchema = z.object({
  // Basic Info
  name: z.string().min(1, 'Nome trunk richiesto').max(100),
  provider: z.string().min(1, 'Provider richiesto').max(100),
  
  // SIP Settings
  host: z.string().min(1, 'Host SIP richiesto'),
  port: z.number().min(1).max(65535).default(5060),
  transport: z.enum(['udp', 'tcp', 'tls']).default('udp'),
  username: z.string().min(1, 'Username SIP richiesto'),
  password: z.string().min(1, 'Password SIP richiesta'),
  realm: z.string().optional(),
  
  // DID Settings
  number: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Formato numero non valido (E.164)'),
  country_code: z.string().length(2, 'Codice paese richiesto (2 caratteri)'),
  local_number: z.string().min(1, 'Numero locale richiesto'),
  
  // Security
  encryption: z.enum(['none', 'tls', 'srtp']).default('tls'),
  authentication: z.enum(['none', 'digest', 'tls']).default('digest'),
  
  // GDPR Compliance
  data_retention_days: z.number().min(30).max(2555).default(365),
  recording_consent_required: z.boolean().default(true),
  data_controller: z.string().min(1, 'Titolare del trattamento richiesto'),
  dpo_contact: z.string().email('Email DPO non valida').optional(),
  
  // Terms acceptance
  gdpr_consent: z.boolean().refine(val => val === true, 'Consenso GDPR richiesto'),
  terms_accepted: z.boolean().refine(val => val === true, 'Termini e condizioni richiesti')
});

export type TrunkRegistration = z.infer<typeof TrunkRegistrationSchema>;

