"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenSipsRouteSchema = exports.DialplanContextSchema = exports.VoicemailBoxSchema = exports.ConferenceRoomSchema = exports.QueueSchema = exports.RingGroupSchema = exports.IvrMenuSchema = exports.TimeConditionSchema = exports.OutboundRouteSchema = exports.InboundRouteSchema = exports.SipRegistrationStatusInfoSchema = exports.CallRoutingRuleSchema = exports.SipTrunkConfigSchema = exports.SipExtensionConfigSchema = exports.SipRegistrationStatusSchema = void 0;
const zod_1 = require("zod");
// SIP Registration Status
exports.SipRegistrationStatusSchema = zod_1.z.enum([
    'registered',
    'unregistered',
    'failed',
    'expired',
    'unknown'
]);
// SIP Extension Configuration
exports.SipExtensionConfigSchema = zod_1.z.object({
    // Basic Settings
    extension: zod_1.z.string().regex(/^[0-9]{3,6}$/),
    password: zod_1.z.string().min(8).max(32),
    display_name: zod_1.z.string().min(1).max(100),
    // Tenant Context (auto-populated)
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    realm: zod_1.z.string(), // Auto-populated: tenant.sip_domain
    // SIP Settings
    sip_settings: zod_1.z.object({
        auth_username: zod_1.z.string().optional(),
        auth_password: zod_1.z.string().optional(),
        caller_id_name: zod_1.z.string().optional(),
        caller_id_number: zod_1.z.string().optional(),
        context: zod_1.z.string().default('default'),
        host: zod_1.z.string().default('dynamic'),
        type: zod_1.z.enum(['friend', 'user', 'peer']).default('friend'),
        nat: zod_1.z.enum(['force_rport', 'comedia', 'auto_force_rport', 'auto_comedia']).default('force_rport'),
        qualify: zod_1.z.boolean().default(true),
        qualify_freq: zod_1.z.number().min(30).max(300).default(60),
        canreinvite: zod_1.z.boolean().default(false),
        dtmfmode: zod_1.z.enum(['rfc2833', 'inband', 'info']).default('rfc2833'),
        disallow: zod_1.z.array(zod_1.z.string()).default(['all']),
        allow: zod_1.z.array(zod_1.z.string()).default(['ulaw', 'alaw', 'g729', 'g722']),
        directmedia: zod_1.z.boolean().default(false),
        trustrpid: zod_1.z.boolean().default(false),
        sendrpid: zod_1.z.boolean().default(false),
        callgroup: zod_1.z.string().optional(),
        pickupgroup: zod_1.z.string().optional(),
        musicclass: zod_1.z.string().default('default'),
        mohsuggest: zod_1.z.string().default('default'),
        parkinglot: zod_1.z.string().optional(),
        hasvoicemail: zod_1.z.boolean().default(true),
        mailbox: zod_1.z.string().optional(),
        attach: zod_1.z.string().optional(),
        cid_masquerade: zod_1.z.string().optional(),
        callingpres: zod_1.z.enum(['allowed_not_screened', 'allowed_passed_screen', 'allowed_failed_screen', 'allowed', 'prohib_not_screened', 'prohib_passed_screen', 'prohib_failed_screen', 'prohib']).default('allowed_not_screened'),
        restrictcid: zod_1.z.boolean().default(false),
        outboundcid: zod_1.z.string().optional(),
        language: zod_1.z.string().default('en'),
        accountcode: zod_1.z.string().optional(),
        amaflags: zod_1.z.enum(['default', 'omit', 'billing', 'documentation']).default('default'),
        callcounter: zod_1.z.boolean().default(false),
        busylevel: zod_1.z.number().min(1).max(100).default(1),
        ringinuse: zod_1.z.boolean().default(false),
        setvar: zod_1.z.array(zod_1.z.string()).default([]),
        useragent: zod_1.z.string().optional(),
        lastms: zod_1.z.number().optional(),
        regserver: zod_1.z.string().optional(),
        regseconds: zod_1.z.number().optional(),
        fullcontact: zod_1.z.string().optional(),
        ipaddr: zod_1.z.string().optional(),
        port: zod_1.z.number().optional(),
        username: zod_1.z.string().optional(),
        defaultip: zod_1.z.string().optional(),
        defaultuser: zod_1.z.string().optional(),
        secret: zod_1.z.string().optional(),
        regexten: zod_1.z.string().optional(),
        vmexten: zod_1.z.string().optional(),
        callbackextension: zod_1.z.string().optional(),
        namedcallgroup: zod_1.z.string().optional(),
        namedpickupgroup: zod_1.z.string().optional(),
        namedcontext: zod_1.z.string().optional(),
        subscribecontext: zod_1.z.string().optional(),
        musiconhold: zod_1.z.string().optional(),
        permit: zod_1.z.string().optional(),
        deny: zod_1.z.string().optional(),
        calllimit: zod_1.z.number().optional(),
        rtpkeepalive: zod_1.z.number().default(0),
        rtp_timeout: zod_1.z.number().default(60),
        rtp_hold_timeout: zod_1.z.number().default(300),
        rfc2833compensate: zod_1.z.boolean().default(false),
        session_timers: zod_1.z.boolean().default(false),
        session_expires: zod_1.z.number().default(1800),
        session_minse: zod_1.z.number().default(90),
        session_refresher: zod_1.z.enum(['uac', 'uas']).default('uas'),
        t38pt_udptl: zod_1.z.boolean().default(false),
        t38pt_rtp: zod_1.z.boolean().default(false),
        t38pt_tcp: zod_1.z.boolean().default(false),
        t38pt_usertpsource: zod_1.z.string().optional(),
        t38pt_rtp_udptl: zod_1.z.boolean().default(false),
        faxdetect_audio: zod_1.z.boolean().default(false),
        faxdetect_modem: zod_1.z.boolean().default(false),
        faxdetect_ced: zod_1.z.boolean().default(false),
        faxdetect_cng: zod_1.z.boolean().default(false),
        faxdetect_audio_silence_threshold: zod_1.z.number().default(128),
        faxdetect_audio_silence_duration: zod_1.z.number().default(2000),
        faxdetect_audio_energy_threshold: zod_1.z.number().default(128),
        faxdetect_audio_energy_duration: zod_1.z.number().default(2000),
        faxdetect_modem_silence_threshold: zod_1.z.number().default(128),
        faxdetect_modem_silence_duration: zod_1.z.number().default(2000),
        faxdetect_modem_energy_threshold: zod_1.z.number().default(128),
        faxdetect_modem_energy_duration: zod_1.z.number().default(2000),
        faxdetect_ced_silence_threshold: zod_1.z.number().default(128),
        faxdetect_ced_silence_duration: zod_1.z.number().default(2000),
        faxdetect_ced_energy_threshold: zod_1.z.number().default(128),
        faxdetect_ced_energy_duration: zod_1.z.number().default(2000),
        faxdetect_cng_silence_threshold: zod_1.z.number().default(128),
        faxdetect_cng_silence_duration: zod_1.z.number().default(2000),
        faxdetect_cng_energy_threshold: zod_1.z.number().default(128),
        faxdetect_cng_energy_duration: zod_1.z.number().default(2000)
    }),
    // Call Features
    call_features: zod_1.z.object({
        call_forwarding: zod_1.z.object({
            enabled: zod_1.z.boolean().default(false),
            destination: zod_1.z.string().optional(),
            no_answer_timeout: zod_1.z.number().min(5).max(60).default(20),
            busy_destination: zod_1.z.string().optional(),
            unavailable_destination: zod_1.z.string().optional()
        }),
        call_waiting: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            tone_frequency: zod_1.z.number().default(440),
            tone_duration: zod_1.z.number().default(200)
        }),
        do_not_disturb: zod_1.z.object({
            enabled: zod_1.z.boolean().default(false),
            message: zod_1.z.string().default('User is not available')
        }),
        voicemail: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            password: zod_1.z.string().optional(),
            email_notification: zod_1.z.boolean().default(false),
            email_address: zod_1.z.string().email().optional(),
            delete_after_email: zod_1.z.boolean().default(false),
            attach_audio: zod_1.z.boolean().default(true),
            max_messages: zod_1.z.number().min(1).max(1000).default(100),
            max_message_length: zod_1.z.number().min(30).max(600).default(300)
        }),
        recording: zod_1.z.object({
            enabled: zod_1.z.boolean().default(false),
            auto_record: zod_1.z.boolean().default(false),
            record_internal: zod_1.z.boolean().default(false),
            record_external: zod_1.z.boolean().default(true),
            consent_required: zod_1.z.boolean().default(true)
        })
    }),
    // Security Settings
    security: zod_1.z.object({
        ip_whitelist: zod_1.z.array(zod_1.z.string()).default([]),
        ip_blacklist: zod_1.z.array(zod_1.z.string()).default([]),
        max_concurrent_calls: zod_1.z.number().min(1).max(10).default(3),
        password_expiry_days: zod_1.z.number().min(30).max(365).default(90),
        require_secure_rtp: zod_1.z.boolean().default(false),
        encryption_method: zod_1.z.enum(['none', 'srtp', 'zrtp']).default('none')
    }),
    // Advanced Settings
    advanced: zod_1.z.object({
        custom_headers: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            value: zod_1.z.string()
        })).default([]),
        custom_variables: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            value: zod_1.z.string()
        })).default([]),
        dialplan_context: zod_1.z.string().default('default'),
        outbound_proxy: zod_1.z.string().optional(),
        transport: zod_1.z.enum(['udp', 'tcp', 'tls', 'ws', 'wss']).default('udp'),
        local_net: zod_1.z.string().default('192.168.0.0/16'),
        externip: zod_1.z.string().optional(),
        externhost: zod_1.z.string().optional(),
        externrefresh: zod_1.z.number().default(10)
    })
});
// SIP Trunk Configuration
exports.SipTrunkConfigSchema = zod_1.z.object({
    // Basic Settings
    name: zod_1.z.string().min(1).max(100),
    host: zod_1.z.string(),
    port: zod_1.z.number().min(1).max(65535).default(5060),
    username: zod_1.z.string().optional(),
    password: zod_1.z.string().optional(),
    from_user: zod_1.z.string().optional(),
    from_domain: zod_1.z.string(), // Auto-populated: tenant.sip_domain
    // Tenant Context (auto-populated)
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    // SIP Settings
    sip_settings: zod_1.z.object({
        type: zod_1.z.enum(['friend', 'user', 'peer']).default('peer'),
        context: zod_1.z.string().default('from-trunk'),
        host: zod_1.z.string(),
        port: zod_1.z.number().default(5060),
        username: zod_1.z.string().optional(),
        secret: zod_1.z.string().optional(),
        fromuser: zod_1.z.string().optional(),
        fromdomain: zod_1.z.string().optional(),
        callerid: zod_1.z.string().optional(),
        calleridname: zod_1.z.string().optional(),
        calleridpres: zod_1.z.enum(['allowed_not_screened', 'allowed_passed_screen', 'allowed_failed_screen', 'allowed', 'prohib_not_screened', 'prohib_passed_screen', 'prohib_failed_screen', 'prohib']).default('allowed_not_screened'),
        nat: zod_1.z.enum(['force_rport', 'comedia', 'auto_force_rport', 'auto_comedia']).default('force_rport'),
        qualify: zod_1.z.boolean().default(true),
        qualifyfreq: zod_1.z.number().min(30).max(300).default(60),
        canreinvite: zod_1.z.boolean().default(false),
        dtmfmode: zod_1.z.enum(['rfc2833', 'inband', 'info']).default('rfc2833'),
        disallow: zod_1.z.array(zod_1.z.string()).default(['all']),
        allow: zod_1.z.array(zod_1.z.string()).default(['ulaw', 'alaw', 'g729', 'g722']),
        directmedia: zod_1.z.boolean().default(false),
        trustrpid: zod_1.z.boolean().default(false),
        sendrpid: zod_1.z.boolean().default(false),
        callgroup: zod_1.z.string().optional(),
        pickupgroup: zod_1.z.string().optional(),
        musicclass: zod_1.z.string().default('default'),
        mohsuggest: zod_1.z.string().default('default'),
        parkinglot: zod_1.z.string().optional(),
        hasvoicemail: zod_1.z.boolean().default(false),
        mailbox: zod_1.z.string().optional(),
        attach: zod_1.z.string().optional(),
        cid_masquerade: zod_1.z.string().optional(),
        callingpres: zod_1.z.enum(['allowed_not_screened', 'allowed_passed_screen', 'allowed_failed_screen', 'allowed', 'prohib_not_screened', 'prohib_passed_screen', 'prohib_failed_screen', 'prohib']).default('allowed_not_screened'),
        restrictcid: zod_1.z.boolean().default(false),
        outboundcid: zod_1.z.string().optional(),
        language: zod_1.z.string().default('en'),
        accountcode: zod_1.z.string().optional(),
        amaflags: zod_1.z.enum(['default', 'omit', 'billing', 'documentation']).default('default'),
        callcounter: zod_1.z.boolean().default(false),
        busylevel: zod_1.z.number().min(1).max(100).default(1),
        ringinuse: zod_1.z.boolean().default(false),
        setvar: zod_1.z.array(zod_1.z.string()).default([]),
        useragent: zod_1.z.string().optional(),
        lastms: zod_1.z.number().optional(),
        regserver: zod_1.z.string().optional(),
        regseconds: zod_1.z.number().optional(),
        fullcontact: zod_1.z.string().optional(),
        ipaddr: zod_1.z.string().optional(),
        defaultip: zod_1.z.string().optional(),
        defaultuser: zod_1.z.string().optional(),
        regexten: zod_1.z.string().optional(),
        vmexten: zod_1.z.string().optional(),
        callbackextension: zod_1.z.string().optional(),
        namedcallgroup: zod_1.z.string().optional(),
        namedpickupgroup: zod_1.z.string().optional(),
        namedcontext: zod_1.z.string().optional(),
        subscribecontext: zod_1.z.string().optional(),
        musiconhold: zod_1.z.string().optional(),
        permit: zod_1.z.string().optional(),
        deny: zod_1.z.string().optional(),
        calllimit: zod_1.z.number().optional(),
        rtpkeepalive: zod_1.z.number().default(0),
        rtp_timeout: zod_1.z.number().default(60),
        rtp_hold_timeout: zod_1.z.number().default(300),
        rfc2833compensate: zod_1.z.boolean().default(false),
        session_timers: zod_1.z.boolean().default(false),
        session_expires: zod_1.z.number().default(1800),
        session_minse: zod_1.z.number().default(90),
        session_refresher: zod_1.z.enum(['uac', 'uas']).default('uas'),
        t38pt_udptl: zod_1.z.boolean().default(false),
        t38pt_rtp: zod_1.z.boolean().default(false),
        t38pt_tcp: zod_1.z.boolean().default(false),
        t38pt_usertpsource: zod_1.z.string().optional(),
        t38pt_rtp_udptl: zod_1.z.boolean().default(false)
    }),
    // Registration Settings
    registration: zod_1.z.object({
        enabled: zod_1.z.boolean().default(false),
        auth_username: zod_1.z.string().optional(),
        auth_password: zod_1.z.string().optional(),
        auth_realm: zod_1.z.string().optional(),
        refresh_interval: zod_1.z.number().min(30).max(3600).default(300),
        retry_interval: zod_1.z.number().min(10).max(300).default(60),
        max_retries: zod_1.z.number().min(1).max(10).default(3),
        expire: zod_1.z.number().min(60).max(3600).default(3600)
    }),
    // Security Settings
    security: zod_1.z.object({
        ip_whitelist: zod_1.z.array(zod_1.z.string()).default([]),
        ip_blacklist: zod_1.z.array(zod_1.z.string()).default([]),
        max_concurrent_calls: zod_1.z.number().min(1).max(100).default(10),
        require_secure_rtp: zod_1.z.boolean().default(false),
        encryption_method: zod_1.z.enum(['none', 'srtp', 'zrtp']).default('none'),
        authentication: zod_1.z.enum(['none', 'md5', 'sha1']).default('md5')
    }),
    // Advanced Settings
    advanced: zod_1.z.object({
        custom_headers: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            value: zod_1.z.string()
        })).default([]),
        custom_variables: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            value: zod_1.z.string()
        })).default([]),
        dialplan_context: zod_1.z.string().default('from-trunk'),
        outbound_proxy: zod_1.z.string().optional(),
        transport: zod_1.z.enum(['udp', 'tcp', 'tls', 'ws', 'wss']).default('udp'),
        local_net: zod_1.z.string().default('192.168.0.0/16'),
        externip: zod_1.z.string().optional(),
        externhost: zod_1.z.string().optional(),
        externrefresh: zod_1.z.number().default(10)
    })
});
// Call Routing Rules
exports.CallRoutingRuleSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.number().min(1).max(1000).default(100),
    enabled: zod_1.z.boolean().default(true),
    // Matching Conditions
    conditions: zod_1.z.object({
        caller_id: zod_1.z.object({
            number: zod_1.z.string().optional(),
            name: zod_1.z.string().optional(),
            pattern: zod_1.z.string().optional()
        }).optional(),
        called_number: zod_1.z.object({
            number: zod_1.z.string().optional(),
            pattern: zod_1.z.string().optional()
        }).optional(),
        time_conditions: zod_1.z.object({
            enabled: zod_1.z.boolean().default(false),
            timezone: zod_1.z.string().default('Europe/Rome'),
            schedule: zod_1.z.record(zod_1.z.object({
                enabled: zod_1.z.boolean().default(true),
                start_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
                end_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            }))
        }).optional(),
        day_conditions: zod_1.z.object({
            enabled: zod_1.z.boolean().default(false),
            days: zod_1.z.array(zod_1.z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).default(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
        }).optional(),
        source: zod_1.z.object({
            trunk_id: zod_1.z.string().uuid().optional(),
            extension_id: zod_1.z.string().uuid().optional(),
            ip_address: zod_1.z.string().optional()
        }).optional(),
        destination: zod_1.z.object({
            trunk_id: zod_1.z.string().uuid().optional(),
            extension_id: zod_1.z.string().uuid().optional(),
            external_number: zod_1.z.string().optional()
        }).optional()
    }),
    // Actions
    actions: zod_1.z.object({
        route_to: zod_1.z.object({
            type: zod_1.z.enum(['extension', 'trunk', 'external', 'voicemail', 'hangup', 'busy', 'congestion']),
            target: zod_1.z.string(), // extension number, trunk name, external number, etc.
            timeout: zod_1.z.number().min(5).max(300).default(30)
        }),
        call_forwarding: zod_1.z.object({
            enabled: zod_1.z.boolean().default(false),
            destination: zod_1.z.string().optional(),
            timeout: zod_1.z.number().min(5).max(60).default(20)
        }).optional(),
        recording: zod_1.z.object({
            enabled: zod_1.z.boolean().default(false),
            consent_required: zod_1.z.boolean().default(true)
        }).optional(),
        cdr_tag: zod_1.z.string().optional(),
        custom_variables: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            value: zod_1.z.string()
        })).default([])
    }),
    // Metadata
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    created_by: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid()
});
// SIP Registration Status
exports.SipRegistrationStatusInfoSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    type: zod_1.z.enum(['extension', 'trunk']),
    status: exports.SipRegistrationStatusSchema,
    last_registration: zod_1.z.date().optional(),
    last_unregistration: zod_1.z.date().optional(),
    registration_attempts: zod_1.z.number().default(0),
    last_error: zod_1.z.string().optional(),
    ip_address: zod_1.z.string().optional(),
    port: zod_1.z.number().optional(),
    user_agent: zod_1.z.string().optional(),
    expires: zod_1.z.number().optional(),
    contact: zod_1.z.string().optional(),
    tenant_id: zod_1.z.string().uuid()
});
// Inbound Route
exports.InboundRouteSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    did_number: zod_1.z.string().min(1).max(20), // Direct Inward Dialing number
    caller_id_name: zod_1.z.string().optional(),
    caller_id_number: zod_1.z.string().optional(),
    destination_type: zod_1.z.enum(['extension', 'ring_group', 'queue', 'voicemail', 'ivr', 'conference', 'external']),
    destination_value: zod_1.z.string(), // Extension number, ring group ID, etc.
    time_condition_id: zod_1.z.string().uuid().optional(), // Reference to time condition
    enabled: zod_1.z.boolean().default(true),
    // Advanced options
    caller_id_override: zod_1.z.boolean().default(false),
    caller_id_name_override: zod_1.z.string().optional(),
    caller_id_number_override: zod_1.z.string().optional(),
    // Recording
    record_calls: zod_1.z.boolean().default(false),
    recording_path: zod_1.z.string().optional(),
    // Failover
    failover_enabled: zod_1.z.boolean().default(false),
    failover_destination_type: zod_1.z.enum(['extension', 'voicemail', 'external']).optional(),
    failover_destination_value: zod_1.z.string().optional(),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
