"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTenantContext = exports.requireMasterTenant = exports.requireTenantOwnerOrMaster = void 0;
const response_1 = require("../utils/response");
/**
 * Middleware to require that the authenticated user is either:
 * 1. The owner of the resource (tenant_id matches)
 * 2. A super admin from the master tenant
 *
 * This allows master tenant to manage all tenants while regular tenants
 * can only manage their own resources.
 */
exports.requireTenantOwnerOrMaster = (0, response_1.asyncHandler)(async (req, res, next) => {
    const { user } = req;
    if (!user) {
        return (0, response_1.errorResponse)(res, 'Unauthorized: no user in request', 401);
    }
    // Extract tenant ID from various sources (params, body, query)
    const resourceTenantId = req.params.tenantId ||
        req.body.tenant_id ||
        req.query.tenant_id ||
        req.params.id; // For tenant-specific routes like /api/tenants/:id
    // If no resource tenant ID found, require master tenant
    if (!resourceTenantId) {
        if (user.role === 'super_admin' || user.is_master_tenant) {
            return next();
        }
        return (0, response_1.errorResponse)(res, 'Unauthorized: cannot determine resource tenant', 403);
    }
    // Super admin or master tenant can access all resources
    if (user.role === 'super_admin' || user.is_master_tenant) {
        return next();
    }
    // Regular tenant user can only access their own tenant's resources
    if (user.tenant_id !== resourceTenantId) {
        return (0, response_1.errorResponse)(res, 'Unauthorized: can only access own tenant resources', 403, 'FORBIDDEN_TENANT_ACCESS');
    }
    next();
});
/**
 * Middleware to require that the authenticated user is from the master tenant.
 * Used for operations that only the master tenant should perform (e.g., creating new tenants).
 */
exports.requireMasterTenant = (0, response_1.asyncHandler)(async (req, res, next) => {
    const { user } = req;
    if (!user) {
        return (0, response_1.errorResponse)(res, 'Unauthorized: no user in request', 401);
    }
    // Check if user is super admin or from master tenant
    if (!user.is_master_tenant && user.role !== 'super_admin') {
        return (0, response_1.errorResponse)(res, 'Unauthorized: only master tenant can perform this action', 403, 'MASTER_TENANT_REQUIRED');
    }
    next();
});
/**
 * Middleware to extract and validate tenant context from request.
 * Attaches tenant_id to request for downstream use.
 */
exports.extractTenantContext = (0, response_1.asyncHandler)(async (req, res, next) => {
    const { user } = req;
    if (!user) {
        return (0, response_1.errorResponse)(res, 'Unauthorized: no user in request', 401);
    }
    // For master tenant, allow them to impersonate other tenants via header
    if (user.is_master_tenant || user.role === 'super_admin') {
        const impersonateTenantId = req.headers['x-tenant-id'];
        if (impersonateTenantId) {
            req.tenantContext = {
                tenant_id: impersonateTenantId,
                is_impersonating: true,
                original_user: user,
            };
            return next();
        }
    }
    // Regular users use their own tenant
    req.tenantContext = {
        tenant_id: user.tenant_id,
        is_impersonating: false,
        original_user: user,
    };
    next();
});
//# sourceMappingURL=tenant-auth.js.map