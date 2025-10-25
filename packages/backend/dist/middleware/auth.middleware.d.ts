import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '@w3-voip/shared';
export interface AuthenticatedRequest extends Request {
    user?: JWTPayload & {
        id?: string;
        email?: string;
        tenant_slug?: string;
    };
}
/**
 * Middleware to authenticate JWT tokens
 */
export declare function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): Response<any, Record<string, any>>;
/**
 * Middleware to require super admin role
 */
export declare function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Response<any, Record<string, any>>;
/**
 * Middleware to require admin role (super admin or tenant admin)
 */
export declare function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Response<any, Record<string, any>>;
/**
 * Middleware to require tenant admin role
 */
export declare function requireTenantAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Response<any, Record<string, any>>;
/**
 * Middleware to require tenant access (user must belong to the tenant)
 */
export declare function requireTenantAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
//# sourceMappingURL=auth.middleware.d.ts.map