// Outbound Route
exports.OutboundRouteSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    dial_pattern: zod_1.z.string().min(1).max(50), // Regex pattern for matching numbers
    caller_id_name: zod_1.z.string().optional(),
    caller_id_number: zod_1.z.string().optional(),
    trunk_id: zod_1.z.string().uuid(), // Reference to SIP trunk
    prefix: zod_1.z.string().optional(), // Prefix to add to dialed number
    strip_digits: zod_1.z.number().int().min(0).default(0), // Digits to strip from beginning
    add_digits: zod_1.z.string().optional(), // Digits to add to beginning
    enabled: zod_1.z.boolean().default(true),
    // Advanced options
    caller_id_override: zod_1.z.boolean().default(false),
    caller_id_name_override: zod_1.z.string().optional(),
    caller_id_number_override: zod_1.z.string().optional(),
    // Recording
    record_calls: zod_1.z.boolean().default(false),
    recording_path: zod_1.z.string().optional(),
    // Failover
    failover_trunk_id: zod_1.z.string().uuid().optional(),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
// Time Condition
exports.TimeConditionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    timezone: zod_1.z.string().default('UTC'),
    // Business hours
    business_hours: zod_1.z.object({
        monday: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            start_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
            end_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }).optional(),
        tuesday: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            start_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }).optional(),
        wednesday: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            start_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }).optional(),
        thursday: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            start_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }).optional(),
        friday: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            start_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }).optional(),
        saturday: zod_1.z.object({
            enabled: zod_1.z.boolean().default(false),
            start_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }).optional(),
        sunday: zod_1.z.object({
            enabled: zod_1.z.boolean().default(false),
            start_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }).optional(),
    }),
    // Holidays
    holidays: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
        enabled: zod_1.z.boolean().default(true),
    })).default([]),
    // Actions
    business_hours_action: zod_1.z.enum(['continue', 'voicemail', 'external', 'hangup']).default('continue'),
    business_hours_destination: zod_1.z.string().optional(),
    after_hours_action: zod_1.z.enum(['voicemail', 'external', 'hangup']).default('voicemail'),
    after_hours_destination: zod_1.z.string().optional(),
    holiday_action: zod_1.z.enum(['voicemail', 'external', 'hangup']).default('voicemail'),
    holiday_destination: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().default(true),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
