import express from 'express';
import { RoutingService } from '../services/routing.service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireTenantOwnerOrMaster } from '../middleware/tenant-auth';
import { asyncHandler, successResponse, errorResponse } from '../utils/response';

const router = express.Router();
const routingService = new RoutingService();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== INBOUND ROUTES ====================

router.get(
  '/inbound',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const { tenant_id } = req.query;
    if (!tenant_id) {
      return errorResponse(res, 'tenant_id is required', 400);
    }

    const routes = await routingService.getInboundRoutes(tenant_id as string);
    successResponse(res, { routes, total: routes.length });
  })
);

router.post(
  '/inbound',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const route = await routingService.createInboundRoute(req.body);
    successResponse(res, route, 'Inbound route created successfully', 201);
  })
);

router.put(
  '/inbound/:id',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const route = await routingService.updateInboundRoute(req.params.id, req.body);
    successResponse(res, route, 'Inbound route updated successfully');
  })
);

router.delete(
  '/inbound/:id',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    await routingService.deleteInboundRoute(req.params.id);
    successResponse(res, { deleted: true }, 'Inbound route deleted successfully');
  })
);

// ==================== OUTBOUND ROUTES ====================

router.get(
  '/outbound',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const { tenant_id } = req.query;
    if (!tenant_id) {
      return errorResponse(res, 'tenant_id is required', 400);
    }

    const routes = await routingService.getOutboundRoutes(tenant_id as string);
    successResponse(res, { routes, total: routes.length });
  })
);

router.post(
  '/outbound',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const route = await routingService.createOutboundRoute(req.body);
    successResponse(res, route, 'Outbound route created successfully', 201);
  })
);

router.put(
  '/outbound/:id',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const route = await routingService.updateOutboundRoute(req.params.id, req.body);
    successResponse(res, route, 'Outbound route updated successfully');
  })
);

router.delete(
  '/outbound/:id',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    await routingService.deleteOutboundRoute(req.params.id);
    successResponse(res, { deleted: true }, 'Outbound route deleted successfully');
  })
);

// ==================== TIME CONDITIONS ====================

router.get(
  '/time-conditions',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const { tenant_id } = req.query;
    if (!tenant_id) {
      return errorResponse(res, 'tenant_id is required', 400);
    }

    const conditions = await routingService.getTimeConditions(tenant_id as string);
    successResponse(res, { time_conditions: conditions, total: conditions.length });
  })
);

router.post(
  '/time-conditions',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const condition = await routingService.createTimeCondition(req.body);
    successResponse(res, condition, 'Time condition created successfully', 201);
  })
);

router.put(
  '/time-conditions/:id',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    const condition = await routingService.updateTimeCondition(req.params.id, req.body);
    successResponse(res, condition, 'Time condition updated successfully');
  })
);

router.delete(
  '/time-conditions/:id',
  requireTenantOwnerOrMaster,
  asyncHandler(async (req: AuthRequest, res) => {
    await routingService.deleteTimeCondition(req.params.id);
    successResponse(res, { deleted: true }, 'Time condition deleted successfully');
  })
);

export default router;

