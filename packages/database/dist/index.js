"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.DatabaseClient = void 0;
exports.getClient = getClient;
exports.queryWithTenant = queryWithTenant;
exports.withTransaction = withTransaction;
exports.healthCheck = healthCheck;
exports.startPeriodicHealthCheck = startPeriodicHealthCheck;
exports.stopPeriodicHealthCheck = stopPeriodicHealthCheck;
exports.closePool = closePool;
exports.getPoolStats = getPoolStats;
const pg_1 = require("pg");
// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.error('💡 Please set DATABASE_URL in your .env file');
    console.error('Example: DATABASE_URL=postgresql://user:password@host:5432/database');
    process.exit(1);
}
// Database connection pool with optimized settings for Replit environment
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    allowExitOnIdle: false,
});
exports.pool = pool;
// Pool event handlers for resilience
pool.on('error', (err, client) => {
    console.error('⚠️ Unexpected database pool error:', err.message);
    console.error('⚠️ Error code:', err.code);
    // Don't crash on connection termination - pool will recover
    if (err.code === '57P01' || err.message.includes('terminating connection')) {
        console.warn('⚠️ Connection terminated by database server - pool will create new connections');
        return;
    }
    // Log other errors but don't crash
    console.error('⚠️ Pool error details:', err);
});
pool.on('connect', (client) => {
    console.log('✅ New database connection established in pool');
});
pool.on('acquire', (client) => {
    // Client acquired from pool - uncomment for debugging
    // console.log('📊 Database client acquired from pool');
});
pool.on('remove', (client) => {
    console.log('🔄 Database client removed from pool');
});
// Graceful pool cleanup
let isPoolClosing = false;
async function gracefulPoolShutdown() {
    if (isPoolClosing)
        return;
    isPoolClosing = true;
    console.log('🛑 Closing database connection pool...');
    try {
        await pool.end();
        console.log('✅ Database pool closed gracefully');
    }
    catch (error) {
        console.error('❌ Error closing database pool:', error);
    }
}
process.on('SIGTERM', gracefulPoolShutdown);
process.on('SIGINT', gracefulPoolShutdown);
// Database client with tenant context
class DatabaseClient {
    constructor(client) {
        this.tenantId = null;
        this.userRole = null;
        this.released = false;
        this.client = client;
    }
    // Set tenant context for RLS
    async setTenantContext(tenantId, userRole = 'user') {
        this.tenantId = tenantId;
        this.userRole = userRole;
        try {
            await this.client.query('SELECT set_tenant_context($1, $2)', [tenantId, userRole]);
        }
        catch (error) {
            // If tenant context function doesn't exist, just skip it
            if (error.code === '42883') {
                console.warn('⚠️ set_tenant_context function not found - skipping RLS setup');
            }
            else {
                throw error;
            }
        }
    }
    // Clear tenant context
    async clearTenantContext() {
        this.tenantId = null;
        this.userRole = null;
        try {
            await this.client.query('SELECT clear_tenant_context()');
        }
        catch (error) {
            // If function doesn't exist, just skip it
            if (error.code === '42883') {
                // Function doesn't exist - that's ok
            }
            else {
                console.warn('⚠️ Error clearing tenant context:', error.message);
            }
        }
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
        if (this.released) {
            throw new Error('Cannot query on released client');
        }
        return this.client.query(text, params);
    }
    // Release client
    async release() {
        if (this.released)
            return;
        try {
            await this.clearTenantContext();
        }
        catch (error) {
            console.warn('⚠️ Error clearing context before release:', error);
        }
        this.client.release();
        this.released = true;
    }
}
exports.DatabaseClient = DatabaseClient;
// Retry helper with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            // Don't retry on certain errors
            if (error.code === '42P01' || error.code === '42883') {
                throw error;
            }
            if (attempt < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, attempt);
                console.warn(`⚠️ Database operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}
// Get database client with tenant context and retry logic
async function getClient(tenantId, userRole) {
    const client = await retryWithBackoff(async () => {
        return await pool.connect();
    }, 3, 500);
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
// Health check with retry
async function healthCheck() {
    try {
        const result = await retryWithBackoff(async () => {
            return await pool.query('SELECT 1 as health');
        }, 2, 500);
        return result.rows.length > 0 && result.rows[0].health === 1;
    }
    catch (error) {
        console.error('❌ Database health check failed:', error);
        return false;
    }
}
// Periodic health check (runs every 30 seconds)
let healthCheckInterval = null;
function startPeriodicHealthCheck(intervalMs = 30000) {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
    }
    healthCheckInterval = setInterval(async () => {
        const isHealthy = await healthCheck();
        if (!isHealthy) {
            console.warn('⚠️ Periodic health check failed - database may be unavailable');
        }
    }, intervalMs);
    console.log(`🏥 Started periodic database health check (every ${intervalMs / 1000}s)`);
}
function stopPeriodicHealthCheck() {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
        console.log('🛑 Stopped periodic database health check');
    }
}
// Close all connections
async function closePool() {
    stopPeriodicHealthCheck();
    await gracefulPoolShutdown();
}
// Pool statistics
function getPoolStats() {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
    };
}
//# sourceMappingURL=index.js.map