// IVR Menu
exports.IvrMenuSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    greeting_message: zod_1.z.string().optional(), // Text-to-speech or audio file
    invalid_message: zod_1.z.string().optional(),
    timeout_message: zod_1.z.string().optional(),
    timeout_seconds: zod_1.z.number().int().min(1).max(60).default(10),
    max_failures: zod_1.z.number().int().min(1).max(10).default(3),
    // Menu options (0-9, *, #)
    options: zod_1.z.array(zod_1.z.object({
        digit: zod_1.z.string().length(1), // 0-9, *, #
        action: zod_1.z.enum(['extension', 'ring_group', 'queue', 'voicemail', 'ivr', 'conference', 'external', 'hangup']),
        destination: zod_1.z.string(), // Extension number, ring group ID, etc.
        description: zod_1.z.string().optional(),
    })).max(12), // Maximum 12 options (0-9, *, #)
    // Default action when no digit is pressed
    default_action: zod_1.z.enum(['extension', 'ring_group', 'queue', 'voicemail', 'ivr', 'conference', 'external', 'hangup']).default('hangup'),
    default_destination: zod_1.z.string().optional(),
    // Advanced options
    caller_id_override: zod_1.z.boolean().default(false),
    caller_id_name_override: zod_1.z.string().optional(),
    caller_id_number_override: zod_1.z.string().optional(),
    // Recording
    record_calls: zod_1.z.boolean().default(false),
    recording_path: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().default(true),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
