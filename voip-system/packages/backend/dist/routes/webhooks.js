"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const zod_1 = require("zod");
const cdr_service_1 = require("../services/cdr.service");
const validation_1 = require("../middleware/validation");
const response_1 = require("../utils/response");
// Removed unused import: logWebhookEvent
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
const cdrService = new cdr_service_1.CDRService();
// Webhook signature validation
const validateWebhookSignature = (req, res, next) => {
    const signature = req.headers['x-webhook-signature'];
    const webhookSecret = process.env.WEBHOOK_SECRET || 'default-secret';
    if (!signature) {
        return (0, response_1.errorResponse)(res, 'Missing webhook signature', 401);
    }
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto_1.default
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');
    const providedSignature = signature.replace('sha256=', '');
    if (!crypto_1.default.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(providedSignature, 'hex'))) {
        return (0, response_1.errorResponse)(res, 'Invalid webhook signature', 401);
    }
    next();
};
// CDR webhook validation schema
const cdrWebhookSchema = zod_1.z.object({
    event_name: zod_1.z.string(),
    call_uuid: zod_1.z.string().uuid(),
    tenant_domain: zod_1.z.string(),
    store_id: zod_1.z.string().optional(),
    extension_id: zod_1.z.string().uuid().optional(),
    trunk_id: zod_1.z.string().uuid().optional(),
    call_direction: zod_1.z.enum(['inbound', 'outbound', 'internal']),
    call_type: zod_1.z.enum(['voice', 'video', 'fax']).default('voice'),
    caller_id_number: zod_1.z.string().optional(),
    caller_id_name: zod_1.z.string().optional(),
    caller_extension: zod_1.z.string().optional(),
    callee_id_number: zod_1.z.string().optional(),
    callee_id_name: zod_1.z.string().optional(),
    callee_extension: zod_1.z.string().optional(),
    start_time: zod_1.z.string().datetime(),
    answer_time: zod_1.z.string().datetime().optional(),
    end_time: zod_1.z.string().datetime().optional(),
    duration: zod_1.z.number().min(0).default(0),
    bill_seconds: zod_1.z.number().min(0).default(0),
    hangup_cause: zod_1.z.string().optional(),
    hangup_disposition: zod_1.z.enum(['answered', 'no_answer', 'busy', 'failed', 'unknown']).default('unknown'),
    audio_codec: zod_1.z.string().optional(),
    video_codec: zod_1.z.string().optional(),
    rtp_audio_in_mos: zod_1.z.number().min(1).max(5).optional(),
    rtp_audio_out_mos: zod_1.z.number().min(1).max(5).optional(),
    recording_enabled: zod_1.z.boolean().default(false),
    recording_path: zod_1.z.string().optional(),
    recording_duration: zod_1.z.number().min(0).optional(),
    recording_consent: zod_1.z.boolean().optional(),
    local_ip: zod_1.z.string().optional(),
    remote_ip: zod_1.z.string().optional(),
    local_port: zod_1.z.number().optional(),
    remote_port: zod_1.z.number().optional(),
    fs_uuid: zod_1.z.string(),
    fs_domain: zod_1.z.string(),
    fs_context: zod_1.z.string().optional(),
    fs_profile: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
});
// Call event webhook validation schema
const callEventWebhookSchema = zod_1.z.object({
    event_name: zod_1.z.string(),
    call_uuid: zod_1.z.string().uuid(),
    tenant_domain: zod_1.z.string(),
    event_type: zod_1.z.enum(['call_started', 'call_answered', 'call_ended', 'call_transferred', 'recording_started', 'recording_stopped']),
    timestamp: zod_1.z.string().datetime(),
    data: zod_1.z.record(zod_1.z.any()).optional()
});
// CDR webhook endpoint
router.post('/cdr', validateWebhookSignature, (0, validation_1.validateRequest)(cdrWebhookSchema), async (req, res) => {
    try {
        const cdrData = req.body;
        logWebhookEvent('cdr_received', {
            call_uuid: cdrData.call_uuid,
            tenant_domain: cdrData.tenant_domain,
            event_name: cdrData.event_name
        });
        // Find tenant by domain
        const { getClient } = await Promise.resolve().then(() => __importStar(require('@w3-voip/database')));
        const client = await getClient();
        try {
            const tenantResult = await client.query('SELECT id FROM tenants WHERE domain = $1', [cdrData.tenant_domain]);
            if (tenantResult.rows.length === 0) {
                logWebhookEvent('cdr_error', {
                    call_uuid: cdrData.call_uuid,
                    error: 'Tenant not found',
                    tenant_domain: cdrData.tenant_domain
                });
                return (0, response_1.errorResponse)(res, 'Tenant not found', 404);
            }
            const tenantId = tenantResult.rows[0].id;
            // Check if CDR already exists
            const existingCDR = await cdrService.getCDRByCallUuid(cdrData.call_uuid, tenantId);
            if (existingCDR) {
                // Update existing CDR
                const updates = {};
                if (cdrData.answer_time)
                    updates.answer_time = new Date(cdrData.answer_time);
                if (cdrData.end_time)
                    updates.end_time = new Date(cdrData.end_time);
                if (cdrData.duration !== undefined)
                    updates.duration = cdrData.duration;
                if (cdrData.bill_seconds !== undefined)
                    updates.bill_seconds = cdrData.bill_seconds;
                if (cdrData.hangup_cause)
                    updates.hangup_cause = cdrData.hangup_cause;
                if (cdrData.hangup_disposition)
                    updates.hangup_disposition = cdrData.hangup_disposition;
                if (cdrData.audio_codec)
                    updates.audio_codec = cdrData.audio_codec;
                if (cdrData.video_codec)
                    updates.video_codec = cdrData.video_codec;
                if (cdrData.rtp_audio_in_mos)
                    updates.rtp_audio_in_mos = cdrData.rtp_audio_in_mos;
                if (cdrData.rtp_audio_out_mos)
                    updates.rtp_audio_out_mos = cdrData.rtp_audio_out_mos;
                if (cdrData.recording_enabled !== undefined)
                    updates.recording_enabled = cdrData.recording_enabled;
                if (cdrData.recording_path)
                    updates.recording_path = cdrData.recording_path;
                if (cdrData.recording_duration)
                    updates.recording_duration = cdrData.recording_duration;
                if (cdrData.recording_consent !== undefined)
                    updates.recording_consent = cdrData.recording_consent;
                if (cdrData.metadata)
                    updates.metadata = cdrData.metadata;
                if (cdrData.tags)
                    updates.tags = cdrData.tags;
                await cdrService.updateCDR(existingCDR.id, updates, tenantId);
                logWebhookEvent('cdr_updated', {
                    call_uuid: cdrData.call_uuid,
                    tenant_id: tenantId,
                    cdr_id: existingCDR.id
                });
            }
            else {
                // Create new CDR
                const newCDRData = {
                    tenant_id: tenantId,
                    store_id: cdrData.store_id || undefined,
                    extension_id: cdrData.extension_id || undefined,
                    trunk_id: cdrData.trunk_id || undefined,
                    call_uuid: cdrData.call_uuid,
                    call_direction: cdrData.call_direction,
                    call_type: cdrData.call_type,
                    caller_id_number: cdrData.caller_id_number || undefined,
                    caller_id_name: cdrData.caller_id_name || undefined,
                    caller_extension: cdrData.caller_extension || undefined,
                    callee_id_number: cdrData.callee_id_number || undefined,
                    callee_id_name: cdrData.callee_id_name || undefined,
                    callee_extension: cdrData.callee_extension || undefined,
                    start_time: new Date(cdrData.start_time),
                    answer_time: cdrData.answer_time ? new Date(cdrData.answer_time) : undefined,
                    end_time: cdrData.end_time ? new Date(cdrData.end_time) : undefined,
                    duration: cdrData.duration,
                    bill_seconds: cdrData.bill_seconds,
                    hangup_cause: cdrData.hangup_cause || undefined,
                    hangup_disposition: cdrData.hangup_disposition,
                    audio_codec: cdrData.audio_codec || undefined,
                    video_codec: cdrData.video_codec || undefined,
                    rtp_audio_in_mos: cdrData.rtp_audio_in_mos || undefined,
                    rtp_audio_out_mos: cdrData.rtp_audio_out_mos || undefined,
                    recording_enabled: cdrData.recording_enabled,
                    recording_path: cdrData.recording_path || undefined,
                    recording_duration: cdrData.recording_duration || undefined,
                    recording_consent: cdrData.recording_consent || undefined,
                    local_ip: cdrData.local_ip || undefined,
                    remote_ip: cdrData.remote_ip || undefined,
                    local_port: cdrData.local_port || undefined,
                    remote_port: cdrData.remote_port || undefined,
                    fs_uuid: cdrData.fs_uuid,
                    fs_domain: cdrData.fs_domain,
                    fs_context: cdrData.fs_context || undefined,
                    fs_profile: cdrData.fs_profile || undefined,
                    metadata: cdrData.metadata || undefined,
                    tags: cdrData.tags || []
                };
                const cdr = await cdrService.createCDR(newCDRData);
                logWebhookEvent('cdr_created', {
                    call_uuid: cdrData.call_uuid,
                    tenant_id: tenantId,
                    cdr_id: cdr.id
                });
            }
            (0, response_1.successResponse)(res, {
                status: 'processed',
                call_uuid: cdrData.call_uuid,
                tenant_domain: cdrData.tenant_domain
            });
        }
        finally {
            await client.release();
        }
    }
    catch (error) {
        console.error('Error processing CDR webhook:', error);
        logWebhookEvent('cdr_error', {
            call_uuid: req.body.call_uuid,
            error: error.message
        });
        (0, response_1.errorResponse)(res, 'Failed to process CDR webhook', 500);
    }
});
// Call event webhook endpoint
router.post('/call-event', validateWebhookSignature, (0, validation_1.validateRequest)(callEventWebhookSchema), async (req, res) => {
    try {
        const eventData = req.body;
        logWebhookEvent('call_event_received', {
            call_uuid: eventData.call_uuid,
            tenant_domain: eventData.tenant_domain,
            event_type: eventData.event_type
        });
        // Find tenant by domain
        const { getClient } = await Promise.resolve().then(() => __importStar(require('@w3-voip/database')));
        const client = await getClient();
        try {
            const tenantResult = await client.query('SELECT id FROM tenants WHERE domain = $1', [eventData.tenant_domain]);
            if (tenantResult.rows.length === 0) {
                logWebhookEvent('call_event_error', {
                    call_uuid: eventData.call_uuid,
                    error: 'Tenant not found',
                    tenant_domain: eventData.tenant_domain
                });
                return (0, response_1.errorResponse)(res, 'Tenant not found', 404);
            }
            const tenantId = tenantResult.rows[0].id;
            // Store call event in database (optional - for audit trail)
            await client.query(`INSERT INTO call_events (
            id, tenant_id, call_uuid, event_type, event_name, 
            timestamp, data, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`, [
                require('uuid').v4(),
                tenantId,
                eventData.call_uuid,
                eventData.event_type,
                eventData.event_name,
                new Date(eventData.timestamp),
                eventData.data ? JSON.stringify(eventData.data) : null
            ]);
            // Forward event to W3 Suite if configured
            const w3SuiteWebhookUrl = process.env.W3_SUITE_WEBHOOK_URL;
            if (w3SuiteWebhookUrl) {
                try {
                    const fetch = require('node-fetch');
                    await fetch(w3SuiteWebhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Webhook-Source': 'w3-voip',
                            'X-Webhook-Signature': crypto_1.default
                                .createHmac('sha256', process.env.W3_SUITE_WEBHOOK_SECRET || 'default-secret')
                                .update(JSON.stringify(eventData))
                                .digest('hex')
                        },
                        body: JSON.stringify({
                            ...eventData,
                            tenant_id: tenantId
                        })
                    });
                    logWebhookEvent('call_event_forwarded', {
                        call_uuid: eventData.call_uuid,
                        tenant_id: tenantId,
                        w3_suite_url: w3SuiteWebhookUrl
                    });
                }
                catch (forwardError) {
                    logWebhookEvent('call_event_forward_error', {
                        call_uuid: eventData.call_uuid,
                        tenant_id: tenantId,
                        error: forwardError.message
                    });
                }
            }
            (0, response_1.successResponse)(res, {
                status: 'processed',
                call_uuid: eventData.call_uuid,
                event_type: eventData.event_type,
                tenant_domain: eventData.tenant_domain
            });
        }
        finally {
            await client.release();
        }
    }
    catch (error) {
        console.error('Error processing call event webhook:', error);
        logWebhookEvent('call_event_error', {
            call_uuid: req.body.call_uuid,
            error: error.message
        });
        (0, response_1.errorResponse)(res, 'Failed to process call event webhook', 500);
    }
});
// Health check endpoint for webhooks
router.get('/health', (req, res) => {
    (0, response_1.successResponse)(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'w3-voip-webhooks'
    });
});
// Webhook configuration endpoint
router.get('/config', (req, res) => {
    const config = {
        cdr_webhook_url: `${process.env.API_BASE_URL || 'http://192.168.172.234:3000'}/api/webhooks/cdr`,
        call_event_webhook_url: `${process.env.API_BASE_URL || 'http://192.168.172.234:3000'}/api/webhooks/call-event`,
        supported_events: [
            'CHANNEL_CREATE',
            'CHANNEL_ANSWER',
            'CHANNEL_HANGUP',
            'CHANNEL_BRIDGE',
            'RECORD_START',
            'RECORD_STOP'
        ],
        authentication: {
            type: 'hmac_sha256',
            header: 'X-Webhook-Signature'
        }
    };
    (0, response_1.successResponse)(res, config);
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map