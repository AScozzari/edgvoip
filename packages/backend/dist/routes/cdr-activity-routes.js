"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cdr_activity_service_1 = require("../services/cdr-activity-service");
const tenant_context_1 = require("../middleware/tenant-context");
const router = (0, express_1.Router)();
const cdrActivityService = new cdr_activity_service_1.CdrActivityService();
// Apply tenant context middleware to all routes
router.use(tenant_context_1.tenantContextMiddleware);
// ===== VOIP CDR =====
router.post('/cdr', async (req, res) => {
    try {
        const cdrData = req.body;
        const cdr = await cdrActivityService.createCdr(cdrData);
        res.status(201).json({
            success: true,
            data: cdr
        });
    }
    catch (error) {
        console.error('Error creating CDR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create CDR',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/cdr', async (req, res) => {
    try {
        const tenantId = req.tenantContext.tenant_id;
        const filters = {
            tenant_id: tenantId,
            store_id: req.query.store_id,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            direction: req.query.direction,
            disposition: req.query.disposition,
            ext_number: req.query.ext_number,
            did_e164: req.query.did_e164,
            limit: req.query.limit ? parseInt(req.query.limit) : 100,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };
        const result = await cdrActivityService.getCdrs(filters);
        res.json({
            success: true,
            data: result.cdrs,
            pagination: {
                total: result.total,
                limit: filters.limit,
                offset: filters.offset,
                has_more: (filters.offset + filters.limit) < result.total
            }
        });
    }
    catch (error) {
        console.error('Error fetching CDRs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch CDRs',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/cdr/stats', async (req, res) => {
    try {
        const tenantId = req.tenantContext.tenant_id;
        const storeId = req.query.store_id;
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;
        const stats = await cdrActivityService.getCdrStats(tenantId, storeId, startDate, endDate);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching CDR stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch CDR stats',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/cdr/:id', async (req, res) => {
    try {
        const cdrId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const cdr = await cdrActivityService.getCdrById(cdrId, tenantId);
        if (!cdr) {
            return res.status(404).json({
                success: false,
                message: 'CDR not found'
            });
        }
        res.json({
            success: true,
            data: cdr
        });
    }
    catch (error) {
        console.error('Error fetching CDR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch CDR',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ===== VOIP ACTIVITY LOG =====
router.post('/activity-log', async (req, res) => {
    try {
        const logData = req.body;
        const log = await cdrActivityService.createActivityLog(req.tenantContext, logData);
        res.status(201).json({
            success: true,
            data: log
        });
    }
    catch (error) {
        console.error('Error creating activity log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create activity log',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/activity-log', async (req, res) => {
    try {
        const tenantId = req.tenantContext.tenant_id;
        const filters = {
            tenant_id: tenantId,
            actor: req.query.actor,
            action: req.query.action,
            target_type: req.query.target_type,
            target_id: req.query.target_id,
            status: req.query.status,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            limit: req.query.limit ? parseInt(req.query.limit) : 100,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };
        const result = await cdrActivityService.getActivityLogs(filters);
        res.json({
            success: true,
            data: result.logs,
            pagination: {
                total: result.total,
                limit: filters.limit,
                offset: filters.offset,
                has_more: (filters.offset + filters.limit) < result.total
            }
        });
    }
    catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity logs',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/activity-log/:id', async (req, res) => {
    try {
        const logId = req.params.id;
        const tenantId = req.tenantContext.tenant_id;
        const log = await cdrActivityService.getActivityLogById(logId, tenantId);
        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Activity log not found'
            });
        }
        res.json({
            success: true,
            data: log
        });
    }
    catch (error) {
        console.error('Error fetching activity log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity log',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/activity-log/stats', async (req, res) => {
    try {
        const tenantId = req.tenantContext.tenant_id;
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;
        const stats = await cdrActivityService.getActivityStats(tenantId, startDate, endDate);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching activity stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity stats',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ===== UTILITY ENDPOINTS =====
router.post('/generate-mock-data', async (req, res) => {
    try {
        const tenantId = req.tenantContext.tenant_id;
        const sipDomain = req.tenantContext.sip_domain;
        await cdrActivityService.generateMockData(tenantId, sipDomain);
        res.json({
            success: true,
            message: 'Mock data generated successfully'
        });
    }
    catch (error) {
        console.error('Error generating mock data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate mock data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=cdr-activity-routes.js.map