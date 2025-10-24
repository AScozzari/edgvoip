// @ts-nocheck
import { Router } from 'express';
import { z } from 'zod';
import { CDRService } from '../services/cdr.service';
import { validateRequest } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
// Removed unused import: logWebhookEvent
import crypto from 'crypto';

const router = Router();
const cdrService = new CDRService();

// Webhook signature validation
const validateWebhookSignature = (req: any, res: any, next: any) => {
  const signature = req.headers['x-webhook-signature'];
  const webhookSecret = process.env.WEBHOOK_SECRET || 'default-secret';
  
  if (!signature) {
    return errorResponse(res, 'Missing webhook signature', 401);
  }

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  const providedSignature = signature.replace('sha256=', '');

  if (!crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  )) {
    return errorResponse(res, 'Invalid webhook signature', 401);
  }

  next();
};

// CDR webhook validation schema
const cdrWebhookSchema = z.object({
  event_name: z.string(),
  call_uuid: z.string().uuid(),
  tenant_domain: z.string(),
  store_id: z.string().optional(),
  extension_id: z.string().uuid().optional(),
  trunk_id: z.string().uuid().optional(),
  call_direction: z.enum(['inbound', 'outbound', 'internal']),
  call_type: z.enum(['voice', 'video', 'fax']).default('voice'),
  caller_id_number: z.string().optional(),
  caller_id_name: z.string().optional(),
  caller_extension: z.string().optional(),
  callee_id_number: z.string().optional(),
  callee_id_name: z.string().optional(),
  callee_extension: z.string().optional(),
  start_time: z.string().datetime(),
  answer_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  duration: z.number().min(0).default(0),
  bill_seconds: z.number().min(0).default(0),
  hangup_cause: z.string().optional(),
  hangup_disposition: z.enum(['answered', 'no_answer', 'busy', 'failed', 'unknown']).default('unknown'),
  audio_codec: z.string().optional(),
  video_codec: z.string().optional(),
  rtp_audio_in_mos: z.number().min(1).max(5).optional(),
  rtp_audio_out_mos: z.number().min(1).max(5).optional(),
  recording_enabled: z.boolean().default(false),
  recording_path: z.string().optional(),
  recording_duration: z.number().min(0).optional(),
  recording_consent: z.boolean().optional(),
  local_ip: z.string().optional(),
  remote_ip: z.string().optional(),
  local_port: z.number().optional(),
  remote_port: z.number().optional(),
  fs_uuid: z.string(),
  fs_domain: z.string(),
  fs_context: z.string().optional(),
  fs_profile: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
});

// Call event webhook validation schema
const callEventWebhookSchema = z.object({
  event_name: z.string(),
  call_uuid: z.string().uuid(),
  tenant_domain: z.string(),
  event_type: z.enum(['call_started', 'call_answered', 'call_ended', 'call_transferred', 'recording_started', 'recording_stopped']),
  timestamp: z.string().datetime(),
  data: z.record(z.any()).optional()
});

