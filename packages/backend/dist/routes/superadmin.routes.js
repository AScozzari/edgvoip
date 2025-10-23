"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("@w3-voip/database");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
/**
 * Get all tenants (super admin only)
 * GET /superadmin/tenants
 */
router.get('/tenants', auth_middleware_1.authenticateJWT, auth_middleware_1.requireSuperAdmin, async (req, res) => {
    try {
        const client = await (0, database_1.getClient)();
        const result = await client.query(`
      SELECT 
        t.*,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT e.id) as extension_count,
        COUNT(DISTINCT s.id) as store_count
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN extensions e ON t.id = e.tenant_id
      LEFT JOIN stores s ON t.id = s.tenant_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
/**
 * Create new tenant (super admin only)
 * POST /superadmin/tenants
 */
router.post('/tenants', auth_middleware_1.authenticateJWT, auth_middleware_1.requireSuperAdmin, async (req, res) => {
    const { name, domain, sip_domain, companies, adminUser } = req.body;
    if (!name || !domain || !sip_domain || !companies || !adminUser) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: name, domain, sip_domain, companies, adminUser'
        });
    }
    try {
        const client = await (0, database_1.getClient)();
        // Start transaction
        await client.query('BEGIN');
        // Create tenant
        const tenantResult = await client.query(`
      INSERT INTO tenants (name, domain, sip_domain, companies, status, slug)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, domain, sip_domain, JSON.stringify(companies), 'active', domain.replace(/[^a-zA-Z0-9-]/g, '-')]);
        const tenant = tenantResult.rows[0];
        // Create admin user for the tenant
        const hashedPassword = await bcrypt_1.default.hash(adminUser.password, 10);
        const userResult = await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [tenant.id, adminUser.email, hashedPassword, adminUser.firstName, adminUser.lastName, 'admin', 'active']);
        const user = userResult.rows[0];
        // Commit transaction
        await client.query('COMMIT');
        res.json({
            success: true,
            data: {
                tenant,
                adminUser: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                }
            },
            message: 'Tenant created successfully'
        });
    }
    catch (error) {
        console.error('Error creating tenant:', error);
        await client.query('ROLLBACK');
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
/**
 * Update tenant (super admin only)
 * PUT /superadmin/tenants/:id
 */
router.put('/tenants/:id', auth_middleware_1.authenticateJWT, auth_middleware_1.requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, domain, sip_domain, companies, status } = req.body;
    try {
        const client = await (0, database_1.getClient)();
        const result = await client.query(`
      UPDATE tenants 
      SET name = $1, domain = $2, sip_domain = $3, companies = $4, status = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [name, domain, sip_domain, JSON.stringify(companies), status, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tenant not found'
            });
        }
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Tenant updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating tenant:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
/**
 * Delete tenant (super admin only)
 * DELETE /superadmin/tenants/:id
 */
router.delete('/tenants/:id', auth_middleware_1.authenticateJWT, auth_middleware_1.requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const client = await (0, database_1.getClient)();
        // Start transaction
        await client.query('BEGIN');
        // Delete related data
        await client.query('DELETE FROM users WHERE tenant_id = $1', [id]);
        await client.query('DELETE FROM extensions WHERE tenant_id = $1', [id]);
        await client.query('DELETE FROM stores WHERE tenant_id = $1', [id]);
        // Delete tenant
        const result = await client.query('DELETE FROM tenants WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Tenant not found'
            });
        }
        // Commit transaction
        await client.query('COMMIT');
        res.json({
            success: true,
            message: 'Tenant deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting tenant:', error);
        await client.query('ROLLBACK');
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
/**
 * Get tenant users (super admin only)
 * GET /superadmin/tenants/:id/users
 */
router.get('/tenants/:id/users', auth_middleware_1.authenticateJWT, auth_middleware_1.requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const client = await (0, database_1.getClient)();
        const result = await client.query(`
      SELECT id, email, first_name, last_name, role, status, created_at, updated_at
      FROM users 
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `, [id]);
        res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Error fetching tenant users:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
/**
 * Create user for tenant (super admin only)
 * POST /superadmin/tenants/:id/users
 */
router.post('/tenants/:id/users', auth_middleware_1.authenticateJWT, auth_middleware_1.requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: email, password, firstName, lastName, role'
        });
    }
    try {
        const client = await (0, database_1.getClient)();
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const result = await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, role, status, created_at
    `, [id, email, hashedPassword, firstName, lastName, role, 'active']);
        res.json({
            success: true,
            data: result.rows[0],
            message: 'User created successfully'
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=superadmin.routes.js.map