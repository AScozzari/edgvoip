/**
 * Middleware to require that the authenticated user is either:
 * 1. The owner of the resource (tenant_id matches)
 * 2. A super admin from the master tenant
 *
 * This allows master tenant to manage all tenants while regular tenants
 * can only manage their own resources.
 */
export declare const requireTenantOwnerOrMaster: (req: any, res: any, next: any) => void;
/**
 * Middleware to require that the authenticated user is from the master tenant.
 * Used for operations that only the master tenant should perform (e.g., creating new tenants).
 */
export declare const requireMasterTenant: (req: any, res: any, next: any) => void;
/**
 * Middleware to extract and validate tenant context from request.
 * Attaches tenant_id to request for downstream use.
 */
export declare const extractTenantContext: (req: any, res: any, next: any) => void;
//# sourceMappingURL=tenant-auth.d.ts.map