// CDR webhook endpoint
router.post('/cdr',
  validateWebhookSignature,
  validateRequest(cdrWebhookSchema),
  async (req, res) => {
    try {
      const cdrData = req.body;

      logWebhookEvent('cdr_received', {
        call_uuid: cdrData.call_uuid,
        tenant_domain: cdrData.tenant_domain,
        event_name: cdrData.event_name
      });

      // Find tenant by domain
      const { getClient } = await import('@w3-voip/database');
      const client = await getClient();
      
      try {
        const tenantResult = await client.query(
          'SELECT id FROM tenants WHERE domain = $1',
          [cdrData.tenant_domain]
        );

        if (tenantResult.rows.length === 0) {
          logWebhookEvent('cdr_error', {
            call_uuid: cdrData.call_uuid,
            error: 'Tenant not found',
            tenant_domain: cdrData.tenant_domain
          });
          return errorResponse(res, 'Tenant not found', 404);
        }

        const tenantId = tenantResult.rows[0].id;

        // Check if CDR already exists
        const existingCDR = await cdrService.getCDRByCallUuid(cdrData.call_uuid, tenantId);

        if (existingCDR) {
          // Update existing CDR
          const updates: any = {};
          
          if (cdrData.answer_time) updates.answer_time = new Date(cdrData.answer_time);
          if (cdrData.end_time) updates.end_time = new Date(cdrData.end_time);
          if (cdrData.duration !== undefined) updates.duration = cdrData.duration;
          if (cdrData.bill_seconds !== undefined) updates.bill_seconds = cdrData.bill_seconds;
          if (cdrData.hangup_cause) updates.hangup_cause = cdrData.hangup_cause;
          if (cdrData.hangup_disposition) updates.hangup_disposition = cdrData.hangup_disposition;
          if (cdrData.audio_codec) updates.audio_codec = cdrData.audio_codec;
          if (cdrData.video_codec) updates.video_codec = cdrData.video_codec;
          if (cdrData.rtp_audio_in_mos) updates.rtp_audio_in_mos = cdrData.rtp_audio_in_mos;
          if (cdrData.rtp_audio_out_mos) updates.rtp_audio_out_mos = cdrData.rtp_audio_out_mos;
          if (cdrData.recording_enabled !== undefined) updates.recording_enabled = cdrData.recording_enabled;
          if (cdrData.recording_path) updates.recording_path = cdrData.recording_path;
          if (cdrData.recording_duration) updates.recording_duration = cdrData.recording_duration;
          if (cdrData.recording_consent !== undefined) updates.recording_consent = cdrData.recording_consent;
          if (cdrData.metadata) updates.metadata = cdrData.metadata;
          if (cdrData.tags) updates.tags = cdrData.tags;

          await cdrService.updateCDR(existingCDR.id, updates, tenantId);

          logWebhookEvent('cdr_updated', {
            call_uuid: cdrData.call_uuid,
            tenant_id: tenantId,
            cdr_id: existingCDR.id
          });

        } else {
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

        successResponse(res, {
          status: 'processed',
          call_uuid: cdrData.call_uuid,
          tenant_domain: cdrData.tenant_domain
        });

      } finally {
        await client.release();
      }

    } catch (error) {
      console.error('Error processing CDR webhook:', error);
      logWebhookEvent('cdr_error', {
        call_uuid: req.body.call_uuid,
        error: error.message
      });
      errorResponse(res, 'Failed to process CDR webhook', 500);
    }
  }
);

// Call event webhook endpoint
router.post('/call-event',
  validateWebhookSignature,
  validateRequest(callEventWebhookSchema),
  async (req, res) => {
    try {
      const eventData = req.body;

      logWebhookEvent('call_event_received', {
        call_uuid: eventData.call_uuid,
        tenant_domain: eventData.tenant_domain,
        event_type: eventData.event_type
      });

      // Find tenant by domain
      const { getClient } = await import('@w3-voip/database');
      const client = await getClient();
      
      try {
        const tenantResult = await client.query(
          'SELECT id FROM tenants WHERE domain = $1',
          [eventData.tenant_domain]
        );

        if (tenantResult.rows.length === 0) {
          logWebhookEvent('call_event_error', {
            call_uuid: eventData.call_uuid,
            error: 'Tenant not found',
            tenant_domain: eventData.tenant_domain
          });
          return errorResponse(res, 'Tenant not found', 404);
        }

        const tenantId = tenantResult.rows[0].id;

        // Store call event in database (optional - for audit trail)
        await client.query(
          `INSERT INTO call_events (
            id, tenant_id, call_uuid, event_type, event_name, 
            timestamp, data, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            require('uuid').v4(),
            tenantId,
            eventData.call_uuid,
            eventData.event_type,
            eventData.event_name,
            new Date(eventData.timestamp),
            eventData.data ? JSON.stringify(eventData.data) : null
          ]
        );

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
                'X-Webhook-Signature': crypto
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

          } catch (forwardError) {
            logWebhookEvent('call_event_forward_error', {
              call_uuid: eventData.call_uuid,
              tenant_id: tenantId,
              error: forwardError.message
            });
          }
        }

        successResponse(res, {
          status: 'processed',
          call_uuid: eventData.call_uuid,
          event_type: eventData.event_type,
          tenant_domain: eventData.tenant_domain
        });

      } finally {
        await client.release();
      }

    } catch (error) {
      console.error('Error processing call event webhook:', error);
      logWebhookEvent('call_event_error', {
        call_uuid: req.body.call_uuid,
        error: error.message
      });
      errorResponse(res, 'Failed to process call event webhook', 500);
    }
  }
);

// Health check endpoint for webhooks
router.get('/health', (req, res) => {
  successResponse(res, {
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

  successResponse(res, config);
});

export default router;

