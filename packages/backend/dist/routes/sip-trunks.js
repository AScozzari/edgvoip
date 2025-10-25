"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const response_1 = require("../utils/response");
const database_1 = require("@w3-voip/database");
const router = (0, express_1.Router)();
// Apply authentication and tenant context to all routes
router.use(middleware_1.authenticateToken);
router.use(middleware_1.requireTenant);
router.use(middleware_1.setTenantContext);
// Get SIP trunks for tenant
router.get('/', (0, response_1.asyncHandler)(async (req, res) => {
    const client = await (0, database_1.getClient)();
    try {
        const result = await client.query(`SELECT 
        id, 
        tenant_id, 
        name, 
        provider, 
        status,
        provider_config,
        sip_config,
        created_at,
        updated_at
      FROM sip_trunks 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC`, [req.tenantId]);
        (0, response_1.successResponse)(res, result.rows, 'SIP trunks retrieved successfully');
    }
    catch (error) {
        console.error('Error fetching SIP trunks:', error);
        (0, response_1.errorResponse)(res, 'Failed to fetch SIP trunks', 500);
    }
    finally {
        await client.release();
    }
}));
// Get SIP trunk status
router.get('/:id/status', (0, response_1.asyncHandler)(async (req, res) => {
    const trunkId = req.params.id;
    const client = await (0, database_1.getClient)();
    try {
        const result = await client.query(`SELECT 
        id, 
        name, 
        status,
        last_successful_registration,
        current_calls,
        max_concurrent_calls
      FROM sip_trunks 
      WHERE id = $1 AND tenant_id = $2`, [trunkId, req.tenantId]);
        if (result.rows.length === 0) {
            return (0, response_1.errorResponse)(res, 'SIP trunk not found', 404);
        }
        const trunk = result.rows[0];
        const status = {
            id: trunk.id,
            name: trunk.name,
            status: trunk.status,
            last_registration: trunk.last_successful_registration,
            calls_in: trunk.current_calls || 0,
            calls_out: 0,
            failed_calls: 0
        };
        (0, response_1.successResponse)(res, status, 'SIP trunk status retrieved successfully');
    }
    catch (error) {
        console.error('Error fetching SIP trunk status:', error);
        (0, response_1.errorResponse)(res, 'Failed to fetch SIP trunk status', 500);
    }
    finally {
        await client.release();
    }
}));
exports.default = router;
//# sourceMappingURL=sip-trunks.js.map