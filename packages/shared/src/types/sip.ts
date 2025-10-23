import { z } from 'zod';

// SIP Registration Status
export const SipRegistrationStatusSchema = z.enum([
  'registered',
  'unregistered', 
  'failed',
  'expired',
  'unknown'
]);

export type SipRegistrationStatus = z.infer<typeof SipRegistrationStatusSchema>;

// SIP Extension Configuration
export const SipExtensionConfigSchema = z.object({
  // Basic Settings
  extension: z.string().regex(/^[0-9]{3,6}$/),
  password: z.string().min(8).max(32),
  display_name: z.string().min(1).max(100),
  
  // Tenant Context (auto-populated)
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  realm: z.string(), // Auto-populated: tenant.sip_domain
  
  // SIP Settings
  sip_settings: z.object({
    auth_username: z.string().optional(),
    auth_password: z.string().optional(),
    caller_id_name: z.string().optional(),
    caller_id_number: z.string().optional(),
    context: z.string().default('default'),
    host: z.string().default('dynamic'),
    type: z.enum(['friend', 'user', 'peer']).default('friend'),
    nat: z.enum(['force_rport', 'comedia', 'auto_force_rport', 'auto_comedia']).default('force_rport'),
    qualify: z.boolean().default(true),
    qualify_freq: z.number().min(30).max(300).default(60),
    canreinvite: z.boolean().default(false),
    dtmfmode: z.enum(['rfc2833', 'inband', 'info']).default('rfc2833'),
    disallow: z.array(z.string()).default(['all']),
    allow: z.array(z.string()).default(['ulaw', 'alaw', 'g729', 'g722']),
    directmedia: z.boolean().default(false),
    trustrpid: z.boolean().default(false),
    sendrpid: z.boolean().default(false),
    callgroup: z.string().optional(),
    pickupgroup: z.string().optional(),
    musicclass: z.string().default('default'),
    mohsuggest: z.string().default('default'),
    parkinglot: z.string().optional(),
    hasvoicemail: z.boolean().default(true),
    mailbox: z.string().optional(),
    attach: z.string().optional(),
    cid_masquerade: z.string().optional(),
    callingpres: z.enum(['allowed_not_screened', 'allowed_passed_screen', 'allowed_failed_screen', 'allowed', 'prohib_not_screened', 'prohib_passed_screen', 'prohib_failed_screen', 'prohib']).default('allowed_not_screened'),
    restrictcid: z.boolean().default(false),
    outboundcid: z.string().optional(),
    language: z.string().default('en'),
    accountcode: z.string().optional(),
    amaflags: z.enum(['default', 'omit', 'billing', 'documentation']).default('default'),
    callcounter: z.boolean().default(false),
    busylevel: z.number().min(1).max(100).default(1),
    ringinuse: z.boolean().default(false),
    setvar: z.array(z.string()).default([]),
    useragent: z.string().optional(),
    lastms: z.number().optional(),
    regserver: z.string().optional(),
    regseconds: z.number().optional(),
    fullcontact: z.string().optional(),
    ipaddr: z.string().optional(),
    port: z.number().optional(),
    username: z.string().optional(),
    defaultip: z.string().optional(),
    defaultuser: z.string().optional(),
    secret: z.string().optional(),
    regexten: z.string().optional(),
    vmexten: z.string().optional(),
    callbackextension: z.string().optional(),
    namedcallgroup: z.string().optional(),
    namedpickupgroup: z.string().optional(),
    namedcontext: z.string().optional(),
    subscribecontext: z.string().optional(),
    musiconhold: z.string().optional(),
    permit: z.string().optional(),
    deny: z.string().optional(),
    calllimit: z.number().optional(),
    rtpkeepalive: z.number().default(0),
    rtp_timeout: z.number().default(60),
    rtp_hold_timeout: z.number().default(300),
    rfc2833compensate: z.boolean().default(false),
    session_timers: z.boolean().default(false),
    session_expires: z.number().default(1800),
    session_minse: z.number().default(90),
    session_refresher: z.enum(['uac', 'uas']).default('uas'),
    t38pt_udptl: z.boolean().default(false),
    t38pt_rtp: z.boolean().default(false),
    t38pt_tcp: z.boolean().default(false),
    t38pt_usertpsource: z.string().optional(),
    t38pt_rtp_udptl: z.boolean().default(false),
    faxdetect_audio: z.boolean().default(false),
    faxdetect_modem: z.boolean().default(false),
    faxdetect_ced: z.boolean().default(false),
    faxdetect_cng: z.boolean().default(false),
    faxdetect_audio_silence_threshold: z.number().default(128),
    faxdetect_audio_silence_duration: z.number().default(2000),
    faxdetect_audio_energy_threshold: z.number().default(128),
    faxdetect_audio_energy_duration: z.number().default(2000),
    faxdetect_modem_silence_threshold: z.number().default(128),
    faxdetect_modem_silence_duration: z.number().default(2000),
    faxdetect_modem_energy_threshold: z.number().default(128),
    faxdetect_modem_energy_duration: z.number().default(2000),
    faxdetect_ced_silence_threshold: z.number().default(128),
    faxdetect_ced_silence_duration: z.number().default(2000),
    faxdetect_ced_energy_threshold: z.number().default(128),
    faxdetect_ced_energy_duration: z.number().default(2000),
    faxdetect_cng_silence_threshold: z.number().default(128),
    faxdetect_cng_silence_duration: z.number().default(2000),
    faxdetect_cng_energy_threshold: z.number().default(128),
    faxdetect_cng_energy_duration: z.number().default(2000)
  }),
  
  // Call Features
  call_features: z.object({
    call_forwarding: z.object({
      enabled: z.boolean().default(false),
      destination: z.string().optional(),
      no_answer_timeout: z.number().min(5).max(60).default(20),
      busy_destination: z.string().optional(),
      unavailable_destination: z.string().optional()
    }),
    call_waiting: z.object({
      enabled: z.boolean().default(true),
      tone_frequency: z.number().default(440),
      tone_duration: z.number().default(200)
    }),
    do_not_disturb: z.object({
      enabled: z.boolean().default(false),
      message: z.string().default('User is not available')
    }),
    voicemail: z.object({
      enabled: z.boolean().default(true),
      password: z.string().optional(),
      email_notification: z.boolean().default(false),
      email_address: z.string().email().optional(),
      delete_after_email: z.boolean().default(false),
      attach_audio: z.boolean().default(true),
      max_messages: z.number().min(1).max(1000).default(100),
      max_message_length: z.number().min(30).max(600).default(300)
    }),
    recording: z.object({
      enabled: z.boolean().default(false),
      auto_record: z.boolean().default(false),
      record_internal: z.boolean().default(false),
      record_external: z.boolean().default(true),
      consent_required: z.boolean().default(true)
    })
  }),
  
  // Security Settings
  security: z.object({
    ip_whitelist: z.array(z.string()).default([]),
    ip_blacklist: z.array(z.string()).default([]),
    max_concurrent_calls: z.number().min(1).max(10).default(3),
    password_expiry_days: z.number().min(30).max(365).default(90),
    require_secure_rtp: z.boolean().default(false),
    encryption_method: z.enum(['none', 'srtp', 'zrtp']).default('none')
  }),
  
  // Advanced Settings
  advanced: z.object({
    custom_headers: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).default([]),
    custom_variables: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).default([]),
    dialplan_context: z.string().default('default'),
    outbound_proxy: z.string().optional(),
    transport: z.enum(['udp', 'tcp', 'tls', 'ws', 'wss']).default('udp'),
    local_net: z.string().default('192.168.0.0/16'),
    externip: z.string().optional(),
    externhost: z.string().optional(),
    externrefresh: z.number().default(10)
  })
});

