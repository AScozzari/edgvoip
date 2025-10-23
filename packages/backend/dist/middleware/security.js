"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityEventLogger = exports.ipWhitelist = exports.requestSizeLimit = exports.validateContentType = exports.sanitizeInput = exports.cdrRateLimit = exports.authRateLimit = exports.apiRateLimit = exports.createRateLimit = exports.requestId = exports.securityHeaders = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const uuid_1 = require("uuid");
// Security Headers Middleware
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "ws:", "wss:"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});
// Request ID Middleware
const requestId = (req, res, next) => {
    req.id = req.headers['x-request-id'] || (0, uuid_1.v4)();
    res.set('X-Request-ID', req.id);
    next();
};
exports.requestId = requestId;
// Rate Limiting Middleware
const createRateLimit = (windowMs, max, message) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: message || `Too many requests, please try again later.`
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            // Use tenant ID if available, otherwise IP
            const tenantId = req.tenantId;
            return tenantId ? `tenant:${tenantId}` : req.ip;
        }
    });
};
exports.createRateLimit = createRateLimit;
// General API Rate Limiting
exports.apiRateLimit = (0, exports.createRateLimit)(15 * 60 * 1000, // 15 minutes
100, // 100 requests per window
'API rate limit exceeded. Max 100 requests per 15 minutes.');
// Authentication Rate Limiting
exports.authRateLimit = (0, exports.createRateLimit)(15 * 60 * 1000, // 15 minutes
5, // 5 requests per window
'Authentication rate limit exceeded. Max 5 attempts per 15 minutes.');
// CDR Webhook Rate Limiting
exports.cdrRateLimit = (0, exports.createRateLimit)(60 * 1000, // 1 minute
1000, // 1000 requests per minute
'CDR webhook rate limit exceeded.');
// Input Sanitization Middleware
const sanitizeInput = (req, res, next) => {
    // Remove potentially dangerous characters from string inputs
    const sanitizeString = (str) => {
        return str
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    };
    // Recursively sanitize object properties
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return sanitizeString(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitizeObject(value);
            }
            return sanitized;
        }
        return obj;
    };
    // Sanitize request body, query, and params
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
// Content Type Validation Middleware
const validateContentType = (allowedTypes = ['application/json']) => {
    return (req, res, next) => {
        if (req.method === 'GET' || req.method === 'DELETE') {
            return next();
        }
        const contentType = req.headers['content-type'];
        if (!contentType) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'CONTENT_TYPE_REQUIRED',
                    message: 'Content-Type header is required'
                }
            });
        }
        const isValidType = allowedTypes.some(type => contentType.toLowerCase().includes(type.toLowerCase()));
        if (!isValidType) {
            return res.status(415).json({
                success: false,
                error: {
                    code: 'UNSUPPORTED_CONTENT_TYPE',
                    message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
                }
            });
        }
        next();
    };
};
exports.validateContentType = validateContentType;
// Request Size Limiting Middleware
const requestSizeLimit = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxBytes = parseSize(maxSize);
        if (contentLength > maxBytes) {
            return res.status(413).json({
                success: false,
                error: {
                    code: 'REQUEST_TOO_LARGE',
                    message: `Request size exceeds limit of ${maxSize}`
                }
            });
        }
        next();
    };
};
exports.requestSizeLimit = requestSizeLimit;
// Parse size string to bytes
function parseSize(size) {
    const units = {
        b: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024
    };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!match) {
        throw new Error(`Invalid size format: ${size}`);
    }
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    return Math.floor(value * units[unit]);
}
// IP Whitelist Middleware
const ipWhitelist = (allowedIPs) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!clientIP) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'IP_NOT_DETECTED',
                    message: 'Unable to detect client IP address'
                }
            });
        }
        const isAllowed = allowedIPs.some(allowedIP => {
            if (allowedIP.includes('/')) {
                // CIDR notation
                return isIPInCIDR(clientIP, allowedIP);
            }
            else {
                // Exact match
                return clientIP === allowedIP;
            }
        });
        if (!isAllowed) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'IP_NOT_ALLOWED',
                    message: 'IP address not in whitelist'
                }
            });
        }
        next();
    };
};
exports.ipWhitelist = ipWhitelist;
// Check if IP is in CIDR range
function isIPInCIDR(ip, cidr) {
    const [network, prefixLength] = cidr.split('/');
    const ipNum = ipToNumber(ip);
    const networkNum = ipToNumber(network);
    const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0;
    return (ipNum & mask) === (networkNum & mask);
}
// Convert IP to number
function ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}
// Security Event Logging Middleware
const securityEventLogger = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        // Log security events
        if (res.statusCode >= 400) {
            const securityEvent = {
                timestamp: new Date().toISOString(),
                requestId: req.id,
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                statusCode: res.statusCode,
                tenantId: req.tenantId,
                userId: req.user?.sub
            };
            console.warn('Security Event:', securityEvent);
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.securityEventLogger = securityEventLogger;
//# sourceMappingURL=security.js.map