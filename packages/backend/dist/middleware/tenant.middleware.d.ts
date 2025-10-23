import { Request, Response, NextFunction } from 'express';
export interface TenantRequest extends Request {
    tenant?: {
        id: string;
        slug: string;
        name: string;
        domain: string;
        sip_domain: string;
    };
}
/**
 * Middleware to validate tenant slug from URL parameters
 * Extracts tenant information and attaches it to the request object
 */
export declare function validateTenantSlug(req: TenantRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
/**
 * Middleware to extract tenant slug from JWT token
 * Used for API calls that don't have tenant slug in URL
 */
export declare function extractTenantFromToken(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
//# sourceMappingURL=tenant.middleware.d.ts.map