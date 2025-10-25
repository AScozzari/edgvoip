import { Response, NextFunction } from 'express';
import { AuthRequest, asyncHandler, errorResponse } from '../utils/response';

/**
 * Middleware to require that the authenticated user is either:
 * 1. The owner of the resource (tenant_id matches)
 * 2. A super admin from the master tenant
 * 
 * This allows master tenant to manage all tenants while regular tenants
 * can only manage their own resources.
 */
export const requireTenantOwnerOrMaster = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user) {
      return errorResponse(res, 'Unauthorized: no user in request', 401);
    }

    // Extract tenant ID from various sources (params, body, query)
    const resourceTenantId =
      req.params.tenantId ||
      req.body.tenant_id ||
      req.query.tenant_id ||
      req.params.id; // For tenant-specific routes like /api/tenants/:id

    // If no resource tenant ID found, require master tenant
    if (!resourceTenantId) {
      if (user.role === 'super_admin' || user.is_master_tenant) {
        return next();
      }
      return errorResponse(
        res,
        'Unauthorized: cannot determine resource tenant',
        403
      );
    }

    // Super admin or master tenant can access all resources
    if (user.role === 'super_admin' || user.is_master_tenant) {
      return next();
    }

    // Regular tenant user can only access their own tenant's resources
    if (user.tenant_id !== resourceTenantId) {
      return errorResponse(
        res,
        'Unauthorized: can only access own tenant resources',
        403,
        'FORBIDDEN_TENANT_ACCESS'
      );
    }

    next();
  }
);

/**
 * Middleware to require that the authenticated user is from the master tenant.
 * Used for operations that only the master tenant should perform (e.g., creating new tenants).
 */
export const requireMasterTenant = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user) {
      return errorResponse(res, 'Unauthorized: no user in request', 401);
    }

    // Check if user is super admin or from master tenant
    if (!user.is_master_tenant && user.role !== 'super_admin') {
      return errorResponse(
        res,
        'Unauthorized: only master tenant can perform this action',
        403,
        'MASTER_TENANT_REQUIRED'
      );
    }

    next();
  }
);

/**
 * Middleware to extract and validate tenant context from request.
 * Attaches tenant_id to request for downstream use.
 */
export const extractTenantContext = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user) {
      return errorResponse(res, 'Unauthorized: no user in request', 401);
    }

    // For master tenant, allow them to impersonate other tenants via header
    if (user.is_master_tenant || user.role === 'super_admin') {
      const impersonateTenantId = req.headers['x-tenant-id'] as string;
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
  }
);

