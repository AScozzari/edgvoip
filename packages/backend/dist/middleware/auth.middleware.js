"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.requireSuperAdmin = requireSuperAdmin;
exports.requireAdmin = requireAdmin;
exports.requireTenantAccess = requireTenantAccess;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware to authenticate JWT tokens
 */
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            tenant_id: decoded.tenant_id,
            tenant_slug: decoded.tenant_slug
        };
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
}
/**
 * Middleware to require super admin role
 */
function requireSuperAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            error: 'Super admin access required'
        });
    }
    next();
}
/**
 * Middleware to require admin role (super admin or tenant admin)
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
}
/**
 * Middleware to require tenant access (user must belong to the tenant)
 */
function requireTenantAccess(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    // Super admin can access any tenant
    if (req.user.role === 'super_admin') {
        return next();
    }
    // Regular users must belong to the tenant
    const tenantId = req.params.tenantId || req.body.tenant_id;
    if (req.user.tenant_id !== tenantId) {
        return res.status(403).json({
            success: false,
            error: 'Access denied for this tenant'
        });
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map