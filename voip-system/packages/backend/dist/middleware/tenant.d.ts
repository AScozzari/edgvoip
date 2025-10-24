import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export declare const setTenantContext: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const setStoreContext: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const tenantRateLimit: (maxRequests?: number, windowMs?: number) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateTenantResource: (resourceType: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=tenant.d.ts.map