export type SipExtensionConfig = z.infer<typeof SipExtensionConfigSchema>;

// SIP Trunk Configuration
export const SipTrunkConfigSchema = z.object({
  // Basic Settings
  name: z.string().min(1).max(100),
  host: z.string(),
  port: z.number().min(1).max(65535).default(5060),
  username: z.string().optional(),
  password: z.string().optional(),
  from_user: z.string().optional(),
  from_domain: z.string(), // Auto-populated: tenant.sip_domain
  
  // Tenant Context (auto-populated)
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  
  // SIP Settings
  sip_settings: z.object({
    type: z.enum(['friend', 'user', 'peer']).default('peer'),
    context: z.string().default('from-trunk'),
    host: z.string(),
    port: z.number().default(5060),
    username: z.string().optional(),
    secret: z.string().optional(),
    fromuser: z.string().optional(),
    fromdomain: z.string().optional(),
    callerid: z.string().optional(),
    calleridname: z.string().optional(),
    calleridpres: z.enum(['allowed_not_screened', 'allowed_passed_screen', 'allowed_failed_screen', 'allowed', 'prohib_not_screened', 'prohib_passed_screen', 'prohib_failed_screen', 'prohib']).default('allowed_not_screened'),
    nat: z.enum(['force_rport', 'comedia', 'auto_force_rport', 'auto_comedia']).default('force_rport'),
    qualify: z.boolean().default(true),
    qualifyfreq: z.number().min(30).max(300).default(60),
    canreinvite: z.boolean().default(false),
    dtmfmode: z.enum(['rfc2833', 'inband', 'info']).default('rfc2833'),
    disallow: z.array(z.string()).default(['all']),
    allow: z.array(z.string()).default(['ulaw', 'alaw', 'g729', 'g722']),
    directmedia: z.boolean().default(false),
    trustrpid: z.boolean().default(false),
    sendrpid: z.boolean().default(false),
    callgroup: z.string().optional(),
    pickupgroup: z.string().optional(),
    musicclass: z.string().default('default'),
    mohsuggest: z.string().default('default'),
    parkinglot: z.string().optional(),
    hasvoicemail: z.boolean().default(false),
    mailbox: z.string().optional(),
    attach: z.string().optional(),
    cid_masquerade: z.string().optional(),
    callingpres: z.enum(['allowed_not_screened', 'allowed_passed_screen', 'allowed_failed_screen', 'allowed', 'prohib_not_screened', 'prohib_passed_screen', 'prohib_failed_screen', 'prohib']).default('allowed_not_screened'),
    restrictcid: z.boolean().default(false),
    outboundcid: z.string().optional(),
    language: z.string().default('en'),
    accountcode: z.string().optional(),
    amaflags: z.enum(['default', 'omit', 'billing', 'documentation']).default('default'),
    callcounter: z.boolean().default(false),
    busylevel: z.number().min(1).max(100).default(1),
    ringinuse: z.boolean().default(false),
    setvar: z.array(z.string()).default([]),
    useragent: z.string().optional(),
    lastms: z.number().optional(),
    regserver: z.string().optional(),
    regseconds: z.number().optional(),
    fullcontact: z.string().optional(),
    ipaddr: z.string().optional(),
    defaultip: z.string().optional(),
    defaultuser: z.string().optional(),
    regexten: z.string().optional(),
    vmexten: z.string().optional(),
    callbackextension: z.string().optional(),
    namedcallgroup: z.string().optional(),
    namedpickupgroup: z.string().optional(),
    namedcontext: z.string().optional(),
    subscribecontext: z.string().optional(),
    musiconhold: z.string().optional(),
    permit: z.string().optional(),
    deny: z.string().optional(),
    calllimit: z.number().optional(),
    rtpkeepalive: z.number().default(0),
    rtp_timeout: z.number().default(60),
    rtp_hold_timeout: z.number().default(300),
    rfc2833compensate: z.boolean().default(false),
    session_timers: z.boolean().default(false),
    session_expires: z.number().default(1800),
    session_minse: z.number().default(90),
    session_refresher: z.enum(['uac', 'uas']).default('uas'),
    t38pt_udptl: z.boolean().default(false),
    t38pt_rtp: z.boolean().default(false),
    t38pt_tcp: z.boolean().default(false),
    t38pt_usertpsource: z.string().optional(),
    t38pt_rtp_udptl: z.boolean().default(false)
  }),
  
  // Registration Settings
  registration: z.object({
    enabled: z.boolean().default(false),
    auth_username: z.string().optional(),
    auth_password: z.string().optional(),
    auth_realm: z.string().optional(),
    refresh_interval: z.number().min(30).max(3600).default(300),
    retry_interval: z.number().min(10).max(300).default(60),
    max_retries: z.number().min(1).max(10).default(3),
    expire: z.number().min(60).max(3600).default(3600)
  }),
  
  // Security Settings
  security: z.object({
    ip_whitelist: z.array(z.string()).default([]),
    ip_blacklist: z.array(z.string()).default([]),
    max_concurrent_calls: z.number().min(1).max(100).default(10),
    require_secure_rtp: z.boolean().default(false),
    encryption_method: z.enum(['none', 'srtp', 'zrtp']).default('none'),
    authentication: z.enum(['none', 'md5', 'sha1']).default('md5')
  }),
  
  // Advanced Settings
  advanced: z.object({
    custom_headers: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).default([]),
    custom_variables: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).default([]),
    dialplan_context: z.string().default('from-trunk'),
    outbound_proxy: z.string().optional(),
    transport: z.enum(['udp', 'tcp', 'tls', 'ws', 'wss']).default('udp'),
    local_net: z.string().default('192.168.0.0/16'),
    externip: z.string().optional(),
    externhost: z.string().optional(),
    externrefresh: z.number().default(10)
  })
});

