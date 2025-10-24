import winston from 'winston';
declare const logger: winston.Logger;
export declare const securityLogger: winston.Logger;
export declare const apiLogger: winston.Logger;
export declare const cdrLogger: winston.Logger;
export declare const freeswitchLogger: winston.Logger;
export declare const requestLogger: (req: any, res: any, next: any) => void;
export declare const logSecurityEvent: (event: string, details: any, req?: any) => void;
export declare const logCDREvent: (event: string, cdrData: any) => void;
export declare const logFreeSWITCHEvent: (event: string, data: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map