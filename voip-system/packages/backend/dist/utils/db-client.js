"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientWithRLS = getClientWithRLS;
exports.queryWithRLS = queryWithRLS;
const database_1 = require("@w3-voip/database");
/**
 * Get a database client with RLS context automatically set
 * This should be used instead of getClient() directly in services
 */
async function getClientWithRLS(tenantId, userRole) {
    const client = await (0, database_1.getClient)();
    try {
        // Set RLS context if tenant ID is provided
        // NOTA: SET LOCAL non supporta parametri, ma tenantId è già validato dal chiamante
        if (tenantId) {
            await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
            await client.query(`SET LOCAL app.user_role = '${userRole || 'user'}'`);
        }
        return client;
    }
    catch (error) {
        // If setting RLS fails, release the client and rethrow
        await client.release();
        throw error;
    }
}
/**
 * Execute a query with RLS context
 */
async function queryWithRLS(query, params, tenantId, userRole) {
    const client = await getClientWithRLS(tenantId, userRole);
    try {
        const result = await client.query(query, params);
        return result.rows;
    }
    finally {
        await client.release();
    }
}
//# sourceMappingURL=db-client.js.map