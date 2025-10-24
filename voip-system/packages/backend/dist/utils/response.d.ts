import { Response } from 'express';
export declare const successResponse: <T>(res: Response, data: T, message?: string, statusCode?: number) => void;
export declare const errorResponse: (res: Response, message: string, statusCode?: number, code?: string, details?: any) => void;
export declare const paginatedResponse: <T>(res: Response, data: T[], pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}, message?: string) => void;
export declare const createdResponse: <T>(res: Response, data: T, message?: string) => void;
export declare const updatedResponse: <T>(res: Response, data: T, message?: string) => void;
export declare const deletedResponse: (res: Response, message?: string) => void;
export declare const notFoundResponse: (res: Response, message?: string) => void;
export declare const unauthorizedResponse: (res: Response, message?: string) => void;
export declare const forbiddenResponse: (res: Response, message?: string) => void;
export declare const badRequestResponse: (res: Response, message?: string, details?: any) => void;
export declare const conflictResponse: (res: Response, message?: string) => void;
export declare const tooManyRequestsResponse: (res: Response, message?: string) => void;
export declare const internalServerErrorResponse: (res: Response, message?: string, details?: any) => void;
export declare const serviceUnavailableResponse: (res: Response, message?: string) => void;
export declare const asyncHandler: (fn: Function) => (req: any, res: any, next: any) => void;
export declare const errorHandler: (error: any, req: any, res: any, next: any) => void;
//# sourceMappingURL=response.d.ts.map