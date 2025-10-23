// @ts-nocheck
import { Router } from 'express';
import { z } from 'zod';
import { FreeSWITCHService } from '../services/freeswitch.service';
import { MockFreeSWITCHService } from '../services/mock-freeswitch.service';
import { CDRService } from '../services/cdr.service';
import { authenticateToken } from '../middleware/auth';
import { setTenantContext } from '../middleware/tenant';
import { validateRequest } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
// Removed unused import: logAPICall

const router = Router();

// Initialize services
// Use Mock FreeSWITCH if FREESWITCH_MOCK=true or FreeSWITCH not available
const USE_MOCK = process.env.FREESWITCH_MOCK === 'true' || process.env.FREESWITCH_MOCK === '1';
const fsService: FreeSWITCHService | MockFreeSWITCHService = USE_MOCK 
  ? new MockFreeSWITCHService() 
  : new FreeSWITCHService();
const cdrService = new CDRService();

// Connect to FreeSWITCH on startup
fsService.connect().catch((error) => {
  console.error('Failed to connect to FreeSWITCH:', error);
  console.log('💡 Tip: Set FREESWITCH_MOCK=true to use mock service for testing');
});

// Validation schemas
const originateCallSchema = z.object({
  caller_extension: z.string().min(1, 'Caller extension is required'),
  callee_number: z.string().min(1, 'Callee number is required'),
  domain: z.string().min(1, 'Domain is required'),
  options: z.object({
    timeout: z.number().min(1).max(300).optional(),
    caller_id: z.string().optional(),
    context: z.string().optional(),
    recording: z.boolean().optional()
  }).optional()
});

const transferCallSchema = z.object({
  call_uuid: z.string().uuid('Invalid call UUID'),
  destination: z.string().min(1, 'Destination is required'),
  type: z.enum(['attended', 'blind']).optional()
});

const hangupCallSchema = z.object({
  call_uuid: z.string().uuid('Invalid call UUID'),
  cause: z.string().optional()
});

const holdCallSchema = z.object({
  call_uuid: z.string().uuid('Invalid call UUID'),
  hold: z.boolean().optional()
});

const muteCallSchema = z.object({
  call_uuid: z.string().uuid('Invalid call UUID'),
  mute: z.boolean().optional()
});

const recordCallSchema = z.object({
  call_uuid: z.string().uuid('Invalid call UUID'),
  record: z.boolean().optional(),
  path: z.string().optional()
});

const getCallInfoSchema = z.object({
  call_uuid: z.string().uuid('Invalid call UUID')
});

// Originate a call
router.post('/originate', 
  authenticateToken,
  setTenantContext,
  validateRequest(originateCallSchema),
  async (req, res) => {
    try {
      const { caller_extension, callee_number, domain, options } = req.body;
      const tenantId = req.tenantId!;

      logAPICall('originate_call', { 
        tenant_id: tenantId, 
        caller_extension, 
        callee_number, 
        domain 
      });

      // Check if FreeSWITCH is connected
      if (!fsService.isConnected()) {
        return errorResponse(res, 'FreeSWITCH not connected', 503);
      }

      // Originate the call
      const callUuid = await fsService.originateCall(
        caller_extension,
        callee_number,
        domain,
        options
      );

      // Create initial CDR record
      const cdrData = {
        tenant_id: tenantId,
        call_uuid: callUuid,
        call_direction: 'outbound' as const,
        call_type: 'voice' as const,
        caller_extension: caller_extension,
        callee_id_number: callee_number,
        start_time: new Date(),
        duration: 0,
        bill_seconds: 0,
        hangup_cause: 'UNKNOWN',
        hangup_disposition: 'UNKNOWN' as const,
        recording_enabled: options?.recording || false,
        fs_uuid: callUuid,
        fs_domain: domain,
        fs_context: options?.context || 'default',
        fs_profile: 'internal'
      };

      const cdr = await cdrService.createCDR(cdrData);

      successResponse(res, {
        call_uuid: callUuid,
        cdr_id: cdr.id,
        status: 'originated'
      }, 201);

    } catch (error) {
      console.error('Error originating call:', error);
      errorResponse(res, 'Failed to originate call', 500);
    }
  }
);

