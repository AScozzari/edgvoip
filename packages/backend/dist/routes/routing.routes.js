"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routing_service_1 = require("../services/routing.service");
const auth_1 = require("../middleware/auth");
const tenant_auth_1 = require("../middleware/tenant-auth");
const response_1 = require("../utils/response");
const router = express_1.default.Router();
const routingService = new routing_service_1.RoutingService();
// Apply authentication to all routes
router.use(auth_1.authenticateToken);
// ==================== INBOUND ROUTES ====================
router.get('/inbound', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { tenant_id } = req.query;
    if (!tenant_id) {
        return (0, response_1.errorResponse)(res, 'tenant_id is required', 400);
    }
    const routes = await routingService.getInboundRoutes(tenant_id);
    (0, response_1.successResponse)(res, { routes, total: routes.length });
}));
router.post('/inbound', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const route = await routingService.createInboundRoute(req.body);
    (0, response_1.successResponse)(res, route, 'Inbound route created successfully', 201);
}));
router.put('/inbound/:id', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const route = await routingService.updateInboundRoute(req.params.id, req.body);
    (0, response_1.successResponse)(res, route, 'Inbound route updated successfully');
}));
router.delete('/inbound/:id', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    await routingService.deleteInboundRoute(req.params.id);
    (0, response_1.successResponse)(res, { deleted: true }, 'Inbound route deleted successfully');
}));
// ==================== OUTBOUND ROUTES ====================
router.get('/outbound', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { tenant_id } = req.query;
    if (!tenant_id) {
        return (0, response_1.errorResponse)(res, 'tenant_id is required', 400);
    }
    const routes = await routingService.getOutboundRoutes(tenant_id);
    (0, response_1.successResponse)(res, { routes, total: routes.length });
}));
router.post('/outbound', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const route = await routingService.createOutboundRoute(req.body);
    (0, response_1.successResponse)(res, route, 'Outbound route created successfully', 201);
}));
router.put('/outbound/:id', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const route = await routingService.updateOutboundRoute(req.params.id, req.body);
    (0, response_1.successResponse)(res, route, 'Outbound route updated successfully');
}));
router.delete('/outbound/:id', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    await routingService.deleteOutboundRoute(req.params.id);
    (0, response_1.successResponse)(res, { deleted: true }, 'Outbound route deleted successfully');
}));
// ==================== TIME CONDITIONS ====================
router.get('/time-conditions', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const { tenant_id } = req.query;
    if (!tenant_id) {
        return (0, response_1.errorResponse)(res, 'tenant_id is required', 400);
    }
    const conditions = await routingService.getTimeConditions(tenant_id);
    (0, response_1.successResponse)(res, { time_conditions: conditions, total: conditions.length });
}));
router.post('/time-conditions', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const condition = await routingService.createTimeCondition(req.body);
    (0, response_1.successResponse)(res, condition, 'Time condition created successfully', 201);
}));
router.put('/time-conditions/:id', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    const condition = await routingService.updateTimeCondition(req.params.id, req.body);
    (0, response_1.successResponse)(res, condition, 'Time condition updated successfully');
}));
router.delete('/time-conditions/:id', tenant_auth_1.requireTenantOwnerOrMaster, (0, response_1.asyncHandler)(async (req, res) => {
    await routingService.deleteTimeCondition(req.params.id);
    (0, response_1.successResponse)(res, { deleted: true }, 'Time condition deleted successfully');
}));
exports.default = router;
//# sourceMappingURL=routing.routes.js.map