// Ring Group
exports.RingGroupSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    extension_number: zod_1.z.string().min(3).max(10), // e.g., "2001"
    strategy: zod_1.z.enum(['simultaneous', 'sequential', 'round_robin', 'random', 'longest_idle']).default('simultaneous'),
    timeout: zod_1.z.number().int().min(5).max(300).default(30), // seconds
    max_calls: zod_1.z.number().int().min(1).max(100).default(10),
    // Members
    members: zod_1.z.array(zod_1.z.object({
        extension_id: zod_1.z.string().uuid(),
        extension_number: zod_1.z.string(),
        display_name: zod_1.z.string(),
        priority: zod_1.z.number().int().min(1).max(100).default(1),
        enabled: zod_1.z.boolean().default(true),
        delay: zod_1.z.number().int().min(0).max(60).default(0), // seconds delay for sequential
    })),
    // Advanced options
    caller_id_override: zod_1.z.boolean().default(false),
    caller_id_name_override: zod_1.z.string().optional(),
    caller_id_number_override: zod_1.z.string().optional(),
    // Recording
    record_calls: zod_1.z.boolean().default(false),
    recording_path: zod_1.z.string().optional(),
    // Failover
    failover_enabled: zod_1.z.boolean().default(false),
    failover_destination_type: zod_1.z.enum(['extension', 'voicemail', 'external']).optional(),
    failover_destination_value: zod_1.z.string().optional(),
    // Time conditions
    time_condition_id: zod_1.z.string().uuid().optional(),
    enabled: zod_1.z.boolean().default(true),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
