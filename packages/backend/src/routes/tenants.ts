// @ts-nocheck
import express from 'express';
import { TenantService } from '../services/tenant.service';
import { authenticateToken, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import { asyncHandler, successResponse, errorResponse } from '../utils/response';
import { CreateTenantRequestSchema } from '@w3-voip/shared';

const router = express.Router();
const tenantService = new TenantService();

// Apply authentication and super admin middleware to all routes
router.use(authenticateToken);
router.use(requireSuperAdmin);

// GET /api/tenants - List all tenants with statistics
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 50, search } = req.query;
  
  const result = await tenantService.listTenants(
    parseInt(page as string),
    parseInt(limit as string),
    search as string
  );

  successResponse(res, {
    tenants: result.tenants,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: result.total,
      total_pages: result.totalPages
    }
  }, 'Tenants retrieved successfully');
}));

// GET /api/tenants/stats - Get cross-tenant statistics
router.get('/stats', asyncHandler(async (req: AuthRequest, res) => {
  const stats = await tenantService.getCrossTenantStats();
  successResponse(res, stats, 'Cross-tenant statistics retrieved successfully');
}));

// GET /api/tenants/stats-list - Get detailed statistics for all tenants
router.get('/stats-list', asyncHandler(async (req: AuthRequest, res) => {
  const statsList = await tenantService.getTenantStatsList();
  successResponse(res, statsList, 'Tenant statistics list retrieved successfully');
}));

// POST /api/tenants - Create new tenant with companies and contacts
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  // Validate request body
  const validationResult = CreateTenantRequestSchema.safeParse(req.body);
  if (!validationResult.success) {
    return errorResponse(res, 'Invalid request data', 400, 'VALIDATION_ERROR', validationResult.error.errors);
  }

  const tenantData = validationResult.data;
  
  // Determine if this is a super admin tenant
  const isSuperAdmin = tenantData.slug === 'edgvoip' || 
                       tenantData.admin_user?.role === 'super_admin';
  
  // Auto-generate sip_domain if not provided
  if (!tenantData.sip_domain) {
    if (isSuperAdmin) {
      // Super admin tenants don't need SIP domain (they only manage other tenants)
      tenantData.sip_domain = null;
      console.log('Super admin tenant - no SIP domain needed');
    } else {
      // Regular tenants get auto-generated SIP domain
      tenantData.sip_domain = tenantData.slug + '.edgvoip.it';
      console.log('Auto-generated SIP domain: ' + tenantData.sip_domain);
    }
  }
  
  const tenant = await tenantService.createTenantWithCompanies(tenantData);
  
  successResponse(res, tenant, 'Tenant created successfully');
}));

// GET /api/tenants/:id - Get tenant details with companies and contacts
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const result = await tenantService.getTenantWithDetails(id);
  successResponse(res, result, 'Tenant details retrieved successfully');
}));

// PUT /api/tenants/:id - Update tenant
router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const tenant = await tenantService.updateTenant(id, updateData);
  successResponse(res, tenant, 'Tenant updated successfully');
}));

// DELETE /api/tenants/:id - Delete tenant (soft delete)
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  await tenantService.deleteTenant(id);
  successResponse(res, null, 'Tenant deleted successfully');
}));

export default router;
