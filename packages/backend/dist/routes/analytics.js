"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("@w3-voip/database");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const router = express_1.default.Router();
// Apply authentication and super admin middleware to all routes
router.use(auth_1.authenticateToken);
router.use(auth_1.requireSuperAdmin);
// GET /api/analytics/cross-tenant/calls - CDR aggregato tutti tenant
router.get('/cross-tenant/calls', (0, response_1.asyncHandler)(async (req, res) => {
    const { start_date, end_date, tenant_id, limit = 100 } = req.query;
    const client = await (0, database_1.getClient)();
    try {
        let whereClause = '';
        let queryParams = [];
        let paramCount = 1;
        if (start_date) {
            whereClause += ` AND c.start_time >= $${paramCount++}`;
            queryParams.push(start_date);
        }
        if (end_date) {
            whereClause += ` AND c.start_time <= $${paramCount++}`;
            queryParams.push(end_date);
        }
        if (tenant_id) {
            whereClause += ` AND c.tenant_id = $${paramCount++}`;
            queryParams.push(tenant_id);
        }
        const result = await client.query(`
      SELECT 
        c.*,
        t.name as tenant_name,
        t.slug as tenant_slug,
        u.email as user_email
      FROM cdr c
      JOIN tenants t ON c.tenant_id = t.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE 1=1 ${whereClause}
      ORDER BY c.start_time DESC
      LIMIT $${paramCount}
    `, [...queryParams, parseInt(limit)]);
        (0, response_1.successResponse)(res, result.rows, 'Cross-tenant calls retrieved successfully');
    }
    finally {
        await client.release();
    }
}));
// GET /api/analytics/cross-tenant/extensions - Conteggi estensioni per tenant
router.get('/cross-tenant/extensions', (0, response_1.asyncHandler)(async (req, res) => {
    const client = await (0, database_1.getClient)();
    try {
        const result = await client.query(`
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.slug as tenant_slug,
        t.status as tenant_status,
        COUNT(e.id) as extensions_count,
        COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_extensions,
        COUNT(CASE WHEN e.status = 'inactive' THEN 1 END) as inactive_extensions
      FROM tenants t
      LEFT JOIN extensions e ON t.id = e.tenant_id
      GROUP BY t.id, t.name, t.slug, t.status
      ORDER BY extensions_count DESC
    `);
        (0, response_1.successResponse)(res, result.rows, 'Cross-tenant extensions statistics retrieved successfully');
    }
    finally {
        await client.release();
    }
}));
// GET /api/analytics/cross-tenant/live-calls - Live calls tutti tenant
router.get('/cross-tenant/live-calls', (0, response_1.asyncHandler)(async (req, res) => {
    const client = await (0, database_1.getClient)();
    try {
        const result = await client.query(`
      SELECT 
        ac.*,
        t.name as tenant_name,
        t.slug as tenant_slug,
        u.email as user_email
      FROM active_calls ac
      JOIN tenants t ON ac.tenant_id = t.id
      LEFT JOIN users u ON ac.user_id = u.id
      ORDER BY ac.start_time DESC
    `);
        (0, response_1.successResponse)(res, result.rows, 'Cross-tenant live calls retrieved successfully');
    }
    finally {
        await client.release();
    }
}));
// GET /api/analytics/cross-tenant/users - Statistiche utenti per tenant
router.get('/cross-tenant/users', (0, response_1.asyncHandler)(async (req, res) => {
    const client = await (0, database_1.getClient)();
    try {
        const result = await client.query(`
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.slug as tenant_slug,
        t.status as tenant_status,
        COUNT(u.id) as users_count,
        COUNT(CASE WHEN u.status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN u.role = 'tenant_admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN u.role = 'user' THEN 1 END) as regular_users,
        MAX(u.last_login) as last_login
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      GROUP BY t.id, t.name, t.slug, t.status
      ORDER BY users_count DESC
    `);
        (0, response_1.successResponse)(res, result.rows, 'Cross-tenant users statistics retrieved successfully');
    }
    finally {
        await client.release();
    }
}));
// GET /api/analytics/cross-tenant/companies - Statistiche companies per tenant
router.get('/cross-tenant/companies', (0, response_1.asyncHandler)(async (req, res) => {
    const client = await (0, database_1.getClient)();
    try {
        const result = await client.query(`
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.slug as tenant_slug,
        COUNT(c.id) as companies_count,
        COUNT(CASE WHEN c.is_primary = true THEN 1 END) as primary_companies,
        COUNT(cont.id) as contacts_count,
        COUNT(CASE WHEN cont.is_primary = true THEN 1 END) as primary_contacts
      FROM tenants t
      LEFT JOIN companies c ON t.id = c.tenant_id
      LEFT JOIN tenant_contacts cont ON t.id = cont.tenant_id
      GROUP BY t.id, t.name, t.slug
      ORDER BY companies_count DESC
    `);
        (0, response_1.successResponse)(res, result.rows, 'Cross-tenant companies statistics retrieved successfully');
    }
    finally {
        await client.release();
    }
}));
// GET /api/analytics/cross-tenant/summary - Summary completo cross-tenant
router.get('/cross-tenant/summary', (0, response_1.asyncHandler)(async (req, res) => {
    const { period = '24h' } = req.query;
    const client = await (0, database_1.getClient)();
    try {
        let timeFilter = '';
        switch (period) {
            case '1h':
                timeFilter = "AND c.start_time > NOW() - INTERVAL '1 hour'";
                break;
            case '24h':
                timeFilter = "AND c.start_time > NOW() - INTERVAL '24 hours'";
                break;
            case '7d':
                timeFilter = "AND c.start_time > NOW() - INTERVAL '7 days'";
                break;
            case '30d':
                timeFilter = "AND c.start_time > NOW() - INTERVAL '30 days'";
                break;
        }
        const result = await client.query(`
      SELECT 
        COUNT(DISTINCT t.id) as total_tenants,
        COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT e.id) as total_extensions,
        COUNT(DISTINCT c.id) as total_calls,
        COUNT(DISTINCT ac.id) as active_calls,
        COUNT(DISTINCT comp.id) as total_companies,
        COUNT(DISTINCT cont.id) as total_contacts,
        AVG(c.duration) as avg_call_duration,
        SUM(c.duration) as total_call_duration
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN extensions e ON t.id = e.tenant_id
      LEFT JOIN cdr c ON t.id = c.tenant_id ${timeFilter}
      LEFT JOIN active_calls ac ON t.id = ac.tenant_id
      LEFT JOIN companies comp ON t.id = comp.tenant_id
      LEFT JOIN tenant_contacts cont ON t.id = cont.tenant_id
    `);
        (0, response_1.successResponse)(res, result.rows[0], 'Cross-tenant summary retrieved successfully');
    }
    finally {
        await client.release();
    }
}));
exports.default = router;
//# sourceMappingURL=analytics.js.map