// Queue (Call Center Queue)
exports.QueueSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    extension_number: zod_1.z.string().min(3).max(10), // e.g., "3001"
    strategy: zod_1.z.enum(['ring_all', 'longest_idle', 'round_robin', 'top_down', 'agent_with_least_calls', 'agent_with_fewest_calls', 'sequentially_by_agent_order', 'random']).default('longest_idle'),
    timeout: zod_1.z.number().int().min(5).max(300).default(30), // seconds
    max_calls: zod_1.z.number().int().min(1).max(1000).default(100),
    // Queue settings
    hold_music: zod_1.z.string().optional(), // Music on hold class
    announce_frequency: zod_1.z.number().int().min(0).max(300).default(0), // seconds, 0 = no announcements
    announce_position: zod_1.z.boolean().default(false),
    announce_hold_time: zod_1.z.boolean().default(false),
    // Agents
    agents: zod_1.z.array(zod_1.z.object({
        extension_id: zod_1.z.string().uuid(),
        extension_number: zod_1.z.string(),
        display_name: zod_1.z.string(),
        penalty: zod_1.z.number().int().min(0).max(100).default(0), // lower = higher priority
        enabled: zod_1.z.boolean().default(true),
        max_calls: zod_1.z.number().int().min(1).max(10).default(1),
    })),
    // Advanced options
    caller_id_override: zod_1.z.boolean().default(false),
    caller_id_name_override: zod_1.z.string().optional(),
    caller_id_number_override: zod_1.z.string().optional(),
    // Recording
    record_calls: zod_1.z.boolean().default(false),
    recording_path: zod_1.z.string().optional(),
    // Failover
    failover_enabled: zod_1.z.boolean().default(false),
    failover_destination_type: zod_1.z.enum(['extension', 'voicemail', 'external']).optional(),
    failover_destination_value: zod_1.z.string().optional(),
    // Time conditions
    time_condition_id: zod_1.z.string().uuid().optional(),
    enabled: zod_1.z.boolean().default(true),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