export type SipTrunkConfig = z.infer<typeof SipTrunkConfigSchema>;

// Call Routing Rules
export const CallRoutingRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  priority: z.number().min(1).max(1000).default(100),
  enabled: z.boolean().default(true),
  
  // Matching Conditions
  conditions: z.object({
    caller_id: z.object({
      number: z.string().optional(),
      name: z.string().optional(),
      pattern: z.string().optional()
    }).optional(),
    called_number: z.object({
      number: z.string().optional(),
      pattern: z.string().optional()
    }).optional(),
    time_conditions: z.object({
      enabled: z.boolean().default(false),
      timezone: z.string().default('Europe/Rome'),
      schedule: z.record(z.object({
        enabled: z.boolean().default(true),
        start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      }))
    }).optional(),
    day_conditions: z.object({
      enabled: z.boolean().default(false),
      days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).default(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
    }).optional(),
    source: z.object({
      trunk_id: z.string().uuid().optional(),
      extension_id: z.string().uuid().optional(),
      ip_address: z.string().optional()
    }).optional(),
    destination: z.object({
      trunk_id: z.string().uuid().optional(),
      extension_id: z.string().uuid().optional(),
      external_number: z.string().optional()
    }).optional()
  }),
  
  // Actions
  actions: z.object({
    route_to: z.object({
      type: z.enum(['extension', 'trunk', 'external', 'voicemail', 'hangup', 'busy', 'congestion']),
      target: z.string(), // extension number, trunk name, external number, etc.
      timeout: z.number().min(5).max(300).default(30)
    }),
    call_forwarding: z.object({
      enabled: z.boolean().default(false),
      destination: z.string().optional(),
      timeout: z.number().min(5).max(60).default(20)
    }).optional(),
    recording: z.object({
      enabled: z.boolean().default(false),
      consent_required: z.boolean().default(true)
    }).optional(),
    cdr_tag: z.string().optional(),
    custom_variables: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).default([])
  }),
  
  // Metadata
  created_at: z.date(),
  updated_at: z.date(),
  created_by: z.string().uuid(),
  tenant_id: z.string().uuid()
});

