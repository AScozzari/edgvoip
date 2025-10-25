"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("@w3-voip/database");
const middleware_1 = require("../middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
router.use(middleware_1.authenticateToken);
router.use(middleware_1.requireTenant);
router.use(middleware_1.setTenantContext);
router.use(auth_middleware_1.requireTenantAdmin);
router.get('/', (0, response_1.asyncHandler)(async (req, res) => {
    const tenantId = req.tenantId;
    const client = await (0, database_1.getClient)();
    const result = await client.query(`
      SELECT id, email, first_name, last_name, role, status, created_at, updated_at, last_login_at
      FROM users 
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `, [tenantId]);
    (0, response_1.successResponse)(res, {
        users: result.rows,
        total: result.rows.length
    }, 'Users retrieved successfully');
}));
router.post('/', (0, response_1.asyncHandler)(async (req, res) => {
    const { email, password, first_name, last_name, role } = req.body;
    const tenantId = req.tenantId;
    if (!email || !password || !first_name || !last_name || !role) {
        return (0, response_1.errorResponse)(res, 'Missing required fields', 400);
    }
    if (!['tenant_admin', 'agent', 'user'].includes(role)) {
        return (0, response_1.errorResponse)(res, 'Invalid role. Must be: tenant_admin, agent, or user', 400);
    }
    const client = await (0, database_1.getClient)();
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
    if (existingUser.rows.length > 0) {
        return (0, response_1.errorResponse)(res, 'User with this email already exists', 409);
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const result = await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, role, status, created_at
    `, [tenantId, email, hashedPassword, first_name, last_name, role, 'active']);
    (0, response_1.createdResponse)(res, result.rows[0], 'User created successfully');
}));
router.patch('/:id', (0, response_1.asyncHandler)(async (req, res) => {
    const userId = req.params.id;
    const tenantId = req.tenantId;
    const { first_name, last_name, role, status } = req.body;
    const client = await (0, database_1.getClient)();
    const userCheck = await client.query('SELECT id FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
    if (userCheck.rows.length === 0) {
        return (0, response_1.notFoundResponse)(res, 'User not found');
    }
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (first_name) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(first_name);
    }
    if (last_name) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(last_name);
    }
    if (role && ['tenant_admin', 'agent', 'user'].includes(role)) {
        updates.push(`role = $${paramIndex++}`);
        values.push(role);
    }
    if (status && ['active', 'inactive', 'suspended'].includes(status)) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
    }
    if (updates.length === 0) {
        return (0, response_1.errorResponse)(res, 'No valid fields to update', 400);
    }
    updates.push(`updated_at = NOW()`);
    values.push(userId, tenantId);
    const result = await client.query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
      RETURNING id, email, first_name, last_name, role, status, updated_at
    `, values);
    (0, response_1.updatedResponse)(res, result.rows[0], 'User updated successfully');
}));
router.delete('/:id', (0, response_1.asyncHandler)(async (req, res) => {
    const userId = req.params.id;
    const tenantId = req.tenantId;
    const client = await (0, database_1.getClient)();
    const userCheck = await client.query('SELECT id, email FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
    if (userCheck.rows.length === 0) {
        return (0, response_1.notFoundResponse)(res, 'User not found');
    }
    await client.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
    (0, response_1.deletedResponse)(res, 'User deleted successfully');
}));
exports.default = router;
//# sourceMappingURL=users.routes.js.map