// Conference Room
exports.ConferenceRoomSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    extension_number: zod_1.z.string().min(3).max(10), // e.g., "4001"
    pin: zod_1.z.string().optional(), // PIN for joining
    moderator_pin: zod_1.z.string().optional(), // PIN for moderator
    max_members: zod_1.z.number().int().min(2).max(1000).default(10),
    // Conference settings
    record_conference: zod_1.z.boolean().default(false),
    recording_path: zod_1.z.string().optional(),
    mute_on_join: zod_1.z.boolean().default(false),
    announce_join_leave: zod_1.z.boolean().default(true),
    hold_music: zod_1.z.string().optional(),
    // Advanced options
    caller_id_override: zod_1.z.boolean().default(false),
    caller_id_name_override: zod_1.z.string().optional(),
    caller_id_number_override: zod_1.z.string().optional(),
    // Time conditions
    time_condition_id: zod_1.z.string().uuid().optional(),
    enabled: zod_1.z.boolean().default(true),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
// Voicemail Box
exports.VoicemailBoxSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    extension_number: zod_1.z.string().min(3).max(10),
    password: zod_1.z.string().min(4).max(20),
    display_name: zod_1.z.string().min(1).max(100),
    email_address: zod_1.z.string().email().optional(),
    // Voicemail settings
    max_messages: zod_1.z.number().int().min(1).max(1000).default(100),
    max_message_length: zod_1.z.number().int().min(30).max(600).default(300), // seconds
    delete_after_email: zod_1.z.boolean().default(false),
    attach_audio: zod_1.z.boolean().default(true),
    email_notification: zod_1.z.boolean().default(true),
    // Greeting
    greeting_type: zod_1.z.enum(['default', 'custom', 'none']).default('default'),
    custom_greeting_path: zod_1.z.string().optional(),
    // Advanced options
    caller_id_override: zod_1.z.boolean().default(false),
    caller_id_name_override: zod_1.z.string().optional(),
    caller_id_number_override: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().default(true),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
