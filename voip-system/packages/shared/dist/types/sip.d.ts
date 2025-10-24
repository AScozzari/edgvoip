import { z } from 'zod';
export declare const SipRegistrationStatusSchema: z.ZodEnum<["registered", "unregistered", "failed", "expired", "unknown"]>;
export type SipRegistrationStatus = z.infer<typeof SipRegistrationStatusSchema>;
export declare const SipExtensionConfigSchema: z.ZodObject<{
    extension: z.ZodString;
    password: z.ZodString;
    display_name: z.ZodString;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    realm: z.ZodString;
    sip_settings: z.ZodObject<{
        auth_username: z.ZodOptional<z.ZodString>;
        auth_password: z.ZodOptional<z.ZodString>;
        caller_id_name: z.ZodOptional<z.ZodString>;
        caller_id_number: z.ZodOptional<z.ZodString>;
        context: z.ZodDefault<z.ZodString>;
        host: z.ZodDefault<z.ZodString>;
        type: z.ZodDefault<z.ZodEnum<["friend", "user", "peer"]>>;
        nat: z.ZodDefault<z.ZodEnum<["force_rport", "comedia", "auto_force_rport", "auto_comedia"]>>;
        qualify: z.ZodDefault<z.ZodBoolean>;
        qualify_freq: z.ZodDefault<z.ZodNumber>;
        canreinvite: z.ZodDefault<z.ZodBoolean>;
        dtmfmode: z.ZodDefault<z.ZodEnum<["rfc2833", "inband", "info"]>>;
        disallow: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        allow: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        directmedia: z.ZodDefault<z.ZodBoolean>;
        trustrpid: z.ZodDefault<z.ZodBoolean>;
        sendrpid: z.ZodDefault<z.ZodBoolean>;
        callgroup: z.ZodOptional<z.ZodString>;
        pickupgroup: z.ZodOptional<z.ZodString>;
        musicclass: z.ZodDefault<z.ZodString>;
        mohsuggest: z.ZodDefault<z.ZodString>;
        parkinglot: z.ZodOptional<z.ZodString>;
        hasvoicemail: z.ZodDefault<z.ZodBoolean>;
        mailbox: z.ZodOptional<z.ZodString>;
        attach: z.ZodOptional<z.ZodString>;
        cid_masquerade: z.ZodOptional<z.ZodString>;
        callingpres: z.ZodDefault<z.ZodEnum<["allowed_not_screened", "allowed_passed_screen", "allowed_failed_screen", "allowed", "prohib_not_screened", "prohib_passed_screen", "prohib_failed_screen", "prohib"]>>;
        restrictcid: z.ZodDefault<z.ZodBoolean>;
        outboundcid: z.ZodOptional<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
        accountcode: z.ZodOptional<z.ZodString>;
        amaflags: z.ZodDefault<z.ZodEnum<["default", "omit", "billing", "documentation"]>>;
        callcounter: z.ZodDefault<z.ZodBoolean>;
        busylevel: z.ZodDefault<z.ZodNumber>;
        ringinuse: z.ZodDefault<z.ZodBoolean>;
        setvar: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        useragent: z.ZodOptional<z.ZodString>;
        lastms: z.ZodOptional<z.ZodNumber>;
        regserver: z.ZodOptional<z.ZodString>;
        regseconds: z.ZodOptional<z.ZodNumber>;
        fullcontact: z.ZodOptional<z.ZodString>;
        ipaddr: z.ZodOptional<z.ZodString>;
        port: z.ZodOptional<z.ZodNumber>;
        username: z.ZodOptional<z.ZodString>;
        defaultip: z.ZodOptional<z.ZodString>;
        defaultuser: z.ZodOptional<z.ZodString>;
        secret: z.ZodOptional<z.ZodString>;
        regexten: z.ZodOptional<z.ZodString>;
        vmexten: z.ZodOptional<z.ZodString>;
        callbackextension: z.ZodOptional<z.ZodString>;
        namedcallgroup: z.ZodOptional<z.ZodString>;
        namedpickupgroup: z.ZodOptional<z.ZodString>;
        namedcontext: z.ZodOptional<z.ZodString>;
        subscribecontext: z.ZodOptional<z.ZodString>;
        musiconhold: z.ZodOptional<z.ZodString>;
        permit: z.ZodOptional<z.ZodString>;
        deny: z.ZodOptional<z.ZodString>;
        calllimit: z.ZodOptional<z.ZodNumber>;
        rtpkeepalive: z.ZodDefault<z.ZodNumber>;
        rtp_timeout: z.ZodDefault<z.ZodNumber>;
        rtp_hold_timeout: z.ZodDefault<z.ZodNumber>;
        rfc2833compensate: z.ZodDefault<z.ZodBoolean>;
        session_timers: z.ZodDefault<z.ZodBoolean>;
        session_expires: z.ZodDefault<z.ZodNumber>;
        session_minse: z.ZodDefault<z.ZodNumber>;
        session_refresher: z.ZodDefault<z.ZodEnum<["uac", "uas"]>>;
        t38pt_udptl: z.ZodDefault<z.ZodBoolean>;
        t38pt_rtp: z.ZodDefault<z.ZodBoolean>;
        t38pt_tcp: z.ZodDefault<z.ZodBoolean>;
        t38pt_usertpsource: z.ZodOptional<z.ZodString>;
        t38pt_rtp_udptl: z.ZodDefault<z.ZodBoolean>;
        faxdetect_audio: z.ZodDefault<z.ZodBoolean>;
        faxdetect_modem: z.ZodDefault<z.ZodBoolean>;
        faxdetect_ced: z.ZodDefault<z.ZodBoolean>;
        faxdetect_cng: z.ZodDefault<z.ZodBoolean>;
        faxdetect_audio_silence_threshold: z.ZodDefault<z.ZodNumber>;
        faxdetect_audio_silence_duration: z.ZodDefault<z.ZodNumber>;
        faxdetect_audio_energy_threshold: z.ZodDefault<z.ZodNumber>;
        faxdetect_audio_energy_duration: z.ZodDefault<z.ZodNumber>;
        faxdetect_modem_silence_threshold: z.ZodDefault<z.ZodNumber>;
        faxdetect_modem_silence_duration: z.ZodDefault<z.ZodNumber>;
        faxdetect_modem_energy_threshold: z.ZodDefault<z.ZodNumber>;
        faxdetect_modem_energy_duration: z.ZodDefault<z.ZodNumber>;
        faxdetect_ced_silence_threshold: z.ZodDefault<z.ZodNumber>;
        faxdetect_ced_silence_duration: z.ZodDefault<z.ZodNumber>;
        faxdetect_ced_energy_threshold: z.ZodDefault<z.ZodNumber>;
        faxdetect_ced_energy_duration: z.ZodDefault<z.ZodNumber>;
        faxdetect_cng_silence_threshold: z.ZodDefault<z.ZodNumber>;
        faxdetect_cng_silence_duration: z.ZodDefault<z.ZodNumber>;
        faxdetect_cng_energy_threshold: z.ZodDefault<z.ZodNumber>;
        faxdetect_cng_energy_duration: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "user" | "friend" | "peer";
        language: string;
        host: string;
        context: string;
        nat: "force_rport" | "comedia" | "auto_force_rport" | "auto_comedia";
        qualify: boolean;
        qualify_freq: number;
        canreinvite: boolean;
        dtmfmode: "rfc2833" | "inband" | "info";
        disallow: string[];
        allow: string[];
        directmedia: boolean;
        trustrpid: boolean;
        sendrpid: boolean;
        musicclass: string;
        mohsuggest: string;
        hasvoicemail: boolean;
        callingpres: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib";
        restrictcid: boolean;
        amaflags: "default" | "omit" | "billing" | "documentation";
        callcounter: boolean;
        busylevel: number;
        ringinuse: boolean;
        setvar: string[];
        rtpkeepalive: number;
        rtp_timeout: number;
        rtp_hold_timeout: number;
        rfc2833compensate: boolean;
        session_timers: boolean;
        session_expires: number;
        session_minse: number;
        session_refresher: "uac" | "uas";
        t38pt_udptl: boolean;
        t38pt_rtp: boolean;
        t38pt_tcp: boolean;
        t38pt_rtp_udptl: boolean;
        faxdetect_audio: boolean;
        faxdetect_modem: boolean;
        faxdetect_ced: boolean;
        faxdetect_cng: boolean;
        faxdetect_audio_silence_threshold: number;
        faxdetect_audio_silence_duration: number;
        faxdetect_audio_energy_threshold: number;
        faxdetect_audio_energy_duration: number;
        faxdetect_modem_silence_threshold: number;
        faxdetect_modem_silence_duration: number;
        faxdetect_modem_energy_threshold: number;
        faxdetect_modem_energy_duration: number;
        faxdetect_ced_silence_threshold: number;
        faxdetect_ced_silence_duration: number;
        faxdetect_ced_energy_threshold: number;
        faxdetect_ced_energy_duration: number;
        faxdetect_cng_silence_threshold: number;
        faxdetect_cng_silence_duration: number;
        faxdetect_cng_energy_threshold: number;
        faxdetect_cng_energy_duration: number;
        port?: number | undefined;
        username?: string | undefined;
        caller_id_number?: string | undefined;
        caller_id_name?: string | undefined;
        auth_username?: string | undefined;
        auth_password?: string | undefined;
        callgroup?: string | undefined;
        pickupgroup?: string | undefined;
        parkinglot?: string | undefined;
        mailbox?: string | undefined;
        attach?: string | undefined;
        cid_masquerade?: string | undefined;
        outboundcid?: string | undefined;
        accountcode?: string | undefined;
        useragent?: string | undefined;
        lastms?: number | undefined;
        regserver?: string | undefined;
        regseconds?: number | undefined;
        fullcontact?: string | undefined;
        ipaddr?: string | undefined;
        defaultip?: string | undefined;
        defaultuser?: string | undefined;
        secret?: string | undefined;
        regexten?: string | undefined;
        vmexten?: string | undefined;
        callbackextension?: string | undefined;
        namedcallgroup?: string | undefined;
        namedpickupgroup?: string | undefined;
        namedcontext?: string | undefined;
        subscribecontext?: string | undefined;
        musiconhold?: string | undefined;
        permit?: string | undefined;
        deny?: string | undefined;
        calllimit?: number | undefined;
        t38pt_usertpsource?: string | undefined;
    }, {
        type?: "user" | "friend" | "peer" | undefined;
        language?: string | undefined;
        host?: string | undefined;
        port?: number | undefined;
        username?: string | undefined;
        caller_id_number?: string | undefined;
        caller_id_name?: string | undefined;
        auth_username?: string | undefined;
        auth_password?: string | undefined;
        context?: string | undefined;
        nat?: "force_rport" | "comedia" | "auto_force_rport" | "auto_comedia" | undefined;
        qualify?: boolean | undefined;
        qualify_freq?: number | undefined;
        canreinvite?: boolean | undefined;
        dtmfmode?: "rfc2833" | "inband" | "info" | undefined;
        disallow?: string[] | undefined;
        allow?: string[] | undefined;
        directmedia?: boolean | undefined;
        trustrpid?: boolean | undefined;
        sendrpid?: boolean | undefined;
        callgroup?: string | undefined;
        pickupgroup?: string | undefined;
        musicclass?: string | undefined;
        mohsuggest?: string | undefined;
        parkinglot?: string | undefined;
        hasvoicemail?: boolean | undefined;
        mailbox?: string | undefined;
        attach?: string | undefined;
        cid_masquerade?: string | undefined;
        callingpres?: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib" | undefined;
        restrictcid?: boolean | undefined;
        outboundcid?: string | undefined;
        accountcode?: string | undefined;
        amaflags?: "default" | "omit" | "billing" | "documentation" | undefined;
        callcounter?: boolean | undefined;
        busylevel?: number | undefined;
        ringinuse?: boolean | undefined;
        setvar?: string[] | undefined;
        useragent?: string | undefined;
        lastms?: number | undefined;
        regserver?: string | undefined;
        regseconds?: number | undefined;
        fullcontact?: string | undefined;
        ipaddr?: string | undefined;
        defaultip?: string | undefined;
        defaultuser?: string | undefined;
        secret?: string | undefined;
        regexten?: string | undefined;
        vmexten?: string | undefined;
        callbackextension?: string | undefined;
        namedcallgroup?: string | undefined;
        namedpickupgroup?: string | undefined;
        namedcontext?: string | undefined;
        subscribecontext?: string | undefined;
        musiconhold?: string | undefined;
        permit?: string | undefined;
        deny?: string | undefined;
        calllimit?: number | undefined;
        rtpkeepalive?: number | undefined;
        rtp_timeout?: number | undefined;
        rtp_hold_timeout?: number | undefined;
        rfc2833compensate?: boolean | undefined;
        session_timers?: boolean | undefined;
        session_expires?: number | undefined;
        session_minse?: number | undefined;
        session_refresher?: "uac" | "uas" | undefined;
        t38pt_udptl?: boolean | undefined;
        t38pt_rtp?: boolean | undefined;
        t38pt_tcp?: boolean | undefined;
        t38pt_usertpsource?: string | undefined;
        t38pt_rtp_udptl?: boolean | undefined;
        faxdetect_audio?: boolean | undefined;
        faxdetect_modem?: boolean | undefined;
        faxdetect_ced?: boolean | undefined;
        faxdetect_cng?: boolean | undefined;
        faxdetect_audio_silence_threshold?: number | undefined;
        faxdetect_audio_silence_duration?: number | undefined;
        faxdetect_audio_energy_threshold?: number | undefined;
        faxdetect_audio_energy_duration?: number | undefined;
        faxdetect_modem_silence_threshold?: number | undefined;
        faxdetect_modem_silence_duration?: number | undefined;
        faxdetect_modem_energy_threshold?: number | undefined;
        faxdetect_modem_energy_duration?: number | undefined;
        faxdetect_ced_silence_threshold?: number | undefined;
        faxdetect_ced_silence_duration?: number | undefined;
        faxdetect_ced_energy_threshold?: number | undefined;
        faxdetect_ced_energy_duration?: number | undefined;
        faxdetect_cng_silence_threshold?: number | undefined;
        faxdetect_cng_silence_duration?: number | undefined;
        faxdetect_cng_energy_threshold?: number | undefined;
        faxdetect_cng_energy_duration?: number | undefined;
    }>;
    call_features: z.ZodObject<{
        call_forwarding: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            destination: z.ZodOptional<z.ZodString>;
            no_answer_timeout: z.ZodDefault<z.ZodNumber>;
            busy_destination: z.ZodOptional<z.ZodString>;
            unavailable_destination: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            no_answer_timeout: number;
            destination?: string | undefined;
            busy_destination?: string | undefined;
            unavailable_destination?: string | undefined;
        }, {
            enabled?: boolean | undefined;
            destination?: string | undefined;
            no_answer_timeout?: number | undefined;
            busy_destination?: string | undefined;
            unavailable_destination?: string | undefined;
        }>;
        call_waiting: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            tone_frequency: z.ZodDefault<z.ZodNumber>;
            tone_duration: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            tone_frequency: number;
            tone_duration: number;
        }, {
            enabled?: boolean | undefined;
            tone_frequency?: number | undefined;
            tone_duration?: number | undefined;
        }>;
        do_not_disturb: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            message: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            enabled: boolean;
        }, {
            message?: string | undefined;
            enabled?: boolean | undefined;
        }>;
        voicemail: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            password: z.ZodOptional<z.ZodString>;
            email_notification: z.ZodDefault<z.ZodBoolean>;
            email_address: z.ZodOptional<z.ZodString>;
            delete_after_email: z.ZodDefault<z.ZodBoolean>;
            attach_audio: z.ZodDefault<z.ZodBoolean>;
            max_messages: z.ZodDefault<z.ZodNumber>;
            max_message_length: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            email_notification: boolean;
            delete_after_email: boolean;
            attach_audio: boolean;
            max_messages: number;
            max_message_length: number;
            password?: string | undefined;
            email_address?: string | undefined;
        }, {
            enabled?: boolean | undefined;
            password?: string | undefined;
            email_notification?: boolean | undefined;
            email_address?: string | undefined;
            delete_after_email?: boolean | undefined;
            attach_audio?: boolean | undefined;
            max_messages?: number | undefined;
            max_message_length?: number | undefined;
        }>;
        recording: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            auto_record: z.ZodDefault<z.ZodBoolean>;
            record_internal: z.ZodDefault<z.ZodBoolean>;
            record_external: z.ZodDefault<z.ZodBoolean>;
            consent_required: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            auto_record: boolean;
            record_internal: boolean;
            record_external: boolean;
            consent_required: boolean;
        }, {
            enabled?: boolean | undefined;
            auto_record?: boolean | undefined;
            record_internal?: boolean | undefined;
            record_external?: boolean | undefined;
            consent_required?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        voicemail: {
            enabled: boolean;
            email_notification: boolean;
            delete_after_email: boolean;
            attach_audio: boolean;
            max_messages: number;
            max_message_length: number;
            password?: string | undefined;
            email_address?: string | undefined;
        };
        call_forwarding: {
            enabled: boolean;
            no_answer_timeout: number;
            destination?: string | undefined;
            busy_destination?: string | undefined;
            unavailable_destination?: string | undefined;
        };
        call_waiting: {
            enabled: boolean;
            tone_frequency: number;
            tone_duration: number;
        };
        do_not_disturb: {
            message: string;
            enabled: boolean;
        };
        recording: {
            enabled: boolean;
            auto_record: boolean;
            record_internal: boolean;
            record_external: boolean;
            consent_required: boolean;
        };
    }, {
        voicemail: {
            enabled?: boolean | undefined;
            password?: string | undefined;
            email_notification?: boolean | undefined;
            email_address?: string | undefined;
            delete_after_email?: boolean | undefined;
            attach_audio?: boolean | undefined;
            max_messages?: number | undefined;
            max_message_length?: number | undefined;
        };
        call_forwarding: {
            enabled?: boolean | undefined;
            destination?: string | undefined;
            no_answer_timeout?: number | undefined;
            busy_destination?: string | undefined;
            unavailable_destination?: string | undefined;
        };
        call_waiting: {
            enabled?: boolean | undefined;
            tone_frequency?: number | undefined;
            tone_duration?: number | undefined;
        };
        do_not_disturb: {
            message?: string | undefined;
            enabled?: boolean | undefined;
        };
        recording: {
            enabled?: boolean | undefined;
            auto_record?: boolean | undefined;
            record_internal?: boolean | undefined;
            record_external?: boolean | undefined;
            consent_required?: boolean | undefined;
        };
    }>;
    security: z.ZodObject<{
        ip_whitelist: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        ip_blacklist: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        max_concurrent_calls: z.ZodDefault<z.ZodNumber>;
        password_expiry_days: z.ZodDefault<z.ZodNumber>;
        require_secure_rtp: z.ZodDefault<z.ZodBoolean>;
        encryption_method: z.ZodDefault<z.ZodEnum<["none", "srtp", "zrtp"]>>;
    }, "strip", z.ZodTypeAny, {
        max_concurrent_calls: number;
        ip_whitelist: string[];
        ip_blacklist: string[];
        password_expiry_days: number;
        require_secure_rtp: boolean;
        encryption_method: "none" | "srtp" | "zrtp";
    }, {
        max_concurrent_calls?: number | undefined;
        ip_whitelist?: string[] | undefined;
        ip_blacklist?: string[] | undefined;
        password_expiry_days?: number | undefined;
        require_secure_rtp?: boolean | undefined;
        encryption_method?: "none" | "srtp" | "zrtp" | undefined;
    }>;
    advanced: z.ZodObject<{
        custom_headers: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            value: string;
        }, {
            name: string;
            value: string;
        }>, "many">>;
        custom_variables: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            value: string;
        }, {
            name: string;
            value: string;
        }>, "many">>;
        dialplan_context: z.ZodDefault<z.ZodString>;
        outbound_proxy: z.ZodOptional<z.ZodString>;
        transport: z.ZodDefault<z.ZodEnum<["udp", "tcp", "tls", "ws", "wss"]>>;
        local_net: z.ZodDefault<z.ZodString>;
        externip: z.ZodOptional<z.ZodString>;
        externhost: z.ZodOptional<z.ZodString>;
        externrefresh: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        transport: "udp" | "tcp" | "tls" | "ws" | "wss";
        custom_headers: {
            name: string;
            value: string;
        }[];
        custom_variables: {
            name: string;
            value: string;
        }[];
        dialplan_context: string;
        local_net: string;
        externrefresh: number;
        outbound_proxy?: string | undefined;
        externip?: string | undefined;
        externhost?: string | undefined;
    }, {
        transport?: "udp" | "tcp" | "tls" | "ws" | "wss" | undefined;
        custom_headers?: {
            name: string;
            value: string;
        }[] | undefined;
        custom_variables?: {
            name: string;
            value: string;
        }[] | undefined;
        dialplan_context?: string | undefined;
        outbound_proxy?: string | undefined;
        local_net?: string | undefined;
        externip?: string | undefined;
        externhost?: string | undefined;
        externrefresh?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    tenant_id: string;
    extension: string;
    password: string;
    display_name: string;
    realm: string;
    security: {
        max_concurrent_calls: number;
        ip_whitelist: string[];
        ip_blacklist: string[];
        password_expiry_days: number;
        require_secure_rtp: boolean;
        encryption_method: "none" | "srtp" | "zrtp";
    };
    sip_settings: {
        type: "user" | "friend" | "peer";
        language: string;
        host: string;
        context: string;
        nat: "force_rport" | "comedia" | "auto_force_rport" | "auto_comedia";
        qualify: boolean;
        qualify_freq: number;
        canreinvite: boolean;
        dtmfmode: "rfc2833" | "inband" | "info";
        disallow: string[];
        allow: string[];
        directmedia: boolean;
        trustrpid: boolean;
        sendrpid: boolean;
        musicclass: string;
        mohsuggest: string;
        hasvoicemail: boolean;
        callingpres: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib";
        restrictcid: boolean;
        amaflags: "default" | "omit" | "billing" | "documentation";
        callcounter: boolean;
        busylevel: number;
        ringinuse: boolean;
        setvar: string[];
        rtpkeepalive: number;
        rtp_timeout: number;
        rtp_hold_timeout: number;
        rfc2833compensate: boolean;
        session_timers: boolean;
        session_expires: number;
        session_minse: number;
        session_refresher: "uac" | "uas";
        t38pt_udptl: boolean;
        t38pt_rtp: boolean;
        t38pt_tcp: boolean;
        t38pt_rtp_udptl: boolean;
        faxdetect_audio: boolean;
        faxdetect_modem: boolean;
        faxdetect_ced: boolean;
        faxdetect_cng: boolean;
        faxdetect_audio_silence_threshold: number;
        faxdetect_audio_silence_duration: number;
        faxdetect_audio_energy_threshold: number;
        faxdetect_audio_energy_duration: number;
        faxdetect_modem_silence_threshold: number;
        faxdetect_modem_silence_duration: number;
        faxdetect_modem_energy_threshold: number;
        faxdetect_modem_energy_duration: number;
        faxdetect_ced_silence_threshold: number;
        faxdetect_ced_silence_duration: number;
        faxdetect_ced_energy_threshold: number;
        faxdetect_ced_energy_duration: number;
        faxdetect_cng_silence_threshold: number;
        faxdetect_cng_silence_duration: number;
        faxdetect_cng_energy_threshold: number;
        faxdetect_cng_energy_duration: number;
        port?: number | undefined;
        username?: string | undefined;
        caller_id_number?: string | undefined;
        caller_id_name?: string | undefined;
        auth_username?: string | undefined;
        auth_password?: string | undefined;
        callgroup?: string | undefined;
        pickupgroup?: string | undefined;
        parkinglot?: string | undefined;
        mailbox?: string | undefined;
        attach?: string | undefined;
        cid_masquerade?: string | undefined;
        outboundcid?: string | undefined;
        accountcode?: string | undefined;
        useragent?: string | undefined;
        lastms?: number | undefined;
        regserver?: string | undefined;
        regseconds?: number | undefined;
        fullcontact?: string | undefined;
        ipaddr?: string | undefined;
        defaultip?: string | undefined;
        defaultuser?: string | undefined;
        secret?: string | undefined;
        regexten?: string | undefined;
        vmexten?: string | undefined;
        callbackextension?: string | undefined;
        namedcallgroup?: string | undefined;
        namedpickupgroup?: string | undefined;
        namedcontext?: string | undefined;
        subscribecontext?: string | undefined;
        musiconhold?: string | undefined;
        permit?: string | undefined;
        deny?: string | undefined;
        calllimit?: number | undefined;
        t38pt_usertpsource?: string | undefined;
    };
    call_features: {
        voicemail: {
            enabled: boolean;
            email_notification: boolean;
            delete_after_email: boolean;
            attach_audio: boolean;
            max_messages: number;
            max_message_length: number;
            password?: string | undefined;
            email_address?: string | undefined;
        };
        call_forwarding: {
            enabled: boolean;
            no_answer_timeout: number;
            destination?: string | undefined;
            busy_destination?: string | undefined;
            unavailable_destination?: string | undefined;
        };
        call_waiting: {
            enabled: boolean;
            tone_frequency: number;
            tone_duration: number;
        };
        do_not_disturb: {
            message: string;
            enabled: boolean;
        };
        recording: {
            enabled: boolean;
            auto_record: boolean;
            record_internal: boolean;
            record_external: boolean;
            consent_required: boolean;
        };
    };
    advanced: {
        transport: "udp" | "tcp" | "tls" | "ws" | "wss";
        custom_headers: {
            name: string;
            value: string;
        }[];
        custom_variables: {
            name: string;
            value: string;
        }[];
        dialplan_context: string;
        local_net: string;
        externrefresh: number;
        outbound_proxy?: string | undefined;
        externip?: string | undefined;
        externhost?: string | undefined;
    };
    store_id?: string | undefined;
}, {
    tenant_id: string;
    extension: string;
    password: string;
    display_name: string;
    realm: string;
    security: {
        max_concurrent_calls?: number | undefined;
        ip_whitelist?: string[] | undefined;
        ip_blacklist?: string[] | undefined;
        password_expiry_days?: number | undefined;
        require_secure_rtp?: boolean | undefined;
        encryption_method?: "none" | "srtp" | "zrtp" | undefined;
    };
    sip_settings: {
        type?: "user" | "friend" | "peer" | undefined;
        language?: string | undefined;
        host?: string | undefined;
        port?: number | undefined;
        username?: string | undefined;
        caller_id_number?: string | undefined;
        caller_id_name?: string | undefined;
        auth_username?: string | undefined;
        auth_password?: string | undefined;
        context?: string | undefined;
        nat?: "force_rport" | "comedia" | "auto_force_rport" | "auto_comedia" | undefined;
        qualify?: boolean | undefined;
        qualify_freq?: number | undefined;
        canreinvite?: boolean | undefined;
        dtmfmode?: "rfc2833" | "inband" | "info" | undefined;
        disallow?: string[] | undefined;
        allow?: string[] | undefined;
        directmedia?: boolean | undefined;
        trustrpid?: boolean | undefined;
        sendrpid?: boolean | undefined;
        callgroup?: string | undefined;
        pickupgroup?: string | undefined;
        musicclass?: string | undefined;
        mohsuggest?: string | undefined;
        parkinglot?: string | undefined;
        hasvoicemail?: boolean | undefined;
        mailbox?: string | undefined;
        attach?: string | undefined;
        cid_masquerade?: string | undefined;
        callingpres?: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib" | undefined;
        restrictcid?: boolean | undefined;
        outboundcid?: string | undefined;
        accountcode?: string | undefined;
        amaflags?: "default" | "omit" | "billing" | "documentation" | undefined;
        callcounter?: boolean | undefined;
        busylevel?: number | undefined;
        ringinuse?: boolean | undefined;
        setvar?: string[] | undefined;
        useragent?: string | undefined;
        lastms?: number | undefined;
        regserver?: string | undefined;
        regseconds?: number | undefined;
        fullcontact?: string | undefined;
        ipaddr?: string | undefined;
        defaultip?: string | undefined;
        defaultuser?: string | undefined;
        secret?: string | undefined;
        regexten?: string | undefined;
        vmexten?: string | undefined;
        callbackextension?: string | undefined;
        namedcallgroup?: string | undefined;
        namedpickupgroup?: string | undefined;
        namedcontext?: string | undefined;
        subscribecontext?: string | undefined;
        musiconhold?: string | undefined;
        permit?: string | undefined;
        deny?: string | undefined;
        calllimit?: number | undefined;
        rtpkeepalive?: number | undefined;
        rtp_timeout?: number | undefined;
        rtp_hold_timeout?: number | undefined;
        rfc2833compensate?: boolean | undefined;
        session_timers?: boolean | undefined;
        session_expires?: number | undefined;
        session_minse?: number | undefined;
        session_refresher?: "uac" | "uas" | undefined;
        t38pt_udptl?: boolean | undefined;
        t38pt_rtp?: boolean | undefined;
        t38pt_tcp?: boolean | undefined;
        t38pt_usertpsource?: string | undefined;
        t38pt_rtp_udptl?: boolean | undefined;
        faxdetect_audio?: boolean | undefined;
        faxdetect_modem?: boolean | undefined;
        faxdetect_ced?: boolean | undefined;
        faxdetect_cng?: boolean | undefined;
        faxdetect_audio_silence_threshold?: number | undefined;
        faxdetect_audio_silence_duration?: number | undefined;
        faxdetect_audio_energy_threshold?: number | undefined;
        faxdetect_audio_energy_duration?: number | undefined;
        faxdetect_modem_silence_threshold?: number | undefined;
        faxdetect_modem_silence_duration?: number | undefined;
        faxdetect_modem_energy_threshold?: number | undefined;
        faxdetect_modem_energy_duration?: number | undefined;
        faxdetect_ced_silence_threshold?: number | undefined;
        faxdetect_ced_silence_duration?: number | undefined;
        faxdetect_ced_energy_threshold?: number | undefined;
        faxdetect_ced_energy_duration?: number | undefined;
        faxdetect_cng_silence_threshold?: number | undefined;
        faxdetect_cng_silence_duration?: number | undefined;
        faxdetect_cng_energy_threshold?: number | undefined;
        faxdetect_cng_energy_duration?: number | undefined;
    };
    call_features: {
        voicemail: {
            enabled?: boolean | undefined;
            password?: string | undefined;
            email_notification?: boolean | undefined;
            email_address?: string | undefined;
            delete_after_email?: boolean | undefined;
            attach_audio?: boolean | undefined;
            max_messages?: number | undefined;
            max_message_length?: number | undefined;
        };
        call_forwarding: {
            enabled?: boolean | undefined;
            destination?: string | undefined;
            no_answer_timeout?: number | undefined;
            busy_destination?: string | undefined;
            unavailable_destination?: string | undefined;
        };
        call_waiting: {
            enabled?: boolean | undefined;
            tone_frequency?: number | undefined;
            tone_duration?: number | undefined;
        };
        do_not_disturb: {
            message?: string | undefined;
            enabled?: boolean | undefined;
        };
        recording: {
            enabled?: boolean | undefined;
            auto_record?: boolean | undefined;
            record_internal?: boolean | undefined;
            record_external?: boolean | undefined;
            consent_required?: boolean | undefined;
        };
    };
    advanced: {
        transport?: "udp" | "tcp" | "tls" | "ws" | "wss" | undefined;
        custom_headers?: {
            name: string;
            value: string;
        }[] | undefined;
        custom_variables?: {
            name: string;
            value: string;
        }[] | undefined;
        dialplan_context?: string | undefined;
        outbound_proxy?: string | undefined;
        local_net?: string | undefined;
        externip?: string | undefined;
        externhost?: string | undefined;
        externrefresh?: number | undefined;
    };
    store_id?: string | undefined;
}>;
export type SipExtensionConfig = z.infer<typeof SipExtensionConfigSchema>;
export declare const SipTrunkConfigSchema: z.ZodObject<{
    name: z.ZodString;
    host: z.ZodString;
    port: z.ZodDefault<z.ZodNumber>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    from_user: z.ZodOptional<z.ZodString>;
    from_domain: z.ZodString;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    sip_settings: z.ZodObject<{
        type: z.ZodDefault<z.ZodEnum<["friend", "user", "peer"]>>;
        context: z.ZodDefault<z.ZodString>;
        host: z.ZodString;
        port: z.ZodDefault<z.ZodNumber>;
        username: z.ZodOptional<z.ZodString>;
        secret: z.ZodOptional<z.ZodString>;
        fromuser: z.ZodOptional<z.ZodString>;
        fromdomain: z.ZodOptional<z.ZodString>;
        callerid: z.ZodOptional<z.ZodString>;
        calleridname: z.ZodOptional<z.ZodString>;
        calleridpres: z.ZodDefault<z.ZodEnum<["allowed_not_screened", "allowed_passed_screen", "allowed_failed_screen", "allowed", "prohib_not_screened", "prohib_passed_screen", "prohib_failed_screen", "prohib"]>>;
        nat: z.ZodDefault<z.ZodEnum<["force_rport", "comedia", "auto_force_rport", "auto_comedia"]>>;
        qualify: z.ZodDefault<z.ZodBoolean>;
        qualifyfreq: z.ZodDefault<z.ZodNumber>;
        canreinvite: z.ZodDefault<z.ZodBoolean>;
        dtmfmode: z.ZodDefault<z.ZodEnum<["rfc2833", "inband", "info"]>>;
        disallow: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        allow: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        directmedia: z.ZodDefault<z.ZodBoolean>;
        trustrpid: z.ZodDefault<z.ZodBoolean>;
        sendrpid: z.ZodDefault<z.ZodBoolean>;
        callgroup: z.ZodOptional<z.ZodString>;
        pickupgroup: z.ZodOptional<z.ZodString>;
        musicclass: z.ZodDefault<z.ZodString>;
        mohsuggest: z.ZodDefault<z.ZodString>;
        parkinglot: z.ZodOptional<z.ZodString>;
        hasvoicemail: z.ZodDefault<z.ZodBoolean>;
        mailbox: z.ZodOptional<z.ZodString>;
        attach: z.ZodOptional<z.ZodString>;
        cid_masquerade: z.ZodOptional<z.ZodString>;
        callingpres: z.ZodDefault<z.ZodEnum<["allowed_not_screened", "allowed_passed_screen", "allowed_failed_screen", "allowed", "prohib_not_screened", "prohib_passed_screen", "prohib_failed_screen", "prohib"]>>;
        restrictcid: z.ZodDefault<z.ZodBoolean>;
        outboundcid: z.ZodOptional<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
        accountcode: z.ZodOptional<z.ZodString>;
        amaflags: z.ZodDefault<z.ZodEnum<["default", "omit", "billing", "documentation"]>>;
        callcounter: z.ZodDefault<z.ZodBoolean>;
        busylevel: z.ZodDefault<z.ZodNumber>;
        ringinuse: z.ZodDefault<z.ZodBoolean>;
        setvar: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        useragent: z.ZodOptional<z.ZodString>;
        lastms: z.ZodOptional<z.ZodNumber>;
        regserver: z.ZodOptional<z.ZodString>;
        regseconds: z.ZodOptional<z.ZodNumber>;
        fullcontact: z.ZodOptional<z.ZodString>;
        ipaddr: z.ZodOptional<z.ZodString>;
        defaultip: z.ZodOptional<z.ZodString>;
        defaultuser: z.ZodOptional<z.ZodString>;
        regexten: z.ZodOptional<z.ZodString>;
        vmexten: z.ZodOptional<z.ZodString>;
        callbackextension: z.ZodOptional<z.ZodString>;
        namedcallgroup: z.ZodOptional<z.ZodString>;
        namedpickupgroup: z.ZodOptional<z.ZodString>;
        namedcontext: z.ZodOptional<z.ZodString>;
        subscribecontext: z.ZodOptional<z.ZodString>;
        musiconhold: z.ZodOptional<z.ZodString>;
        permit: z.ZodOptional<z.ZodString>;
        deny: z.ZodOptional<z.ZodString>;
        calllimit: z.ZodOptional<z.ZodNumber>;
        rtpkeepalive: z.ZodDefault<z.ZodNumber>;
        rtp_timeout: z.ZodDefault<z.ZodNumber>;
        rtp_hold_timeout: z.ZodDefault<z.ZodNumber>;
        rfc2833compensate: z.ZodDefault<z.ZodBoolean>;
        session_timers: z.ZodDefault<z.ZodBoolean>;
        session_expires: z.ZodDefault<z.ZodNumber>;
        session_minse: z.ZodDefault<z.ZodNumber>;
        session_refresher: z.ZodDefault<z.ZodEnum<["uac", "uas"]>>;
        t38pt_udptl: z.ZodDefault<z.ZodBoolean>;
        t38pt_rtp: z.ZodDefault<z.ZodBoolean>;
        t38pt_tcp: z.ZodDefault<z.ZodBoolean>;
        t38pt_usertpsource: z.ZodOptional<z.ZodString>;
        t38pt_rtp_udptl: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "user" | "friend" | "peer";
        language: string;
        host: string;
        port: number;
        context: string;
        nat: "force_rport" | "comedia" | "auto_force_rport" | "auto_comedia";
        qualify: boolean;
        canreinvite: boolean;
        dtmfmode: "rfc2833" | "inband" | "info";
        disallow: string[];
        allow: string[];
        directmedia: boolean;
        trustrpid: boolean;
        sendrpid: boolean;
        musicclass: string;
        mohsuggest: string;
        hasvoicemail: boolean;
        callingpres: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib";
        restrictcid: boolean;
        amaflags: "default" | "omit" | "billing" | "documentation";
        callcounter: boolean;
        busylevel: number;
        ringinuse: boolean;
        setvar: string[];
        rtpkeepalive: number;
        rtp_timeout: number;
        rtp_hold_timeout: number;
        rfc2833compensate: boolean;
        session_timers: boolean;
        session_expires: number;
        session_minse: number;
        session_refresher: "uac" | "uas";
        t38pt_udptl: boolean;
        t38pt_rtp: boolean;
        t38pt_tcp: boolean;
        t38pt_rtp_udptl: boolean;
        calleridpres: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib";
        qualifyfreq: number;
        username?: string | undefined;
        callgroup?: string | undefined;
        pickupgroup?: string | undefined;
        parkinglot?: string | undefined;
        mailbox?: string | undefined;
        attach?: string | undefined;
        cid_masquerade?: string | undefined;
        outboundcid?: string | undefined;
        accountcode?: string | undefined;
        useragent?: string | undefined;
        lastms?: number | undefined;
        regserver?: string | undefined;
        regseconds?: number | undefined;
        fullcontact?: string | undefined;
        ipaddr?: string | undefined;
        defaultip?: string | undefined;
        defaultuser?: string | undefined;
        secret?: string | undefined;
        regexten?: string | undefined;
        vmexten?: string | undefined;
        callbackextension?: string | undefined;
        namedcallgroup?: string | undefined;
        namedpickupgroup?: string | undefined;
        namedcontext?: string | undefined;
        subscribecontext?: string | undefined;
        musiconhold?: string | undefined;
        permit?: string | undefined;
        deny?: string | undefined;
        calllimit?: number | undefined;
        t38pt_usertpsource?: string | undefined;
        fromuser?: string | undefined;
        fromdomain?: string | undefined;
        callerid?: string | undefined;
        calleridname?: string | undefined;
    }, {
        host: string;
        type?: "user" | "friend" | "peer" | undefined;
        language?: string | undefined;
        port?: number | undefined;
        username?: string | undefined;
        context?: string | undefined;
        nat?: "force_rport" | "comedia" | "auto_force_rport" | "auto_comedia" | undefined;
        qualify?: boolean | undefined;
        canreinvite?: boolean | undefined;
        dtmfmode?: "rfc2833" | "inband" | "info" | undefined;
        disallow?: string[] | undefined;
        allow?: string[] | undefined;
        directmedia?: boolean | undefined;
        trustrpid?: boolean | undefined;
        sendrpid?: boolean | undefined;
        callgroup?: string | undefined;
        pickupgroup?: string | undefined;
        musicclass?: string | undefined;
        mohsuggest?: string | undefined;
        parkinglot?: string | undefined;
        hasvoicemail?: boolean | undefined;
        mailbox?: string | undefined;
        attach?: string | undefined;
        cid_masquerade?: string | undefined;
        callingpres?: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib" | undefined;
        restrictcid?: boolean | undefined;
        outboundcid?: string | undefined;
        accountcode?: string | undefined;
        amaflags?: "default" | "omit" | "billing" | "documentation" | undefined;
        callcounter?: boolean | undefined;
        busylevel?: number | undefined;
        ringinuse?: boolean | undefined;
        setvar?: string[] | undefined;
        useragent?: string | undefined;
        lastms?: number | undefined;
        regserver?: string | undefined;
        regseconds?: number | undefined;
        fullcontact?: string | undefined;
        ipaddr?: string | undefined;
        defaultip?: string | undefined;
        defaultuser?: string | undefined;
        secret?: string | undefined;
        regexten?: string | undefined;
        vmexten?: string | undefined;
        callbackextension?: string | undefined;
        namedcallgroup?: string | undefined;
        namedpickupgroup?: string | undefined;
        namedcontext?: string | undefined;
        subscribecontext?: string | undefined;
        musiconhold?: string | undefined;
        permit?: string | undefined;
        deny?: string | undefined;
        calllimit?: number | undefined;
        rtpkeepalive?: number | undefined;
        rtp_timeout?: number | undefined;
        rtp_hold_timeout?: number | undefined;
        rfc2833compensate?: boolean | undefined;
        session_timers?: boolean | undefined;
        session_expires?: number | undefined;
        session_minse?: number | undefined;
        session_refresher?: "uac" | "uas" | undefined;
        t38pt_udptl?: boolean | undefined;
        t38pt_rtp?: boolean | undefined;
        t38pt_tcp?: boolean | undefined;
        t38pt_usertpsource?: string | undefined;
        t38pt_rtp_udptl?: boolean | undefined;
        fromuser?: string | undefined;
        fromdomain?: string | undefined;
        callerid?: string | undefined;
        calleridname?: string | undefined;
        calleridpres?: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib" | undefined;
        qualifyfreq?: number | undefined;
    }>;
    registration: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        auth_username: z.ZodOptional<z.ZodString>;
        auth_password: z.ZodOptional<z.ZodString>;
        auth_realm: z.ZodOptional<z.ZodString>;
        refresh_interval: z.ZodDefault<z.ZodNumber>;
        retry_interval: z.ZodDefault<z.ZodNumber>;
        max_retries: z.ZodDefault<z.ZodNumber>;
        expire: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        refresh_interval: number;
        retry_interval: number;
        max_retries: number;
        expire: number;
        auth_username?: string | undefined;
        auth_password?: string | undefined;
        auth_realm?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        auth_username?: string | undefined;
        auth_password?: string | undefined;
        auth_realm?: string | undefined;
        refresh_interval?: number | undefined;
        retry_interval?: number | undefined;
        max_retries?: number | undefined;
        expire?: number | undefined;
    }>;
    security: z.ZodObject<{
        ip_whitelist: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        ip_blacklist: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        max_concurrent_calls: z.ZodDefault<z.ZodNumber>;
        require_secure_rtp: z.ZodDefault<z.ZodBoolean>;
        encryption_method: z.ZodDefault<z.ZodEnum<["none", "srtp", "zrtp"]>>;
        authentication: z.ZodDefault<z.ZodEnum<["none", "md5", "sha1"]>>;
    }, "strip", z.ZodTypeAny, {
        max_concurrent_calls: number;
        authentication: "none" | "md5" | "sha1";
        ip_whitelist: string[];
        ip_blacklist: string[];
        require_secure_rtp: boolean;
        encryption_method: "none" | "srtp" | "zrtp";
    }, {
        max_concurrent_calls?: number | undefined;
        authentication?: "none" | "md5" | "sha1" | undefined;
        ip_whitelist?: string[] | undefined;
        ip_blacklist?: string[] | undefined;
        require_secure_rtp?: boolean | undefined;
        encryption_method?: "none" | "srtp" | "zrtp" | undefined;
    }>;
    advanced: z.ZodObject<{
        custom_headers: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            value: string;
        }, {
            name: string;
            value: string;
        }>, "many">>;
        custom_variables: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            value: string;
        }, {
            name: string;
            value: string;
        }>, "many">>;
        dialplan_context: z.ZodDefault<z.ZodString>;
        outbound_proxy: z.ZodOptional<z.ZodString>;
        transport: z.ZodDefault<z.ZodEnum<["udp", "tcp", "tls", "ws", "wss"]>>;
        local_net: z.ZodDefault<z.ZodString>;
        externip: z.ZodOptional<z.ZodString>;
        externhost: z.ZodOptional<z.ZodString>;
        externrefresh: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        transport: "udp" | "tcp" | "tls" | "ws" | "wss";
        custom_headers: {
            name: string;
            value: string;
        }[];
        custom_variables: {
            name: string;
            value: string;
        }[];
        dialplan_context: string;
        local_net: string;
        externrefresh: number;
        outbound_proxy?: string | undefined;
        externip?: string | undefined;
        externhost?: string | undefined;
    }, {
        transport?: "udp" | "tcp" | "tls" | "ws" | "wss" | undefined;
        custom_headers?: {
            name: string;
            value: string;
        }[] | undefined;
        custom_variables?: {
            name: string;
            value: string;
        }[] | undefined;
        dialplan_context?: string | undefined;
        outbound_proxy?: string | undefined;
        local_net?: string | undefined;
        externip?: string | undefined;
        externhost?: string | undefined;
        externrefresh?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tenant_id: string;
    host: string;
    port: number;
    from_domain: string;
    security: {
        max_concurrent_calls: number;
        authentication: "none" | "md5" | "sha1";
        ip_whitelist: string[];
        ip_blacklist: string[];
        require_secure_rtp: boolean;
        encryption_method: "none" | "srtp" | "zrtp";
    };
    sip_settings: {
        type: "user" | "friend" | "peer";
        language: string;
        host: string;
        port: number;
        context: string;
        nat: "force_rport" | "comedia" | "auto_force_rport" | "auto_comedia";
        qualify: boolean;
        canreinvite: boolean;
        dtmfmode: "rfc2833" | "inband" | "info";
        disallow: string[];
        allow: string[];
        directmedia: boolean;
        trustrpid: boolean;
        sendrpid: boolean;
        musicclass: string;
        mohsuggest: string;
        hasvoicemail: boolean;
        callingpres: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib";
        restrictcid: boolean;
        amaflags: "default" | "omit" | "billing" | "documentation";
        callcounter: boolean;
        busylevel: number;
        ringinuse: boolean;
        setvar: string[];
        rtpkeepalive: number;
        rtp_timeout: number;
        rtp_hold_timeout: number;
        rfc2833compensate: boolean;
        session_timers: boolean;
        session_expires: number;
        session_minse: number;
        session_refresher: "uac" | "uas";
        t38pt_udptl: boolean;
        t38pt_rtp: boolean;
        t38pt_tcp: boolean;
        t38pt_rtp_udptl: boolean;
        calleridpres: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib";
        qualifyfreq: number;
        username?: string | undefined;
        callgroup?: string | undefined;
        pickupgroup?: string | undefined;
        parkinglot?: string | undefined;
        mailbox?: string | undefined;
        attach?: string | undefined;
        cid_masquerade?: string | undefined;
        outboundcid?: string | undefined;
        accountcode?: string | undefined;
        useragent?: string | undefined;
        lastms?: number | undefined;
        regserver?: string | undefined;
        regseconds?: number | undefined;
        fullcontact?: string | undefined;
        ipaddr?: string | undefined;
        defaultip?: string | undefined;
        defaultuser?: string | undefined;
        secret?: string | undefined;
        regexten?: string | undefined;
        vmexten?: string | undefined;
        callbackextension?: string | undefined;
        namedcallgroup?: string | undefined;
        namedpickupgroup?: string | undefined;
        namedcontext?: string | undefined;
        subscribecontext?: string | undefined;
        musiconhold?: string | undefined;
        permit?: string | undefined;
        deny?: string | undefined;
        calllimit?: number | undefined;
        t38pt_usertpsource?: string | undefined;
        fromuser?: string | undefined;
        fromdomain?: string | undefined;
        callerid?: string | undefined;
        calleridname?: string | undefined;
    };
    advanced: {
        transport: "udp" | "tcp" | "tls" | "ws" | "wss";
        custom_headers: {
            name: string;
            value: string;
        }[];
        custom_variables: {
            name: string;
            value: string;
        }[];
        dialplan_context: string;
        local_net: string;
        externrefresh: number;
        outbound_proxy?: string | undefined;
        externip?: string | undefined;
        externhost?: string | undefined;
    };
    registration: {
        enabled: boolean;
        refresh_interval: number;
        retry_interval: number;
        max_retries: number;
        expire: number;
        auth_username?: string | undefined;
        auth_password?: string | undefined;
        auth_realm?: string | undefined;
    };
    store_id?: string | undefined;
    password?: string | undefined;
    username?: string | undefined;
    from_user?: string | undefined;
}, {
    name: string;
    tenant_id: string;
    host: string;
    from_domain: string;
    security: {
        max_concurrent_calls?: number | undefined;
        authentication?: "none" | "md5" | "sha1" | undefined;
        ip_whitelist?: string[] | undefined;
        ip_blacklist?: string[] | undefined;
        require_secure_rtp?: boolean | undefined;
        encryption_method?: "none" | "srtp" | "zrtp" | undefined;
    };
    sip_settings: {
        host: string;
        type?: "user" | "friend" | "peer" | undefined;
        language?: string | undefined;
        port?: number | undefined;
        username?: string | undefined;
        context?: string | undefined;
        nat?: "force_rport" | "comedia" | "auto_force_rport" | "auto_comedia" | undefined;
        qualify?: boolean | undefined;
        canreinvite?: boolean | undefined;
        dtmfmode?: "rfc2833" | "inband" | "info" | undefined;
        disallow?: string[] | undefined;
        allow?: string[] | undefined;
        directmedia?: boolean | undefined;
        trustrpid?: boolean | undefined;
        sendrpid?: boolean | undefined;
        callgroup?: string | undefined;
        pickupgroup?: string | undefined;
        musicclass?: string | undefined;
        mohsuggest?: string | undefined;
        parkinglot?: string | undefined;
        hasvoicemail?: boolean | undefined;
        mailbox?: string | undefined;
        attach?: string | undefined;
        cid_masquerade?: string | undefined;
        callingpres?: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib" | undefined;
        restrictcid?: boolean | undefined;
        outboundcid?: string | undefined;
        accountcode?: string | undefined;
        amaflags?: "default" | "omit" | "billing" | "documentation" | undefined;
        callcounter?: boolean | undefined;
        busylevel?: number | undefined;
        ringinuse?: boolean | undefined;
        setvar?: string[] | undefined;
        useragent?: string | undefined;
        lastms?: number | undefined;
        regserver?: string | undefined;
        regseconds?: number | undefined;
        fullcontact?: string | undefined;
        ipaddr?: string | undefined;
        defaultip?: string | undefined;
        defaultuser?: string | undefined;
        secret?: string | undefined;
        regexten?: string | undefined;
        vmexten?: string | undefined;
        callbackextension?: string | undefined;
        namedcallgroup?: string | undefined;
        namedpickupgroup?: string | undefined;
        namedcontext?: string | undefined;
        subscribecontext?: string | undefined;
        musiconhold?: string | undefined;
        permit?: string | undefined;
        deny?: string | undefined;
        calllimit?: number | undefined;
        rtpkeepalive?: number | undefined;
        rtp_timeout?: number | undefined;
        rtp_hold_timeout?: number | undefined;
        rfc2833compensate?: boolean | undefined;
        session_timers?: boolean | undefined;
        session_expires?: number | undefined;
        session_minse?: number | undefined;
        session_refresher?: "uac" | "uas" | undefined;
        t38pt_udptl?: boolean | undefined;
        t38pt_rtp?: boolean | undefined;
        t38pt_tcp?: boolean | undefined;
        t38pt_usertpsource?: string | undefined;
        t38pt_rtp_udptl?: boolean | undefined;
        fromuser?: string | undefined;
        fromdomain?: string | undefined;
        callerid?: string | undefined;
        calleridname?: string | undefined;
        calleridpres?: "allowed_not_screened" | "allowed_passed_screen" | "allowed_failed_screen" | "allowed" | "prohib_not_screened" | "prohib_passed_screen" | "prohib_failed_screen" | "prohib" | undefined;
        qualifyfreq?: number | undefined;
    };
    advanced: {
        transport?: "udp" | "tcp" | "tls" | "ws" | "wss" | undefined;
        custom_headers?: {
            name: string;
            value: string;
        }[] | undefined;
        custom_variables?: {
            name: string;
            value: string;
        }[] | undefined;
        dialplan_context?: string | undefined;
        outbound_proxy?: string | undefined;
        local_net?: string | undefined;
        externip?: string | undefined;
        externhost?: string | undefined;
        externrefresh?: number | undefined;
    };
    registration: {
        enabled?: boolean | undefined;
        auth_username?: string | undefined;
        auth_password?: string | undefined;
        auth_realm?: string | undefined;
        refresh_interval?: number | undefined;
        retry_interval?: number | undefined;
        max_retries?: number | undefined;
        expire?: number | undefined;
    };
    store_id?: string | undefined;
    password?: string | undefined;
    port?: number | undefined;
    username?: string | undefined;
    from_user?: string | undefined;
}>;
export type SipTrunkConfig = z.infer<typeof SipTrunkConfigSchema>;
export declare const CallRoutingRuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodNumber>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    conditions: z.ZodObject<{
        caller_id: z.ZodOptional<z.ZodObject<{
            number: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            pattern: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            number?: string | undefined;
            name?: string | undefined;
            pattern?: string | undefined;
        }, {
            number?: string | undefined;
            name?: string | undefined;
            pattern?: string | undefined;
        }>>;
        called_number: z.ZodOptional<z.ZodObject<{
            number: z.ZodOptional<z.ZodString>;
            pattern: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            number?: string | undefined;
            pattern?: string | undefined;
        }, {
            number?: string | undefined;
            pattern?: string | undefined;
        }>>;
        time_conditions: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            timezone: z.ZodDefault<z.ZodString>;
            schedule: z.ZodRecord<z.ZodString, z.ZodObject<{
                enabled: z.ZodDefault<z.ZodBoolean>;
                start_time: z.ZodString;
                end_time: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                start_time: string;
                end_time: string;
            }, {
                start_time: string;
                end_time: string;
                enabled?: boolean | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            timezone: string;
            enabled: boolean;
            schedule: Record<string, {
                enabled: boolean;
                start_time: string;
                end_time: string;
            }>;
        }, {
            schedule: Record<string, {
                start_time: string;
                end_time: string;
                enabled?: boolean | undefined;
            }>;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        }>>;
        day_conditions: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            days: z.ZodDefault<z.ZodArray<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, "many">>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        }, {
            enabled?: boolean | undefined;
            days?: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[] | undefined;
        }>>;
        source: z.ZodOptional<z.ZodObject<{
            trunk_id: z.ZodOptional<z.ZodString>;
            extension_id: z.ZodOptional<z.ZodString>;
            ip_address: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            ip_address?: string | undefined;
        }, {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            ip_address?: string | undefined;
        }>>;
        destination: z.ZodOptional<z.ZodObject<{
            trunk_id: z.ZodOptional<z.ZodString>;
            extension_id: z.ZodOptional<z.ZodString>;
            external_number: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            external_number?: string | undefined;
        }, {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            external_number?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        destination?: {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            external_number?: string | undefined;
        } | undefined;
        caller_id?: {
            number?: string | undefined;
            name?: string | undefined;
            pattern?: string | undefined;
        } | undefined;
        called_number?: {
            number?: string | undefined;
            pattern?: string | undefined;
        } | undefined;
        time_conditions?: {
            timezone: string;
            enabled: boolean;
            schedule: Record<string, {
                enabled: boolean;
                start_time: string;
                end_time: string;
            }>;
        } | undefined;
        day_conditions?: {
            enabled: boolean;
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        } | undefined;
        source?: {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            ip_address?: string | undefined;
        } | undefined;
    }, {
        destination?: {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            external_number?: string | undefined;
        } | undefined;
        caller_id?: {
            number?: string | undefined;
            name?: string | undefined;
            pattern?: string | undefined;
        } | undefined;
        called_number?: {
            number?: string | undefined;
            pattern?: string | undefined;
        } | undefined;
        time_conditions?: {
            schedule: Record<string, {
                start_time: string;
                end_time: string;
                enabled?: boolean | undefined;
            }>;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        } | undefined;
        day_conditions?: {
            enabled?: boolean | undefined;
            days?: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[] | undefined;
        } | undefined;
        source?: {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            ip_address?: string | undefined;
        } | undefined;
    }>;
    actions: z.ZodObject<{
        route_to: z.ZodObject<{
            type: z.ZodEnum<["extension", "trunk", "external", "voicemail", "hangup", "busy", "congestion"]>;
            target: z.ZodString;
            timeout: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "extension" | "voicemail" | "busy" | "congestion" | "hangup" | "trunk" | "external";
            timeout: number;
            target: string;
        }, {
            type: "extension" | "voicemail" | "busy" | "congestion" | "hangup" | "trunk" | "external";
            target: string;
            timeout?: number | undefined;
        }>;
        call_forwarding: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            destination: z.ZodOptional<z.ZodString>;
            timeout: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            timeout: number;
            destination?: string | undefined;
        }, {
            enabled?: boolean | undefined;
            destination?: string | undefined;
            timeout?: number | undefined;
        }>>;
        recording: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            consent_required: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            consent_required: boolean;
        }, {
            enabled?: boolean | undefined;
            consent_required?: boolean | undefined;
        }>>;
        cdr_tag: z.ZodOptional<z.ZodString>;
        custom_variables: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            value: string;
        }, {
            name: string;
            value: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        custom_variables: {
            name: string;
            value: string;
        }[];
        route_to: {
            type: "extension" | "voicemail" | "busy" | "congestion" | "hangup" | "trunk" | "external";
            timeout: number;
            target: string;
        };
        call_forwarding?: {
            enabled: boolean;
            timeout: number;
            destination?: string | undefined;
        } | undefined;
        recording?: {
            enabled: boolean;
            consent_required: boolean;
        } | undefined;
        cdr_tag?: string | undefined;
    }, {
        route_to: {
            type: "extension" | "voicemail" | "busy" | "congestion" | "hangup" | "trunk" | "external";
            target: string;
            timeout?: number | undefined;
        };
        call_forwarding?: {
            enabled?: boolean | undefined;
            destination?: string | undefined;
            timeout?: number | undefined;
        } | undefined;
        recording?: {
            enabled?: boolean | undefined;
            consent_required?: boolean | undefined;
        } | undefined;
        custom_variables?: {
            name: string;
            value: string;
        }[] | undefined;
        cdr_tag?: string | undefined;
    }>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
    created_by: z.ZodString;
    tenant_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
    tenant_id: string;
    enabled: boolean;
    priority: number;
    conditions: {
        destination?: {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            external_number?: string | undefined;
        } | undefined;
        caller_id?: {
            number?: string | undefined;
            name?: string | undefined;
            pattern?: string | undefined;
        } | undefined;
        called_number?: {
            number?: string | undefined;
            pattern?: string | undefined;
        } | undefined;
        time_conditions?: {
            timezone: string;
            enabled: boolean;
            schedule: Record<string, {
                enabled: boolean;
                start_time: string;
                end_time: string;
            }>;
        } | undefined;
        day_conditions?: {
            enabled: boolean;
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        } | undefined;
        source?: {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            ip_address?: string | undefined;
        } | undefined;
    };
    actions: {
        custom_variables: {
            name: string;
            value: string;
        }[];
        route_to: {
            type: "extension" | "voicemail" | "busy" | "congestion" | "hangup" | "trunk" | "external";
            timeout: number;
            target: string;
        };
        call_forwarding?: {
            enabled: boolean;
            timeout: number;
            destination?: string | undefined;
        } | undefined;
        recording?: {
            enabled: boolean;
            consent_required: boolean;
        } | undefined;
        cdr_tag?: string | undefined;
    };
    created_by: string;
    description?: string | undefined;
}, {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
    tenant_id: string;
    conditions: {
        destination?: {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            external_number?: string | undefined;
        } | undefined;
        caller_id?: {
            number?: string | undefined;
            name?: string | undefined;
            pattern?: string | undefined;
        } | undefined;
        called_number?: {
            number?: string | undefined;
            pattern?: string | undefined;
        } | undefined;
        time_conditions?: {
            schedule: Record<string, {
                start_time: string;
                end_time: string;
                enabled?: boolean | undefined;
            }>;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        } | undefined;
        day_conditions?: {
            enabled?: boolean | undefined;
            days?: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[] | undefined;
        } | undefined;
        source?: {
            extension_id?: string | undefined;
            trunk_id?: string | undefined;
            ip_address?: string | undefined;
        } | undefined;
    };
    actions: {
        route_to: {
            type: "extension" | "voicemail" | "busy" | "congestion" | "hangup" | "trunk" | "external";
            target: string;
            timeout?: number | undefined;
        };
        call_forwarding?: {
            enabled?: boolean | undefined;
            destination?: string | undefined;
            timeout?: number | undefined;
        } | undefined;
        recording?: {
            enabled?: boolean | undefined;
            consent_required?: boolean | undefined;
        } | undefined;
        custom_variables?: {
            name: string;
            value: string;
        }[] | undefined;
        cdr_tag?: string | undefined;
    };
    created_by: string;
    enabled?: boolean | undefined;
    description?: string | undefined;
    priority?: number | undefined;
}>;
export type CallRoutingRule = z.infer<typeof CallRoutingRuleSchema>;
export declare const SipRegistrationStatusInfoSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["extension", "trunk"]>;
    status: z.ZodEnum<["registered", "unregistered", "failed", "expired", "unknown"]>;
    last_registration: z.ZodOptional<z.ZodDate>;
    last_unregistration: z.ZodOptional<z.ZodDate>;
    registration_attempts: z.ZodDefault<z.ZodNumber>;
    last_error: z.ZodOptional<z.ZodString>;
    ip_address: z.ZodOptional<z.ZodString>;
    port: z.ZodOptional<z.ZodNumber>;
    user_agent: z.ZodOptional<z.ZodString>;
    expires: z.ZodOptional<z.ZodNumber>;
    contact: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    status: "unknown" | "registered" | "unregistered" | "failed" | "expired";
    type: "extension" | "trunk";
    tenant_id: string;
    registration_attempts: number;
    port?: number | undefined;
    ip_address?: string | undefined;
    last_registration?: Date | undefined;
    last_unregistration?: Date | undefined;
    last_error?: string | undefined;
    user_agent?: string | undefined;
    expires?: number | undefined;
    contact?: string | undefined;
}, {
    id: string;
    name: string;
    status: "unknown" | "registered" | "unregistered" | "failed" | "expired";
    type: "extension" | "trunk";
    tenant_id: string;
    port?: number | undefined;
    ip_address?: string | undefined;
    last_registration?: Date | undefined;
    last_unregistration?: Date | undefined;
    registration_attempts?: number | undefined;
    last_error?: string | undefined;
    user_agent?: string | undefined;
    expires?: number | undefined;
    contact?: string | undefined;
}>;
export type SipRegistrationStatusInfo = z.infer<typeof SipRegistrationStatusInfoSchema>;
export declare const InboundRouteSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    did_number: z.ZodString;
    caller_id_name: z.ZodOptional<z.ZodString>;
    caller_id_number: z.ZodOptional<z.ZodString>;
    destination_type: z.ZodEnum<["extension", "ring_group", "queue", "voicemail", "ivr", "conference", "external"]>;
    destination_value: z.ZodString;
    time_condition_id: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    caller_id_override: z.ZodDefault<z.ZodBoolean>;
    caller_id_name_override: z.ZodOptional<z.ZodString>;
    caller_id_number_override: z.ZodOptional<z.ZodString>;
    record_calls: z.ZodDefault<z.ZodBoolean>;
    recording_path: z.ZodOptional<z.ZodString>;
    failover_enabled: z.ZodDefault<z.ZodBoolean>;
    failover_destination_type: z.ZodOptional<z.ZodEnum<["extension", "voicemail", "external"]>>;
    failover_destination_value: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tenant_id: string;
    enabled: boolean;
    did_number: string;
    destination_type: "extension" | "queue" | "conference" | "voicemail" | "external" | "ring_group" | "ivr";
    destination_value: string;
    caller_id_override: boolean;
    record_calls: boolean;
    failover_enabled: boolean;
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    caller_id_number?: string | undefined;
    caller_id_name?: string | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    time_condition_id?: string | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    failover_destination_type?: "extension" | "voicemail" | "external" | undefined;
    failover_destination_value?: string | undefined;
}, {
    name: string;
    tenant_id: string;
    did_number: string;
    destination_type: "extension" | "queue" | "conference" | "voicemail" | "external" | "ring_group" | "ivr";
    destination_value: string;
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    enabled?: boolean | undefined;
    caller_id_number?: string | undefined;
    caller_id_name?: string | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    time_condition_id?: string | undefined;
    caller_id_override?: boolean | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    record_calls?: boolean | undefined;
    failover_enabled?: boolean | undefined;
    failover_destination_type?: "extension" | "voicemail" | "external" | undefined;
    failover_destination_value?: string | undefined;
}>;
export type InboundRoute = z.infer<typeof InboundRouteSchema>;
export declare const OutboundRouteSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    dial_pattern: z.ZodString;
    caller_id_name: z.ZodOptional<z.ZodString>;
    caller_id_number: z.ZodOptional<z.ZodString>;
    trunk_id: z.ZodString;
    prefix: z.ZodOptional<z.ZodString>;
    strip_digits: z.ZodDefault<z.ZodNumber>;
    add_digits: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    caller_id_override: z.ZodDefault<z.ZodBoolean>;
    caller_id_name_override: z.ZodOptional<z.ZodString>;
    caller_id_number_override: z.ZodOptional<z.ZodString>;
    record_calls: z.ZodDefault<z.ZodBoolean>;
    recording_path: z.ZodOptional<z.ZodString>;
    failover_trunk_id: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tenant_id: string;
    enabled: boolean;
    trunk_id: string;
    caller_id_override: boolean;
    record_calls: boolean;
    dial_pattern: string;
    strip_digits: number;
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    caller_id_number?: string | undefined;
    caller_id_name?: string | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    prefix?: string | undefined;
    add_digits?: string | undefined;
    failover_trunk_id?: string | undefined;
}, {
    name: string;
    tenant_id: string;
    trunk_id: string;
    dial_pattern: string;
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    enabled?: boolean | undefined;
    caller_id_number?: string | undefined;
    caller_id_name?: string | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    caller_id_override?: boolean | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    record_calls?: boolean | undefined;
    prefix?: string | undefined;
    strip_digits?: number | undefined;
    add_digits?: string | undefined;
    failover_trunk_id?: string | undefined;
}>;
export type OutboundRoute = z.infer<typeof OutboundRouteSchema>;
export declare const TimeConditionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    business_hours: z.ZodObject<{
        monday: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            start_time: z.ZodString;
            end_time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            start_time: string;
            end_time: string;
        }, {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        }>>;
        tuesday: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            start_time: z.ZodString;
            end_time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            start_time: string;
            end_time: string;
        }, {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        }>>;
        wednesday: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            start_time: z.ZodString;
            end_time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            start_time: string;
            end_time: string;
        }, {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        }>>;
        thursday: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            start_time: z.ZodString;
            end_time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            start_time: string;
            end_time: string;
        }, {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        }>>;
        friday: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            start_time: z.ZodString;
            end_time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            start_time: string;
            end_time: string;
        }, {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        }>>;
        saturday: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            start_time: z.ZodString;
            end_time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            start_time: string;
            end_time: string;
        }, {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        }>>;
        sunday: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            start_time: z.ZodString;
            end_time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            start_time: string;
            end_time: string;
        }, {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        monday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        tuesday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        wednesday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        thursday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        friday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        saturday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        sunday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
    }, {
        monday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        tuesday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        wednesday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        thursday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        friday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        saturday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        sunday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
    }>;
    holidays: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        date: z.ZodString;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        date: string;
        enabled: boolean;
    }, {
        name: string;
        date: string;
        enabled?: boolean | undefined;
    }>, "many">>;
    business_hours_action: z.ZodDefault<z.ZodEnum<["continue", "voicemail", "external", "hangup"]>>;
    business_hours_destination: z.ZodOptional<z.ZodString>;
    after_hours_action: z.ZodDefault<z.ZodEnum<["voicemail", "external", "hangup"]>>;
    after_hours_destination: z.ZodOptional<z.ZodString>;
    holiday_action: z.ZodDefault<z.ZodEnum<["voicemail", "external", "hangup"]>>;
    holiday_destination: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    timezone: string;
    tenant_id: string;
    business_hours: {
        monday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        tuesday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        wednesday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        thursday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        friday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        saturday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
        sunday?: {
            enabled: boolean;
            start_time: string;
            end_time: string;
        } | undefined;
    };
    enabled: boolean;
    holidays: {
        name: string;
        date: string;
        enabled: boolean;
    }[];
    business_hours_action: "voicemail" | "hangup" | "external" | "continue";
    after_hours_action: "voicemail" | "hangup" | "external";
    holiday_action: "voicemail" | "hangup" | "external";
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    description?: string | undefined;
    business_hours_destination?: string | undefined;
    after_hours_destination?: string | undefined;
    holiday_destination?: string | undefined;
}, {
    name: string;
    tenant_id: string;
    business_hours: {
        monday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        tuesday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        wednesday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        thursday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        friday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        saturday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
        sunday?: {
            start_time: string;
            end_time: string;
            enabled?: boolean | undefined;
        } | undefined;
    };
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    timezone?: string | undefined;
    store_id?: string | undefined;
    enabled?: boolean | undefined;
    description?: string | undefined;
    holidays?: {
        name: string;
        date: string;
        enabled?: boolean | undefined;
    }[] | undefined;
    business_hours_action?: "voicemail" | "hangup" | "external" | "continue" | undefined;
    business_hours_destination?: string | undefined;
    after_hours_action?: "voicemail" | "hangup" | "external" | undefined;
    after_hours_destination?: string | undefined;
    holiday_action?: "voicemail" | "hangup" | "external" | undefined;
    holiday_destination?: string | undefined;
}>;
export type TimeCondition = z.infer<typeof TimeConditionSchema>;
export declare const IvrMenuSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    greeting_message: z.ZodOptional<z.ZodString>;
    invalid_message: z.ZodOptional<z.ZodString>;
    timeout_message: z.ZodOptional<z.ZodString>;
    timeout_seconds: z.ZodDefault<z.ZodNumber>;
    max_failures: z.ZodDefault<z.ZodNumber>;
    options: z.ZodArray<z.ZodObject<{
        digit: z.ZodString;
        action: z.ZodEnum<["extension", "ring_group", "queue", "voicemail", "ivr", "conference", "external", "hangup"]>;
        destination: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        destination: string;
        action: "extension" | "queue" | "conference" | "voicemail" | "hangup" | "external" | "ring_group" | "ivr";
        digit: string;
        description?: string | undefined;
    }, {
        destination: string;
        action: "extension" | "queue" | "conference" | "voicemail" | "hangup" | "external" | "ring_group" | "ivr";
        digit: string;
        description?: string | undefined;
    }>, "many">;
    default_action: z.ZodDefault<z.ZodEnum<["extension", "ring_group", "queue", "voicemail", "ivr", "conference", "external", "hangup"]>>;
    default_destination: z.ZodOptional<z.ZodString>;
    caller_id_override: z.ZodDefault<z.ZodBoolean>;
    caller_id_name_override: z.ZodOptional<z.ZodString>;
    caller_id_number_override: z.ZodOptional<z.ZodString>;
    record_calls: z.ZodDefault<z.ZodBoolean>;
    recording_path: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    options: {
        destination: string;
        action: "extension" | "queue" | "conference" | "voicemail" | "hangup" | "external" | "ring_group" | "ivr";
        digit: string;
        description?: string | undefined;
    }[];
    tenant_id: string;
    enabled: boolean;
    caller_id_override: boolean;
    record_calls: boolean;
    timeout_seconds: number;
    max_failures: number;
    default_action: "extension" | "queue" | "conference" | "voicemail" | "hangup" | "external" | "ring_group" | "ivr";
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    greeting_message?: string | undefined;
    invalid_message?: string | undefined;
    timeout_message?: string | undefined;
    default_destination?: string | undefined;
}, {
    name: string;
    options: {
        destination: string;
        action: "extension" | "queue" | "conference" | "voicemail" | "hangup" | "external" | "ring_group" | "ivr";
        digit: string;
        description?: string | undefined;
    }[];
    tenant_id: string;
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    enabled?: boolean | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    caller_id_override?: boolean | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    record_calls?: boolean | undefined;
    greeting_message?: string | undefined;
    invalid_message?: string | undefined;
    timeout_message?: string | undefined;
    timeout_seconds?: number | undefined;
    max_failures?: number | undefined;
    default_action?: "extension" | "queue" | "conference" | "voicemail" | "hangup" | "external" | "ring_group" | "ivr" | undefined;
    default_destination?: string | undefined;
}>;
export type IvrMenu = z.infer<typeof IvrMenuSchema>;
export declare const RingGroupSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    extension_number: z.ZodString;
    strategy: z.ZodDefault<z.ZodEnum<["simultaneous", "sequential", "round_robin", "random", "longest_idle"]>>;
    timeout: z.ZodDefault<z.ZodNumber>;
    max_calls: z.ZodDefault<z.ZodNumber>;
    members: z.ZodArray<z.ZodObject<{
        extension_id: z.ZodString;
        extension_number: z.ZodString;
        display_name: z.ZodString;
        priority: z.ZodDefault<z.ZodNumber>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        delay: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        display_name: string;
        extension_id: string;
        priority: number;
        extension_number: string;
        delay: number;
    }, {
        display_name: string;
        extension_id: string;
        extension_number: string;
        enabled?: boolean | undefined;
        priority?: number | undefined;
        delay?: number | undefined;
    }>, "many">;
    caller_id_override: z.ZodDefault<z.ZodBoolean>;
    caller_id_name_override: z.ZodOptional<z.ZodString>;
    caller_id_number_override: z.ZodOptional<z.ZodString>;
    record_calls: z.ZodDefault<z.ZodBoolean>;
    recording_path: z.ZodOptional<z.ZodString>;
    failover_enabled: z.ZodDefault<z.ZodBoolean>;
    failover_destination_type: z.ZodOptional<z.ZodEnum<["extension", "voicemail", "external"]>>;
    failover_destination_value: z.ZodOptional<z.ZodString>;
    time_condition_id: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tenant_id: string;
    enabled: boolean;
    timeout: number;
    caller_id_override: boolean;
    record_calls: boolean;
    failover_enabled: boolean;
    extension_number: string;
    strategy: "simultaneous" | "sequential" | "round_robin" | "random" | "longest_idle";
    max_calls: number;
    members: {
        enabled: boolean;
        display_name: string;
        extension_id: string;
        priority: number;
        extension_number: string;
        delay: number;
    }[];
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    time_condition_id?: string | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    failover_destination_type?: "extension" | "voicemail" | "external" | undefined;
    failover_destination_value?: string | undefined;
}, {
    name: string;
    tenant_id: string;
    extension_number: string;
    members: {
        display_name: string;
        extension_id: string;
        extension_number: string;
        enabled?: boolean | undefined;
        priority?: number | undefined;
        delay?: number | undefined;
    }[];
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    enabled?: boolean | undefined;
    timeout?: number | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    time_condition_id?: string | undefined;
    caller_id_override?: boolean | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    record_calls?: boolean | undefined;
    failover_enabled?: boolean | undefined;
    failover_destination_type?: "extension" | "voicemail" | "external" | undefined;
    failover_destination_value?: string | undefined;
    strategy?: "simultaneous" | "sequential" | "round_robin" | "random" | "longest_idle" | undefined;
    max_calls?: number | undefined;
}>;
export type RingGroup = z.infer<typeof RingGroupSchema>;
export declare const QueueSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    extension_number: z.ZodString;
    strategy: z.ZodDefault<z.ZodEnum<["ring_all", "longest_idle", "round_robin", "top_down", "agent_with_least_calls", "agent_with_fewest_calls", "sequentially_by_agent_order", "random"]>>;
    timeout: z.ZodDefault<z.ZodNumber>;
    max_calls: z.ZodDefault<z.ZodNumber>;
    hold_music: z.ZodOptional<z.ZodString>;
    announce_frequency: z.ZodDefault<z.ZodNumber>;
    announce_position: z.ZodDefault<z.ZodBoolean>;
    announce_hold_time: z.ZodDefault<z.ZodBoolean>;
    agents: z.ZodArray<z.ZodObject<{
        extension_id: z.ZodString;
        extension_number: z.ZodString;
        display_name: z.ZodString;
        penalty: z.ZodDefault<z.ZodNumber>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        max_calls: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        display_name: string;
        extension_id: string;
        extension_number: string;
        max_calls: number;
        penalty: number;
    }, {
        display_name: string;
        extension_id: string;
        extension_number: string;
        enabled?: boolean | undefined;
        max_calls?: number | undefined;
        penalty?: number | undefined;
    }>, "many">;
    caller_id_override: z.ZodDefault<z.ZodBoolean>;
    caller_id_name_override: z.ZodOptional<z.ZodString>;
    caller_id_number_override: z.ZodOptional<z.ZodString>;
    record_calls: z.ZodDefault<z.ZodBoolean>;
    recording_path: z.ZodOptional<z.ZodString>;
    failover_enabled: z.ZodDefault<z.ZodBoolean>;
    failover_destination_type: z.ZodOptional<z.ZodEnum<["extension", "voicemail", "external"]>>;
    failover_destination_value: z.ZodOptional<z.ZodString>;
    time_condition_id: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tenant_id: string;
    enabled: boolean;
    timeout: number;
    caller_id_override: boolean;
    record_calls: boolean;
    failover_enabled: boolean;
    extension_number: string;
    strategy: "round_robin" | "random" | "longest_idle" | "ring_all" | "top_down" | "agent_with_least_calls" | "agent_with_fewest_calls" | "sequentially_by_agent_order";
    max_calls: number;
    announce_frequency: number;
    announce_position: boolean;
    announce_hold_time: boolean;
    agents: {
        enabled: boolean;
        display_name: string;
        extension_id: string;
        extension_number: string;
        max_calls: number;
        penalty: number;
    }[];
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    time_condition_id?: string | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    failover_destination_type?: "extension" | "voicemail" | "external" | undefined;
    failover_destination_value?: string | undefined;
    hold_music?: string | undefined;
}, {
    name: string;
    tenant_id: string;
    extension_number: string;
    agents: {
        display_name: string;
        extension_id: string;
        extension_number: string;
        enabled?: boolean | undefined;
        max_calls?: number | undefined;
        penalty?: number | undefined;
    }[];
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    enabled?: boolean | undefined;
    timeout?: number | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    time_condition_id?: string | undefined;
    caller_id_override?: boolean | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    record_calls?: boolean | undefined;
    failover_enabled?: boolean | undefined;
    failover_destination_type?: "extension" | "voicemail" | "external" | undefined;
    failover_destination_value?: string | undefined;
    strategy?: "round_robin" | "random" | "longest_idle" | "ring_all" | "top_down" | "agent_with_least_calls" | "agent_with_fewest_calls" | "sequentially_by_agent_order" | undefined;
    max_calls?: number | undefined;
    hold_music?: string | undefined;
    announce_frequency?: number | undefined;
    announce_position?: boolean | undefined;
    announce_hold_time?: boolean | undefined;
}>;
export type Queue = z.infer<typeof QueueSchema>;
export declare const ConferenceRoomSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    extension_number: z.ZodString;
    pin: z.ZodOptional<z.ZodString>;
    moderator_pin: z.ZodOptional<z.ZodString>;
    max_members: z.ZodDefault<z.ZodNumber>;
    record_conference: z.ZodDefault<z.ZodBoolean>;
    recording_path: z.ZodOptional<z.ZodString>;
    mute_on_join: z.ZodDefault<z.ZodBoolean>;
    announce_join_leave: z.ZodDefault<z.ZodBoolean>;
    hold_music: z.ZodOptional<z.ZodString>;
    caller_id_override: z.ZodDefault<z.ZodBoolean>;
    caller_id_name_override: z.ZodOptional<z.ZodString>;
    caller_id_number_override: z.ZodOptional<z.ZodString>;
    time_condition_id: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tenant_id: string;
    enabled: boolean;
    caller_id_override: boolean;
    extension_number: string;
    max_members: number;
    record_conference: boolean;
    mute_on_join: boolean;
    announce_join_leave: boolean;
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    time_condition_id?: string | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    hold_music?: string | undefined;
    pin?: string | undefined;
    moderator_pin?: string | undefined;
}, {
    name: string;
    tenant_id: string;
    extension_number: string;
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    enabled?: boolean | undefined;
    recording_path?: string | undefined;
    description?: string | undefined;
    time_condition_id?: string | undefined;
    caller_id_override?: boolean | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    hold_music?: string | undefined;
    pin?: string | undefined;
    moderator_pin?: string | undefined;
    max_members?: number | undefined;
    record_conference?: boolean | undefined;
    mute_on_join?: boolean | undefined;
    announce_join_leave?: boolean | undefined;
}>;
export type ConferenceRoom = z.infer<typeof ConferenceRoomSchema>;
export declare const VoicemailBoxSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    extension_number: z.ZodString;
    password: z.ZodString;
    display_name: z.ZodString;
    email_address: z.ZodOptional<z.ZodString>;
    max_messages: z.ZodDefault<z.ZodNumber>;
    max_message_length: z.ZodDefault<z.ZodNumber>;
    delete_after_email: z.ZodDefault<z.ZodBoolean>;
    attach_audio: z.ZodDefault<z.ZodBoolean>;
    email_notification: z.ZodDefault<z.ZodBoolean>;
    greeting_type: z.ZodDefault<z.ZodEnum<["default", "custom", "none"]>>;
    custom_greeting_path: z.ZodOptional<z.ZodString>;
    caller_id_override: z.ZodDefault<z.ZodBoolean>;
    caller_id_name_override: z.ZodOptional<z.ZodString>;
    caller_id_number_override: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    tenant_id: string;
    enabled: boolean;
    password: string;
    display_name: string;
    email_notification: boolean;
    delete_after_email: boolean;
    attach_audio: boolean;
    max_messages: number;
    max_message_length: number;
    caller_id_override: boolean;
    extension_number: string;
    greeting_type: "custom" | "none" | "default";
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    email_address?: string | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    custom_greeting_path?: string | undefined;
}, {
    tenant_id: string;
    password: string;
    display_name: string;
    extension_number: string;
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    store_id?: string | undefined;
    enabled?: boolean | undefined;
    email_notification?: boolean | undefined;
    email_address?: string | undefined;
    delete_after_email?: boolean | undefined;
    attach_audio?: boolean | undefined;
    max_messages?: number | undefined;
    max_message_length?: number | undefined;
    caller_id_override?: boolean | undefined;
    caller_id_name_override?: string | undefined;
    caller_id_number_override?: string | undefined;
    greeting_type?: "custom" | "none" | "default" | undefined;
    custom_greeting_path?: string | undefined;
}>;
export type VoicemailBox = z.infer<typeof VoicemailBoxSchema>;
export declare const DialplanContextSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    continue_on_fail: z.ZodDefault<z.ZodBoolean>;
    break_on_fail: z.ZodDefault<z.ZodBoolean>;
    extensions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        condition: z.ZodString;
        action: z.ZodString;
        anti_action: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        enabled: boolean;
        action: string;
        condition: string;
        anti_action?: string | undefined;
    }, {
        id: string;
        name: string;
        action: string;
        condition: string;
        enabled?: boolean | undefined;
        anti_action?: string | undefined;
    }>, "many">;
    enabled: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tenant_id: string;
    enabled: boolean;
    continue_on_fail: boolean;
    break_on_fail: boolean;
    extensions: {
        id: string;
        name: string;
        enabled: boolean;
        action: string;
        condition: string;
        anti_action?: string | undefined;
    }[];
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    description?: string | undefined;
}, {
    name: string;
    tenant_id: string;
    extensions: {
        id: string;
        name: string;
        action: string;
        condition: string;
        enabled?: boolean | undefined;
        anti_action?: string | undefined;
    }[];
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    enabled?: boolean | undefined;
    description?: string | undefined;
    continue_on_fail?: boolean | undefined;
    break_on_fail?: boolean | undefined;
}>;
export type DialplanContext = z.infer<typeof DialplanContextSchema>;
export declare const OpenSipsRouteSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodNumber>;
    conditions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["method", "uri", "from_uri", "to_uri", "src_ip", "dst_ip", "port", "user_agent", "custom_header"]>;
        operator: z.ZodEnum<["equals", "contains", "regex", "starts_with", "ends_with"]>;
        value: z.ZodString;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        type: "port" | "user_agent" | "method" | "uri" | "from_uri" | "to_uri" | "src_ip" | "dst_ip" | "custom_header";
        enabled: boolean;
        operator: "equals" | "contains" | "regex" | "starts_with" | "ends_with";
    }, {
        value: string;
        type: "port" | "user_agent" | "method" | "uri" | "from_uri" | "to_uri" | "src_ip" | "dst_ip" | "custom_header";
        operator: "equals" | "contains" | "regex" | "starts_with" | "ends_with";
        enabled?: boolean | undefined;
    }>, "many">;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["forward", "redirect", "reject", "drop", "log", "set_header", "remove_header", "set_variable"]>;
        value: z.ZodString;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        type: "forward" | "redirect" | "reject" | "drop" | "log" | "set_header" | "remove_header" | "set_variable";
        enabled: boolean;
    }, {
        value: string;
        type: "forward" | "redirect" | "reject" | "drop" | "log" | "set_header" | "remove_header" | "set_variable";
        enabled?: boolean | undefined;
    }>, "many">;
    enabled: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tenant_id: string;
    enabled: boolean;
    priority: number;
    conditions: {
        value: string;
        type: "port" | "user_agent" | "method" | "uri" | "from_uri" | "to_uri" | "src_ip" | "dst_ip" | "custom_header";
        enabled: boolean;
        operator: "equals" | "contains" | "regex" | "starts_with" | "ends_with";
    }[];
    actions: {
        value: string;
        type: "forward" | "redirect" | "reject" | "drop" | "log" | "set_header" | "remove_header" | "set_variable";
        enabled: boolean;
    }[];
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    description?: string | undefined;
}, {
    name: string;
    tenant_id: string;
    conditions: {
        value: string;
        type: "port" | "user_agent" | "method" | "uri" | "from_uri" | "to_uri" | "src_ip" | "dst_ip" | "custom_header";
        operator: "equals" | "contains" | "regex" | "starts_with" | "ends_with";
        enabled?: boolean | undefined;
    }[];
    actions: {
        value: string;
        type: "forward" | "redirect" | "reject" | "drop" | "log" | "set_header" | "remove_header" | "set_variable";
        enabled?: boolean | undefined;
    }[];
    id?: string | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    enabled?: boolean | undefined;
    description?: string | undefined;
    priority?: number | undefined;
}>;
export type OpenSipsRoute = z.infer<typeof OpenSipsRouteSchema>;
//# sourceMappingURL=sip.d.ts.map