export type CallRoutingRule = z.infer<typeof CallRoutingRuleSchema>;

// SIP Registration Status
export const SipRegistrationStatusInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['extension', 'trunk']),
  status: SipRegistrationStatusSchema,
  last_registration: z.date().optional(),
  last_unregistration: z.date().optional(),
  registration_attempts: z.number().default(0),
  last_error: z.string().optional(),
  ip_address: z.string().optional(),
  port: z.number().optional(),
  user_agent: z.string().optional(),
  expires: z.number().optional(),
  contact: z.string().optional(),
  tenant_id: z.string().uuid()
});

export type SipRegistrationStatusInfo = z.infer<typeof SipRegistrationStatusInfoSchema>;

// Inbound Route
export const InboundRouteSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  did_number: z.string().min(1).max(20), // Direct Inward Dialing number
  caller_id_name: z.string().optional(),
  caller_id_number: z.string().optional(),
  destination_type: z.enum(['extension', 'ring_group', 'queue', 'voicemail', 'ivr', 'conference', 'external']),
  destination_value: z.string(), // Extension number, ring group ID, etc.
  time_condition_id: z.string().uuid().optional(), // Reference to time condition
  enabled: z.boolean().default(true),
  // Advanced options
  caller_id_override: z.boolean().default(false),
  caller_id_name_override: z.string().optional(),
  caller_id_number_override: z.string().optional(),
  // Recording
  record_calls: z.boolean().default(false),
  recording_path: z.string().optional(),
  // Failover
  failover_enabled: z.boolean().default(false),
  failover_destination_type: z.enum(['extension', 'voicemail', 'external']).optional(),
  failover_destination_value: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type InboundRoute = z.infer<typeof InboundRouteSchema>;

