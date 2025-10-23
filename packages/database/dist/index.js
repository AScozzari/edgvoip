"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.DatabaseClient = void 0;
exports.getClient = getClient;
exports.queryWithTenant = queryWithTenant;
exports.withTransaction = withTransaction;
exports.healthCheck = healthCheck;
exports.closePool = closePool;
const pg_1 = require("pg");
// Database connection pool
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/w3_voip',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
exports.pool = pool;
// Database client with tenant context
class DatabaseClient {
    constructor(client) {
        this.tenantId = null;
        this.userRole = null;
        this.client = client;
    }
    // Set tenant context for RLS
    async setTenantContext(tenantId, userRole = 'user') {
        this.tenantId = tenantId;
        this.userRole = userRole;
        await this.client.query('SELECT set_tenant_context($1, $2)', [tenantId, userRole]);
    }
    // Clear tenant context
    async clearTenantContext() {
        this.tenantId = null;
        this.userRole = null;
        await this.client.query('SELECT clear_tenant_context()');
    }
    // Get current tenant ID
    getCurrentTenantId() {
        return this.tenantId;
    }
    // Get current user role
    getCurrentUserRole() {
        return this.userRole;
    }
    // Query with tenant context
    async query(text, params) {
        return this.client.query(text, params);
    }
    // Release client
    async release() {
        await this.clearTenantContext();
        this.client.release();
    }
}
exports.DatabaseClient = DatabaseClient;
// Get database client with tenant context
async function getClient(tenantId, userRole) {
    const client = await pool.connect();
    const dbClient = new DatabaseClient(client);
    if (tenantId) {
        await dbClient.setTenantContext(tenantId, userRole || 'user');
    }
    return dbClient;
}
// Execute query with tenant context
async function queryWithTenant(text, params = [], tenantId, userRole) {
    const client = await getClient(tenantId, userRole);
    try {
        const result = await client.query(text, params);
        return result;
    }
    finally {
        await client.release();
    }
}
// Transaction helper
async function withTransaction(callback, tenantId, userRole) {
    const client = await getClient(tenantId, userRole);
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        await client.release();
    }
}
// Health check
async function healthCheck() {
    try {
        const result = await pool.query('SELECT 1');
        return result.rows.length > 0;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}
// Close all connections
async function closePool() {
    await pool.end();
}
//# sourceMappingURL=index.js.map