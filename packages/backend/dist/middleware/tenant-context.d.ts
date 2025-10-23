import { Request, Response, NextFunction } from 'express';
export interface TenantContext {
    tenant_id: string;
    sip_domain: string;
    store_id?: string;
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
        }
    }
}
export declare function tenantContextMiddleware(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
export declare function generateSipDomain(tenantName: string): string;
export declare function validateSipDomain(sipDomain: string): boolean;
//# sourceMappingURL=tenant-context.d.ts.map