// Outbound Route
export const OutboundRouteSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  dial_pattern: z.string().min(1).max(50), // Regex pattern for matching numbers
  caller_id_name: z.string().optional(),
  caller_id_number: z.string().optional(),
  trunk_id: z.string().uuid(), // Reference to SIP trunk
  prefix: z.string().optional(), // Prefix to add to dialed number
  strip_digits: z.number().int().min(0).default(0), // Digits to strip from beginning
  add_digits: z.string().optional(), // Digits to add to beginning
  enabled: z.boolean().default(true),
  // Advanced options
  caller_id_override: z.boolean().default(false),
  caller_id_name_override: z.string().optional(),
  caller_id_number_override: z.string().optional(),
  // Recording
  record_calls: z.boolean().default(false),
  recording_path: z.string().optional(),
  // Failover
  failover_trunk_id: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type OutboundRoute = z.infer<typeof OutboundRouteSchema>;

// Time Condition
export const TimeConditionSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  timezone: z.string().default('UTC'),
  // Business hours
  business_hours: z.object({
    monday: z.object({
      enabled: z.boolean().default(true),
      start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
      end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }).optional(),
    tuesday: z.object({
      enabled: z.boolean().default(true),
      start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }).optional(),
    wednesday: z.object({
      enabled: z.boolean().default(true),
      start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }).optional(),
    thursday: z.object({
      enabled: z.boolean().default(true),
      start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }).optional(),
    friday: z.object({
      enabled: z.boolean().default(true),
      start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }).optional(),
    saturday: z.object({
      enabled: z.boolean().default(false),
      start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }).optional(),
    sunday: z.object({
      enabled: z.boolean().default(false),
      start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }).optional(),
  }),
  // Holidays
  holidays: z.array(z.object({
    name: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
    enabled: z.boolean().default(true),
  })).default([]),
  // Actions
  business_hours_action: z.enum(['continue', 'voicemail', 'external', 'hangup']).default('continue'),
  business_hours_destination: z.string().optional(),
  after_hours_action: z.enum(['voicemail', 'external', 'hangup']).default('voicemail'),
  after_hours_destination: z.string().optional(),
  holiday_action: z.enum(['voicemail', 'external', 'hangup']).default('voicemail'),
  holiday_destination: z.string().optional(),
  enabled: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type TimeCondition = z.infer<typeof TimeConditionSchema>;

