"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = __importDefault(require("express"));
const tenant_service_1 = require("../services/tenant.service");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const shared_1 = require("@w3-voip/shared");
const router = express_1.default.Router();
const tenantService = new tenant_service_1.TenantService();
// Apply authentication and super admin middleware to all routes
router.use(auth_1.authenticateToken);
router.use(auth_1.requireSuperAdmin);
// GET /api/tenants - List all tenants with statistics
router.get('/', (0, response_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 50, search } = req.query;
    const result = await tenantService.listTenants(parseInt(page), parseInt(limit), search);
    (0, response_1.successResponse)(res, {
        tenants: result.tenants,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: result.total,
            total_pages: result.totalPages
        }
    }, 'Tenants retrieved successfully');
}));
// GET /api/tenants/stats - Get cross-tenant statistics
router.get('/stats', (0, response_1.asyncHandler)(async (req, res) => {
    const stats = await tenantService.getCrossTenantStats();
    (0, response_1.successResponse)(res, stats, 'Cross-tenant statistics retrieved successfully');
}));
// GET /api/tenants/stats-list - Get detailed statistics for all tenants
router.get('/stats-list', (0, response_1.asyncHandler)(async (req, res) => {
    const statsList = await tenantService.getTenantStatsList();
    (0, response_1.successResponse)(res, statsList, 'Tenant statistics list retrieved successfully');
}));
// POST /api/tenants - Create new tenant with companies and contacts
router.post('/', (0, response_1.asyncHandler)(async (req, res) => {
    // Validate request body
    const validationResult = shared_1.CreateTenantRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
        return (0, response_1.errorResponse)(res, 'Invalid request data', 400, 'VALIDATION_ERROR', validationResult.error.errors);
    }
    const tenantData = validationResult.data;
    // Determine if this is a super admin tenant
    const isSuperAdmin = tenantData.slug === 'edg-voip' ||
        tenantData.admin_user?.role === 'super_admin';
    // Auto-generate sip_domain if not provided
    if (!tenantData.sip_domain) {
        if (isSuperAdmin) {
            // Super admin tenants don't need SIP domain (they only manage other tenants)
            tenantData.sip_domain = null;
            console.log('Super admin tenant - no SIP domain needed');
        }
        else {
            // Regular tenants get auto-generated SIP domain
            tenantData.sip_domain = tenantData.slug + '.edgvoip.it';
            console.log('Auto-generated SIP domain: ' + tenantData.sip_domain);
        }
    }
    const tenant = await tenantService.createTenantWithCompanies(tenantData);
    (0, response_1.successResponse)(res, tenant, 'Tenant created successfully');
}));
// GET /api/tenants/:id - Get tenant details with companies and contacts
router.get('/:id', (0, response_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await tenantService.getTenantWithDetails(id);
    (0, response_1.successResponse)(res, result, 'Tenant details retrieved successfully');
}));
// PUT /api/tenants/:id - Update tenant
router.put('/:id', (0, response_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const tenant = await tenantService.updateTenant(id, updateData);
    (0, response_1.successResponse)(res, tenant, 'Tenant updated successfully');
}));
// DELETE /api/tenants/:id - Delete tenant (soft delete)
router.delete('/:id', (0, response_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await tenantService.deleteTenant(id);
    (0, response_1.successResponse)(res, null, 'Tenant deleted successfully');
}));
exports.default = router;
//# sourceMappingURL=tenants.js.map