// FreeSWITCH Dialplan Context
exports.DialplanContextSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    tenant_id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(50), // e.g., "default", "from-trunk", "from-internal"
    description: zod_1.z.string().optional(),
    // Context settings
    continue_on_fail: zod_1.z.boolean().default(false),
    break_on_fail: zod_1.z.boolean().default(false),
    // Extensions in this context
    extensions: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        condition: zod_1.z.string(), // FreeSWITCH condition
        action: zod_1.z.string(), // FreeSWITCH action
        anti_action: zod_1.z.string().optional(),
        enabled: zod_1.z.boolean().default(true),
    })),
    enabled: zod_1.z.boolean().default(true),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
// OpenSIPS Route
exports.OpenSipsRouteSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    tenant_id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.number().int().min(1).max(1000).default(100),
    // Route conditions
    conditions: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['method', 'uri', 'from_uri', 'to_uri', 'src_ip', 'dst_ip', 'port', 'user_agent', 'custom_header']),
        operator: zod_1.z.enum(['equals', 'contains', 'regex', 'starts_with', 'ends_with']),
        value: zod_1.z.string(),
        enabled: zod_1.z.boolean().default(true),
    })),
    // Route actions
    actions: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['forward', 'redirect', 'reject', 'drop', 'log', 'set_header', 'remove_header', 'set_variable']),
        value: zod_1.z.string(),
        enabled: zod_1.z.boolean().default(true),
    })),
    enabled: zod_1.z.boolean().default(true),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
//# sourceMappingURL=sip.js.map