// IVR Menu
export const IvrMenuSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  greeting_message: z.string().optional(), // Text-to-speech or audio file
  invalid_message: z.string().optional(),
  timeout_message: z.string().optional(),
  timeout_seconds: z.number().int().min(1).max(60).default(10),
  max_failures: z.number().int().min(1).max(10).default(3),
  // Menu options (0-9, *, #)
  options: z.array(z.object({
    digit: z.string().length(1), // 0-9, *, #
    action: z.enum(['extension', 'ring_group', 'queue', 'voicemail', 'ivr', 'conference', 'external', 'hangup']),
    destination: z.string(), // Extension number, ring group ID, etc.
    description: z.string().optional(),
  })).max(12), // Maximum 12 options (0-9, *, #)
  // Default action when no digit is pressed
  default_action: z.enum(['extension', 'ring_group', 'queue', 'voicemail', 'ivr', 'conference', 'external', 'hangup']).default('hangup'),
  default_destination: z.string().optional(),
  // Advanced options
  caller_id_override: z.boolean().default(false),
  caller_id_name_override: z.string().optional(),
  caller_id_number_override: z.string().optional(),
  // Recording
  record_calls: z.boolean().default(false),
  recording_path: z.string().optional(),
  enabled: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type IvrMenu = z.infer<typeof IvrMenuSchema>;

// Ring Group
export const RingGroupSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  extension_number: z.string().min(3).max(10), // e.g., "2001"
  strategy: z.enum(['simultaneous', 'sequential', 'round_robin', 'random', 'longest_idle']).default('simultaneous'),
  timeout: z.number().int().min(5).max(300).default(30), // seconds
  max_calls: z.number().int().min(1).max(100).default(10),
  // Members
  members: z.array(z.object({
    extension_id: z.string().uuid(),
    extension_number: z.string(),
    display_name: z.string(),
    priority: z.number().int().min(1).max(100).default(1),
    enabled: z.boolean().default(true),
    delay: z.number().int().min(0).max(60).default(0), // seconds delay for sequential
  })),
  // Advanced options
  caller_id_override: z.boolean().default(false),
  caller_id_name_override: z.string().optional(),
  caller_id_number_override: z.string().optional(),
  // Recording
  record_calls: z.boolean().default(false),
  recording_path: z.string().optional(),
  // Failover
  failover_enabled: z.boolean().default(false),
  failover_destination_type: z.enum(['extension', 'voicemail', 'external']).optional(),
  failover_destination_value: z.string().optional(),
  // Time conditions
  time_condition_id: z.string().uuid().optional(),
  enabled: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type RingGroup = z.infer<typeof RingGroupSchema>;

// Queue (Call Center Queue)
export const QueueSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  extension_number: z.string().min(3).max(10), // e.g., "3001"
  strategy: z.enum(['ring_all', 'longest_idle', 'round_robin', 'top_down', 'agent_with_least_calls', 'agent_with_fewest_calls', 'sequentially_by_agent_order', 'random']).default('longest_idle'),
  timeout: z.number().int().min(5).max(300).default(30), // seconds
  max_calls: z.number().int().min(1).max(1000).default(100),
  // Queue settings
  hold_music: z.string().optional(), // Music on hold class
  announce_frequency: z.number().int().min(0).max(300).default(0), // seconds, 0 = no announcements
  announce_position: z.boolean().default(false),
  announce_hold_time: z.boolean().default(false),
  // Agents
  agents: z.array(z.object({
    extension_id: z.string().uuid(),
    extension_number: z.string(),
    display_name: z.string(),
    penalty: z.number().int().min(0).max(100).default(0), // lower = higher priority
    enabled: z.boolean().default(true),
    max_calls: z.number().int().min(1).max(10).default(1),
  })),
  // Advanced options
  caller_id_override: z.boolean().default(false),
  caller_id_name_override: z.string().optional(),
  caller_id_number_override: z.string().optional(),
  // Recording
  record_calls: z.boolean().default(false),
  recording_path: z.string().optional(),
  // Failover
  failover_enabled: z.boolean().default(false),
  failover_destination_type: z.enum(['extension', 'voicemail', 'external']).optional(),
  failover_destination_value: z.string().optional(),
  // Time conditions
  time_condition_id: z.string().uuid().optional(),
  enabled: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Queue = z.infer<typeof QueueSchema>;

