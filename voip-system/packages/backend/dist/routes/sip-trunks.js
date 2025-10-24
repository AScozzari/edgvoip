"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// Apply authentication and tenant context to all routes
router.use(middleware_1.authenticateToken);
router.use(middleware_1.requireTenant);
router.use(middleware_1.setTenantContext);
// Get SIP trunks for tenant
router.get('/', (0, response_1.asyncHandler)(async (req, res) => {
    try {
        // For now, return the MessageNet trunk configuration
        // In a real implementation, this would come from the database
        const trunks = [
            {
                id: 'messagenet',
                name: 'MessageNet',
                provider: 'MessageNet',
                host: 'sip.messagenet.it',
                port: 5060,
                username: '5406594427',
                status: 'registered',
                type: 'sip',
                tenant_id: req.tenantId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        (0, response_1.successResponse)(res, trunks, 'SIP trunks retrieved successfully');
    }
    catch (error) {
        console.error('Error fetching SIP trunks:', error);
        (0, response_1.errorResponse)(res, 'Failed to fetch SIP trunks', 500);
    }
}));
// Get SIP trunk status
router.get('/:id/status', (0, response_1.asyncHandler)(async (req, res) => {
    const trunkId = req.params.id;
    try {
        // For MessageNet trunk, return the status from FreeSWITCH
        if (trunkId === 'messagenet') {
            // This would normally query FreeSWITCH ESL for real status
            const status = {
                id: trunkId,
                name: 'MessageNet',
                status: 'registered',
                last_registration: new Date().toISOString(),
                calls_in: 0,
                calls_out: 0,
                failed_calls: 0
            };
            (0, response_1.successResponse)(res, status, 'SIP trunk status retrieved successfully');
        }
        else {
            (0, response_1.errorResponse)(res, 'SIP trunk not found', 404);
        }
    }
    catch (error) {
        console.error('Error fetching SIP trunk status:', error);
        (0, response_1.errorResponse)(res, 'Failed to fetch SIP trunk status', 500);
    }
}));
exports.default = router;
//# sourceMappingURL=sip-trunks.js.map