"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFreeSWITCHEvent = exports.logCDREvent = exports.logSecurityEvent = exports.requestLogger = exports.freeswitchLogger = exports.cdrLogger = exports.apiLogger = exports.securityLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
// Create logs directory if it doesn't exist
const logsDir = path_1.default.join(process.cwd(), 'logs');
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
// Tell winston that you want to link the colors
winston_1.default.addColors(colors);
// Define which level to use based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};
// Define format for console output
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// Define format for file output
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// Define transports
const transports = [
    // Console transport
    new winston_1.default.transports.Console({
        format: consoleFormat,
    }),
    // Error log file
    new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logsDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: fileFormat,
        maxSize: '20m',
        maxFiles: '14d',
    }),
    // Combined log file
    new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logsDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        format: fileFormat,
        maxSize: '20m',
        maxFiles: '14d',
    }),
    // Security events log file
    new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logsDir, 'security-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'warn',
        format: fileFormat,
        maxSize: '20m',
        maxFiles: '30d', // Keep security logs longer
    }),
    // API access log file
    new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logsDir, 'api-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        format: fileFormat,
        maxSize: '20m',
        maxFiles: '7d',
    }),
];
// Create the logger
const logger = winston_1.default.createLogger({
    level: level(),
    levels,
    transports,
    exitOnError: false,
});
// Create specialized loggers for different components
exports.securityLogger = winston_1.default.createLogger({
    level: 'info',
    levels,
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.label({ label: 'SECURITY' }), winston_1.default.format.printf((info) => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`)),
        }),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'security-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            format: fileFormat,
            maxSize: '20m',
            maxFiles: '30d',
        }),
    ],
});
exports.apiLogger = winston_1.default.createLogger({
    level: 'http',
    levels,
    transports: [
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'api-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            format: fileFormat,
            maxSize: '20m',
            maxFiles: '7d',
        }),
    ],
});
exports.cdrLogger = winston_1.default.createLogger({
    level: 'info',
    levels,
    transports: [
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'cdr-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            format: fileFormat,
            maxSize: '50m',
            maxFiles: '90d', // Keep CDR logs for 3 months
        }),
    ],
});
exports.freeswitchLogger = winston_1.default.createLogger({
    level: 'info',
    levels,
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.label({ label: 'FREESWITCH' }), winston_1.default.format.printf((info) => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`)),
        }),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'freeswitch-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            format: fileFormat,
            maxSize: '20m',
            maxFiles: '14d',
        }),
    ],
});
// Logging middleware for Express
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            tenantId: req.tenantId,
            userId: req.user?.sub,
            requestId: req.id,
        };
        if (res.statusCode >= 400) {
            exports.apiLogger.warn('API Request', logData);
        }
        else {
            exports.apiLogger.http('API Request', logData);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
// Security event logger
const logSecurityEvent = (event, details, req) => {
    const logData = {
        event,
        details,
        timestamp: new Date().toISOString(),
        ip: req?.ip,
        userAgent: req?.headers['user-agent'],
        tenantId: req?.tenantId,
        userId: req?.user?.sub,
        requestId: req?.id,
    };
    exports.securityLogger.warn('Security Event', logData);
};
exports.logSecurityEvent = logSecurityEvent;
// CDR event logger
const logCDREvent = (event, cdrData) => {
    const logData = {
        event,
        cdr: cdrData,
        timestamp: new Date().toISOString(),
    };
    exports.cdrLogger.info('CDR Event', logData);
};
exports.logCDREvent = logCDREvent;
// FreeSWITCH event logger
const logFreeSWITCHEvent = (event, data) => {
    const logData = {
        event,
        data,
        timestamp: new Date().toISOString(),
    };
    exports.freeswitchLogger.info('FreeSWITCH Event', logData);
};
exports.logFreeSWITCHEvent = logFreeSWITCHEvent;
exports.default = logger;
//# sourceMappingURL=logger.js.map