// Conference Room
export const ConferenceRoomSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  extension_number: z.string().min(3).max(10), // e.g., "4001"
  pin: z.string().optional(), // PIN for joining
  moderator_pin: z.string().optional(), // PIN for moderator
  max_members: z.number().int().min(2).max(1000).default(10),
  // Conference settings
  record_conference: z.boolean().default(false),
  recording_path: z.string().optional(),
  mute_on_join: z.boolean().default(false),
  announce_join_leave: z.boolean().default(true),
  hold_music: z.string().optional(),
  // Advanced options
  caller_id_override: z.boolean().default(false),
  caller_id_name_override: z.string().optional(),
  caller_id_number_override: z.string().optional(),
  // Time conditions
  time_condition_id: z.string().uuid().optional(),
  enabled: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ConferenceRoom = z.infer<typeof ConferenceRoomSchema>;

// Voicemail Box
export const VoicemailBoxSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  extension_number: z.string().min(3).max(10),
  password: z.string().min(4).max(20),
  display_name: z.string().min(1).max(100),
  email_address: z.string().email().optional(),
  // Voicemail settings
  max_messages: z.number().int().min(1).max(1000).default(100),
  max_message_length: z.number().int().min(30).max(600).default(300), // seconds
  delete_after_email: z.boolean().default(false),
  attach_audio: z.boolean().default(true),
  email_notification: z.boolean().default(true),
  // Greeting
  greeting_type: z.enum(['default', 'custom', 'none']).default('default'),
  custom_greeting_path: z.string().optional(),
  // Advanced options
  caller_id_override: z.boolean().default(false),
  caller_id_name_override: z.string().optional(),
  caller_id_number_override: z.string().optional(),
  enabled: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type VoicemailBox = z.infer<typeof VoicemailBoxSchema>;

// FreeSWITCH Dialplan Context
export const DialplanContextSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(50), // e.g., "default", "from-trunk", "from-internal"
  description: z.string().optional(),
  // Context settings
  continue_on_fail: z.boolean().default(false),
  break_on_fail: z.boolean().default(false),
  // Extensions in this context
  extensions: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    condition: z.string(), // FreeSWITCH condition
    action: z.string(), // FreeSWITCH action
    anti_action: z.string().optional(),
    enabled: z.boolean().default(true),
  })),
  enabled: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type DialplanContext = z.infer<typeof DialplanContextSchema>;

// OpenSIPS Route
export const OpenSipsRouteSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(1000).default(100),
  // Route conditions
  conditions: z.array(z.object({
    type: z.enum(['method', 'uri', 'from_uri', 'to_uri', 'src_ip', 'dst_ip', 'port', 'user_agent', 'custom_header']),
    operator: z.enum(['equals', 'contains', 'regex', 'starts_with', 'ends_with']),
    value: z.string(),
    enabled: z.boolean().default(true),
  })),
  // Route actions
  actions: z.array(z.object({
    type: z.enum(['forward', 'redirect', 'reject', 'drop', 'log', 'set_header', 'remove_header', 'set_variable']),
    value: z.string(),
    enabled: z.boolean().default(true),
  })),
  enabled: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type OpenSipsRoute = z.infer<typeof OpenSipsRouteSchema>;