// Transfer a call
router.post('/transfer',
  authenticateToken,
  setTenantContext,
  validateRequest(transferCallSchema),
  async (req, res) => {
    try {
      const { call_uuid, destination, type } = req.body;
      const tenantId = req.tenantId!;

      logAPICall('transfer_call', { 
        tenant_id: tenantId, 
        call_uuid, 
        destination, 
        type 
      });

      // Check if FreeSWITCH is connected
      if (!fsService.isConnected()) {
        return errorResponse(res, 'FreeSWITCH not connected', 503);
      }

      // Verify CDR exists for this tenant
      const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
      if (!cdr) {
        return errorResponse(res, 'Call not found', 404);
      }

      // Transfer the call
      await fsService.transferCall(call_uuid, destination, type);

      successResponse(res, {
        call_uuid,
        destination,
        type: type || 'blind',
        status: 'transferred'
      });

    } catch (error) {
      console.error('Error transferring call:', error);
      errorResponse(res, 'Failed to transfer call', 500);
    }
  }
);

// Hangup a call
router.post('/hangup',
  authenticateToken,
  setTenantContext,
  validateRequest(hangupCallSchema),
  async (req, res) => {
    try {
      const { call_uuid, cause } = req.body;
      const tenantId = req.tenantId!;

      logAPICall('hangup_call', { 
        tenant_id: tenantId, 
        call_uuid, 
        cause 
      });

      // Check if FreeSWITCH is connected
      if (!fsService.isConnected()) {
        return errorResponse(res, 'FreeSWITCH not connected', 503);
      }

      // Verify CDR exists for this tenant
      const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
      if (!cdr) {
        return errorResponse(res, 'Call not found', 404);
      }

      // Hangup the call
      await fsService.hangupCall(call_uuid, cause);

      successResponse(res, {
        call_uuid,
        cause: cause || 'NORMAL_CLEARING',
        status: 'hungup'
      });

    } catch (error) {
      console.error('Error hanging up call:', error);
      errorResponse(res, 'Failed to hangup call', 500);
    }
  }
);

// Hold/Unhold a call
router.post('/hold',
  authenticateToken,
  setTenantContext,
  validateRequest(holdCallSchema),
  async (req, res) => {
    try {
      const { call_uuid, hold } = req.body;
      const tenantId = req.tenantId!;

      logAPICall('hold_call', { 
        tenant_id: tenantId, 
        call_uuid, 
        hold 
      });

      // Check if FreeSWITCH is connected
      if (!fsService.isConnected()) {
        return errorResponse(res, 'FreeSWITCH not connected', 503);
      }

      // Verify CDR exists for this tenant
      const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
      if (!cdr) {
        return errorResponse(res, 'Call not found', 404);
      }

      // Hold/Unhold the call
      await fsService.holdCall(call_uuid, hold);

      successResponse(res, {
        call_uuid,
        hold: hold !== false,
        status: hold !== false ? 'held' : 'unheld'
      });

    } catch (error) {
      console.error('Error holding/unholding call:', error);
      errorResponse(res, 'Failed to hold/unhold call', 500);
    }
  }
);

// Mute/Unmute a call
router.post('/mute',
  authenticateToken,
  setTenantContext,
  validateRequest(muteCallSchema),
  async (req, res) => {
    try {
      const { call_uuid, mute } = req.body;
      const tenantId = req.tenantId!;

      logAPICall('mute_call', { 
        tenant_id: tenantId, 
        call_uuid, 
        mute 
      });

      // Check if FreeSWITCH is connected
      if (!fsService.isConnected()) {
        return errorResponse(res, 'FreeSWITCH not connected', 503);
      }

      // Verify CDR exists for this tenant
      const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
      if (!cdr) {
        return errorResponse(res, 'Call not found', 404);
      }

      // Mute/Unmute the call
      await fsService.muteCall(call_uuid, mute);

      successResponse(res, {
        call_uuid,
        mute: mute !== false,
        status: mute !== false ? 'muted' : 'unmuted'
      });

    } catch (error) {
      console.error('Error muting/unmuting call:', error);
      errorResponse(res, 'Failed to mute/unmute call', 500);
    }
  }
);

