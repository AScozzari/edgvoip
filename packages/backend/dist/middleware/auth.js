"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = exports.optionalAuth = exports.requireStoreAccess = exports.requirePermission = exports.requireRole = exports.requireSuperAdmin = exports.requireTenant = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'MISSING_TOKEN',
                message: 'Access token required'
            }
        });
    }
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET not configured');
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Set user context
        req.user = decoded;
        req.tenantId = decoded.tenant_id;
        req.storeId = decoded.store_id;
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token'
            }
        });
    }
};
exports.authenticateToken = authenticateToken;
// Tenant Isolation Middleware
const requireTenant = (req, res, next) => {
    if (!req.tenantId) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'TENANT_REQUIRED',
                message: 'Tenant context required'
            }
        });
    }
    next();
};
exports.requireTenant = requireTenant;
// Super Admin Access Middleware
const requireSuperAdmin = (req, res, next) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            error: {
                code: 'SUPER_ADMIN_REQUIRED',
                message: 'Super admin access required'
            }
        });
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
// Role-based Authorization Middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTHENTICATION_REQUIRED',
                    message: 'Authentication required'
                }
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: `Required role: ${roles.join(' or ')}`
                }
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Permission-based Authorization Middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTHENTICATION_REQUIRED',
                    message: 'Authentication required'
                }
            });
        }
        if (!req.user.permissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: `Required permission: ${permission}`
                }
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// Store Access Middleware
const requireStoreAccess = (req, res, next) => {
    const storeId = req.params.storeId || req.body.storeId || req.query.storeId;
    if (!storeId) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'STORE_ID_REQUIRED',
                message: 'Store ID required'
            }
        });
    }
    // If user has store_id in token, verify it matches
    if (req.user.store_id && req.user.store_id !== storeId) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'STORE_ACCESS_DENIED',
                message: 'Access denied to this store'
            }
        });
    }
    req.storeId = storeId;
    next();
};
exports.requireStoreAccess = requireStoreAccess;
// Optional Authentication Middleware (for public endpoints)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const secret = process.env.JWT_SECRET;
            if (secret) {
                const decoded = jsonwebtoken_1.default.verify(token, secret);
                req.user = decoded;
                req.tenantId = decoded.tenant_id;
                req.storeId = decoded.store_id;
            }
        }
        catch (error) {
            // Ignore token errors for optional auth
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
// Generate JWT Token
const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET not configured');
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
};
exports.generateToken = generateToken;
// Verify JWT Token
const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET not configured');
    }
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.js.map