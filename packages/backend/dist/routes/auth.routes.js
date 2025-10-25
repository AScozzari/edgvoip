"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@w3-voip/database");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const router = express_1.default.Router();
/**
 * Super admin login: POST /superadmin/login
 * Authenticates super admin users (no tenant validation)
 */
router.post('/superadmin/login', async (req, res) => {
    console.log('🚀 SUPER ADMIN LOGIN ROUTE REACHED!');
    console.log('Super admin login request body:', JSON.stringify(req.body));
    const { email, password } = req.body;
    if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.status(400).json({
            success: false,
            error: 'Email and password are required'
        });
    }
    try {
        console.log(`🔍 Looking for super admin user: email=${email}, role=super_admin, status=active`);
        const client = await (0, database_1.getClient)();
        const result = await client.query('SELECT * FROM users WHERE email = $1 AND role = $2 AND status = $3', [email, 'super_admin', 'active']);
        console.log(`📊 Query result: ${result.rows.length} users found`);
        if (result.rows.length === 0) {
            console.log('❌ No super admin user found');
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        const user = result.rows[0];
        console.log(`👤 User found: ${user.email}, role: ${user.role}`);
        console.log(`🔐 Password hash: ${user.password_hash.substring(0, 20)}...`);
        const passwordValid = await bcrypt_1.default.compare(password, user.password_hash);
        console.log(`🔑 Password validation result: ${passwordValid}`);
        if (!passwordValid) {
            console.log('❌ Password validation failed');
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        // Create JWT token for super admin with 15 minutes session timeout
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes session timeout
        }, process.env.JWT_SECRET || 'fallback-secret');
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                }
            },
            message: 'Super admin login successful'
        });
    }
    catch (error) {
        console.error('Super admin login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
/**
 * Validate tenant exists: GET /:tenantSlug/validate
 * Public endpoint to check if a tenant exists (no authentication required)
 */
router.get('/:tenantSlug/validate', tenant_middleware_1.validateTenantSlug, (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            slug: req.tenant?.slug,
            name: req.tenant?.name,
            domain: req.tenant?.domain
        }
    });
});
/**
 * Tenant-scoped login: POST /:tenantSlug/login
 * Validates tenant slug and authenticates user within that tenant
 * Excludes 'superadmin' slug to avoid conflicts
 */
router.post('/:tenantSlug/login', (req, res, next) => {
    console.log('🔍 Checking tenantSlug:', req.params.tenantSlug);
    if (req.params.tenantSlug === 'superadmin') {
        console.log('❌ Blocking superadmin slug');
        return res.status(404).json({
            success: false,
            error: 'Use /superadmin/login for super admin authentication'
        });
    }
    console.log('✅ Allowing tenantSlug:', req.params.tenantSlug);
    next();
}, tenant_middleware_1.validateTenantSlug, async (req, res) => {
    console.log('🚀 LOGIN ROUTE REACHED!');
    console.log('Login request body:', JSON.stringify(req.body));
    console.log('Login request headers:', req.headers);
    const { email, password } = req.body;
    const tenant = req.tenant;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email and password are required'
        });
    }
    try {
        const client = await (0, database_1.getClient)();
        console.log(`Looking for user: email=${email}, tenant_id=${tenant.id}, status=active`);
        const result = await client.query('SELECT * FROM users WHERE email = $1 AND tenant_id = $2 AND status = $3', [email, tenant.id, 'active']);
        console.log(`Query result: ${result.rows.length} users found`);
        if (result.rows.length === 0) {
            console.log('No user found with these credentials');
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        const user = result.rows[0];
        console.log(`User found: ${user.email}, role: ${user.role}`);
        const passwordValid = await bcrypt_1.default.compare(password, user.password_hash);
        console.log(`Password validation result: ${passwordValid}`);
        if (!passwordValid) {
            console.log('Password validation failed');
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        console.log('Login successful, creating JWT token');
        // Create JWT token with 15 minutes session timeout
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            tenant_id: user.tenant_id,
            tenant_slug: tenant.slug,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes session timeout
        }, process.env.JWT_SECRET || 'fallback-secret');
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    tenantId: user.tenant_id,
                    tenantSlug: tenant.slug
                }
            },
            message: 'Login successful'
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
/**
 * Verify token endpoint
 */
router.post('/verify-token', async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({
            success: false,
            error: 'Token is required'
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        res.json({
            success: true,
            data: {
                valid: true,
                user: {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                    tenant_id: decoded.tenant_id,
                    tenant_slug: decoded.tenant_slug
                }
            }
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map