// Start/Stop recording
router.post('/record',
  authenticateToken,
  setTenantContext,
  validateRequest(recordCallSchema),
  async (req, res) => {
    try {
      const { call_uuid, record, path } = req.body;
      const tenantId = req.tenantId!;

      logAPICall('record_call', { 
        tenant_id: tenantId, 
        call_uuid, 
        record, 
        path 
      });

      // Check if FreeSWITCH is connected
      if (!fsService.isConnected()) {
        return errorResponse(res, 'FreeSWITCH not connected', 503);
      }

      // Verify CDR exists for this tenant
      const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
      if (!cdr) {
        return errorResponse(res, 'Call not found', 404);
      }

      // Start/Stop recording
      await fsService.recordCall(call_uuid, record, path);

      // Update CDR with recording info
      if (record && path) {
        await cdrService.updateCDR(cdr.id, {
          recording_path: path,
          recording_enabled: true
        }, tenantId);
      } else if (!record) {
        await cdrService.updateCDR(cdr.id, {
          recording_enabled: false
        }, tenantId);
      }

      successResponse(res, {
        call_uuid,
        record: record !== false,
        recording_path: path,
        status: record !== false ? 'recording' : 'stopped'
      });

    } catch (error) {
      console.error('Error recording call:', error);
      errorResponse(res, 'Failed to record call', 500);
    }
  }
);

// Get call information
router.get('/info/:call_uuid',
  authenticateToken,
  setTenantContext,
  validateRequest(getCallInfoSchema, 'params'),
  async (req, res) => {
    try {
      const { call_uuid } = req.params;
      const tenantId = req.tenantId!;

      logAPICall('get_call_info', { 
        tenant_id: tenantId, 
        call_uuid 
      });

      // Check if FreeSWITCH is connected
      if (!fsService.isConnected()) {
        return errorResponse(res, 'FreeSWITCH not connected', 503);
      }

      // Get CDR from database
      const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
      if (!cdr) {
        return errorResponse(res, 'Call not found', 404);
      }

      // Get live call info from FreeSWITCH
      const callInfo = await fsService.getCallInfo(call_uuid);

      successResponse(res, {
        cdr,
        live_info: callInfo,
        status: 'active'
      });

    } catch (error) {
      console.error('Error getting call info:', error);
      errorResponse(res, 'Failed to get call info', 500);
    }
  }
);

// Get FreeSWITCH connection status
router.get('/status',
  authenticateToken,
  setTenantContext,
  async (req, res) => {
    try {
      const status = fsService.getStatus();

      successResponse(res, {
        freeswitch: status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting status:', error);
      errorResponse(res, 'Failed to get status', 500);
    }
  }
);

// WebSocket endpoint for real-time call events
router.get('/events',
  authenticateToken,
  setTenantContext,
  async (req, res) => {
    try {
      const tenantId = req.tenantId!;

      // Set up WebSocket connection
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection event
      res.write(`data: ${JSON.stringify({
        type: 'connected',
        tenant_id: tenantId,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Set up event listeners
      const onCallStarted = (callInfo: any) => {
        if (callInfo.domain === tenantId) {
          res.write(`data: ${JSON.stringify({
            type: 'call_started',
            data: callInfo,
            timestamp: new Date().toISOString()
          })}\n\n`);
        }
      };

      const onCallAnswered = (callInfo: any) => {
        res.write(`data: ${JSON.stringify({
          type: 'call_answered',
          data: callInfo,
          timestamp: new Date().toISOString()
        })}\n\n`);
      };

      const onCallEnded = (callInfo: any) => {
        res.write(`data: ${JSON.stringify({
          type: 'call_ended',
          data: callInfo,
          timestamp: new Date().toISOString()
        })}\n\n`);
      };

      // Add event listeners
      fsService.on('call_started', onCallStarted);
      fsService.on('call_answered', onCallAnswered);
      fsService.on('call_ended', onCallEnded);

      // Handle client disconnect
      req.on('close', () => {
        fsService.off('call_started', onCallStarted);
        fsService.off('call_answered', onCallAnswered);
        fsService.off('call_ended', onCallEnded);
      });

    } catch (error) {
      console.error('Error setting up call events:', error);
      errorResponse(res, 'Failed to setup call events', 500);
    }
  }
);

export default router;

