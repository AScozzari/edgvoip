"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const zod_1 = require("zod");
const freeswitch_service_1 = require("../services/freeswitch.service");
const mock_freeswitch_service_1 = require("../services/mock-freeswitch.service");
const cdr_service_1 = require("../services/cdr.service");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const validation_1 = require("../middleware/validation");
const response_1 = require("../utils/response");
// Removed unused import: logAPICall
const router = (0, express_1.Router)();
// Initialize services
// Use Mock FreeSWITCH if FREESWITCH_MOCK=true or FreeSWITCH not available
const USE_MOCK = process.env.FREESWITCH_MOCK === 'true' || process.env.FREESWITCH_MOCK === '1';
const fsService = USE_MOCK
    ? new mock_freeswitch_service_1.MockFreeSWITCHService()
    : new freeswitch_service_1.FreeSWITCHService();
const cdrService = new cdr_service_1.CDRService();
// Connect to FreeSWITCH on startup
fsService.connect().catch((error) => {
    console.error('Failed to connect to FreeSWITCH:', error);
    console.log('💡 Tip: Set FREESWITCH_MOCK=true to use mock service for testing');
});
// Validation schemas
const originateCallSchema = zod_1.z.object({
    caller_extension: zod_1.z.string().min(1, 'Caller extension is required'),
    callee_number: zod_1.z.string().min(1, 'Callee number is required'),
    domain: zod_1.z.string().min(1, 'Domain is required'),
    options: zod_1.z.object({
        timeout: zod_1.z.number().min(1).max(300).optional(),
        caller_id: zod_1.z.string().optional(),
        context: zod_1.z.string().optional(),
        recording: zod_1.z.boolean().optional()
    }).optional()
});
const transferCallSchema = zod_1.z.object({
    call_uuid: zod_1.z.string().uuid('Invalid call UUID'),
    destination: zod_1.z.string().min(1, 'Destination is required'),
    type: zod_1.z.enum(['attended', 'blind']).optional()
});
const hangupCallSchema = zod_1.z.object({
    call_uuid: zod_1.z.string().uuid('Invalid call UUID'),
    cause: zod_1.z.string().optional()
});
const holdCallSchema = zod_1.z.object({
    call_uuid: zod_1.z.string().uuid('Invalid call UUID'),
    hold: zod_1.z.boolean().optional()
});
const muteCallSchema = zod_1.z.object({
    call_uuid: zod_1.z.string().uuid('Invalid call UUID'),
    mute: zod_1.z.boolean().optional()
});
const recordCallSchema = zod_1.z.object({
    call_uuid: zod_1.z.string().uuid('Invalid call UUID'),
    record: zod_1.z.boolean().optional(),
    path: zod_1.z.string().optional()
});
const getCallInfoSchema = zod_1.z.object({
    call_uuid: zod_1.z.string().uuid('Invalid call UUID')
});
// Originate a call
router.post('/originate', auth_1.authenticateToken, tenant_1.setTenantContext, (0, validation_1.validateRequest)(originateCallSchema), async (req, res) => {
    try {
        const { caller_extension, callee_number, domain, options } = req.body;
        const tenantId = req.tenantId;
        logAPICall('originate_call', {
            tenant_id: tenantId,
            caller_extension,
            callee_number,
            domain
        });
        // Check if FreeSWITCH is connected
        if (!fsService.isConnected()) {
            return (0, response_1.errorResponse)(res, 'FreeSWITCH not connected', 503);
        }
        // Originate the call
        const callUuid = await fsService.originateCall(caller_extension, callee_number, domain, options);
        // Create initial CDR record
        const cdrData = {
            tenant_id: tenantId,
            call_uuid: callUuid,
            call_direction: 'outbound',
            call_type: 'voice',
            caller_extension: caller_extension,
            callee_id_number: callee_number,
            start_time: new Date(),
            duration: 0,
            bill_seconds: 0,
            hangup_cause: 'UNKNOWN',
            hangup_disposition: 'UNKNOWN',
            recording_enabled: options?.recording || false,
            fs_uuid: callUuid,
            fs_domain: domain,
            fs_context: options?.context || 'default',
            fs_profile: 'internal'
        };
        const cdr = await cdrService.createCDR(cdrData);
        (0, response_1.successResponse)(res, {
            call_uuid: callUuid,
            cdr_id: cdr.id,
            status: 'originated'
        }, 201);
    }
    catch (error) {
        console.error('Error originating call:', error);
        (0, response_1.errorResponse)(res, 'Failed to originate call', 500);
    }
});
// Transfer a call
router.post('/transfer', auth_1.authenticateToken, tenant_1.setTenantContext, (0, validation_1.validateRequest)(transferCallSchema), async (req, res) => {
    try {
        const { call_uuid, destination, type } = req.body;
        const tenantId = req.tenantId;
        logAPICall('transfer_call', {
            tenant_id: tenantId,
            call_uuid,
            destination,
            type
        });
        // Check if FreeSWITCH is connected
        if (!fsService.isConnected()) {
            return (0, response_1.errorResponse)(res, 'FreeSWITCH not connected', 503);
        }
        // Verify CDR exists for this tenant
        const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
        if (!cdr) {
            return (0, response_1.errorResponse)(res, 'Call not found', 404);
        }
        // Transfer the call
        await fsService.transferCall(call_uuid, destination, type);
        (0, response_1.successResponse)(res, {
            call_uuid,
            destination,
            type: type || 'blind',
            status: 'transferred'
        });
    }
    catch (error) {
        console.error('Error transferring call:', error);
        (0, response_1.errorResponse)(res, 'Failed to transfer call', 500);
    }
});
// Hangup a call
router.post('/hangup', auth_1.authenticateToken, tenant_1.setTenantContext, (0, validation_1.validateRequest)(hangupCallSchema), async (req, res) => {
    try {
        const { call_uuid, cause } = req.body;
        const tenantId = req.tenantId;
        logAPICall('hangup_call', {
            tenant_id: tenantId,
            call_uuid,
            cause
        });
        // Check if FreeSWITCH is connected
        if (!fsService.isConnected()) {
            return (0, response_1.errorResponse)(res, 'FreeSWITCH not connected', 503);
        }
        // Verify CDR exists for this tenant
        const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
        if (!cdr) {
            return (0, response_1.errorResponse)(res, 'Call not found', 404);
        }
        // Hangup the call
        await fsService.hangupCall(call_uuid, cause);
        (0, response_1.successResponse)(res, {
            call_uuid,
            cause: cause || 'NORMAL_CLEARING',
            status: 'hungup'
        });
    }
    catch (error) {
        console.error('Error hanging up call:', error);
        (0, response_1.errorResponse)(res, 'Failed to hangup call', 500);
    }
});
// Hold/Unhold a call
router.post('/hold', auth_1.authenticateToken, tenant_1.setTenantContext, (0, validation_1.validateRequest)(holdCallSchema), async (req, res) => {
    try {
        const { call_uuid, hold } = req.body;
        const tenantId = req.tenantId;
        logAPICall('hold_call', {
            tenant_id: tenantId,
            call_uuid,
            hold
        });
        // Check if FreeSWITCH is connected
        if (!fsService.isConnected()) {
            return (0, response_1.errorResponse)(res, 'FreeSWITCH not connected', 503);
        }
        // Verify CDR exists for this tenant
        const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
        if (!cdr) {
            return (0, response_1.errorResponse)(res, 'Call not found', 404);
        }
        // Hold/Unhold the call
        await fsService.holdCall(call_uuid, hold);
        (0, response_1.successResponse)(res, {
            call_uuid,
            hold: hold !== false,
            status: hold !== false ? 'held' : 'unheld'
        });
    }
    catch (error) {
        console.error('Error holding/unholding call:', error);
        (0, response_1.errorResponse)(res, 'Failed to hold/unhold call', 500);
    }
});
// Mute/Unmute a call
router.post('/mute', auth_1.authenticateToken, tenant_1.setTenantContext, (0, validation_1.validateRequest)(muteCallSchema), async (req, res) => {
    try {
        const { call_uuid, mute } = req.body;
        const tenantId = req.tenantId;
        logAPICall('mute_call', {
            tenant_id: tenantId,
            call_uuid,
            mute
        });
        // Check if FreeSWITCH is connected
        if (!fsService.isConnected()) {
            return (0, response_1.errorResponse)(res, 'FreeSWITCH not connected', 503);
        }
        // Verify CDR exists for this tenant
        const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
        if (!cdr) {
            return (0, response_1.errorResponse)(res, 'Call not found', 404);
        }
        // Mute/Unmute the call
        await fsService.muteCall(call_uuid, mute);
        (0, response_1.successResponse)(res, {
            call_uuid,
            mute: mute !== false,
            status: mute !== false ? 'muted' : 'unmuted'
        });
    }
    catch (error) {
        console.error('Error muting/unmuting call:', error);
        (0, response_1.errorResponse)(res, 'Failed to mute/unmute call', 500);
    }
});
// Start/Stop recording
router.post('/record', auth_1.authenticateToken, tenant_1.setTenantContext, (0, validation_1.validateRequest)(recordCallSchema), async (req, res) => {
    try {
        const { call_uuid, record, path } = req.body;
        const tenantId = req.tenantId;
        logAPICall('record_call', {
            tenant_id: tenantId,
            call_uuid,
            record,
            path
        });
        // Check if FreeSWITCH is connected
        if (!fsService.isConnected()) {
            return (0, response_1.errorResponse)(res, 'FreeSWITCH not connected', 503);
        }
        // Verify CDR exists for this tenant
        const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
        if (!cdr) {
            return (0, response_1.errorResponse)(res, 'Call not found', 404);
        }
        // Start/Stop recording
        await fsService.recordCall(call_uuid, record, path);
        // Update CDR with recording info
        if (record && path) {
            await cdrService.updateCDR(cdr.id, {
                recording_path: path,
                recording_enabled: true
            }, tenantId);
        }
        else if (!record) {
            await cdrService.updateCDR(cdr.id, {
                recording_enabled: false
            }, tenantId);
        }
        (0, response_1.successResponse)(res, {
            call_uuid,
            record: record !== false,
            recording_path: path,
            status: record !== false ? 'recording' : 'stopped'
        });
    }
    catch (error) {
        console.error('Error recording call:', error);
        (0, response_1.errorResponse)(res, 'Failed to record call', 500);
    }
});
// Get call information
router.get('/info/:call_uuid', auth_1.authenticateToken, tenant_1.setTenantContext, (0, validation_1.validateRequest)(getCallInfoSchema, 'params'), async (req, res) => {
    try {
        const { call_uuid } = req.params;
        const tenantId = req.tenantId;
        logAPICall('get_call_info', {
            tenant_id: tenantId,
            call_uuid
        });
        // Check if FreeSWITCH is connected
        if (!fsService.isConnected()) {
            return (0, response_1.errorResponse)(res, 'FreeSWITCH not connected', 503);
        }
        // Get CDR from database
        const cdr = await cdrService.getCDRByCallUuid(call_uuid, tenantId);
        if (!cdr) {
            return (0, response_1.errorResponse)(res, 'Call not found', 404);
        }
        // Get live call info from FreeSWITCH
        const callInfo = await fsService.getCallInfo(call_uuid);
        (0, response_1.successResponse)(res, {
            cdr,
            live_info: callInfo,
            status: 'active'
        });
    }
    catch (error) {
        console.error('Error getting call info:', error);
        (0, response_1.errorResponse)(res, 'Failed to get call info', 500);
    }
});
// Get FreeSWITCH connection status
router.get('/status', auth_1.authenticateToken, tenant_1.setTenantContext, async (req, res) => {
    try {
        const status = fsService.getStatus();
        (0, response_1.successResponse)(res, {
            freeswitch: status,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error getting status:', error);
        (0, response_1.errorResponse)(res, 'Failed to get status', 500);
    }
});
// WebSocket endpoint for real-time call events
router.get('/events', auth_1.authenticateToken, tenant_1.setTenantContext, async (req, res) => {
    try {
        const tenantId = req.tenantId;
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
        const onCallStarted = (callInfo) => {
            if (callInfo.domain === tenantId) {
                res.write(`data: ${JSON.stringify({
                    type: 'call_started',
                    data: callInfo,
                    timestamp: new Date().toISOString()
                })}\n\n`);
            }
        };
        const onCallAnswered = (callInfo) => {
            res.write(`data: ${JSON.stringify({
                type: 'call_answered',
                data: callInfo,
                timestamp: new Date().toISOString()
            })}\n\n`);
        };
        const onCallEnded = (callInfo) => {
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
    }
    catch (error) {
        console.error('Error setting up call events:', error);
        (0, response_1.errorResponse)(res, 'Failed to setup call events', 500);
    }
});
exports.default = router;
//# sourceMappingURL=calls.js.map