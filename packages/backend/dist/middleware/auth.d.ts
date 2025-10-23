import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '@w3-voip/shared';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
            tenantId?: string;
            storeId?: string;
        }
    }
}
export interface AuthRequest extends Request {
    user: JWTPayload;
    tenantId: string;
    storeId?: string;
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireTenant: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireSuperAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireRole: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requirePermission: (permission: string) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireStoreAccess: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const generateToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const verifyToken: (token: string) => JWTPayload;
//# sourceMappingURL=auth.d.ts.map