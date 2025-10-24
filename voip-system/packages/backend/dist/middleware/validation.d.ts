import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare function validateRequest(schema: ZodSchema<any>, source?: 'body' | 'query' | 'params'): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const validateUUID: (field: string) => import("express-validator").ValidationChain;
export declare const validateTenant: import("express-validator").ValidationChain[];
export declare const validateStore: import("express-validator").ValidationChain[];
export declare const validateExtension: import("express-validator").ValidationChain[];
export declare const validateSipTrunk: import("express-validator").ValidationChain[];
export declare const validateTrunkRegistration: import("express-validator").ValidationChain[];
export declare const validateCDRFilter: import("express-validator").ValidationChain[];
export declare const validatePagination: import("express-validator").ValidationChain[];
export declare const validateSearch: import("express-validator").ValidationChain[];
//# sourceMappingURL=validation.d.ts.map