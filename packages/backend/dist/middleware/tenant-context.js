"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantContextMiddleware = tenantContextMiddleware;
exports.generateSipDomain = generateSipDomain;
exports.validateSipDomain = validateSipDomain;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// PostgreSQL connection pool
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL
});
async function tenantContextMiddleware(req, res, next) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No valid authorization header' });
        }
        const token = authHeader.split(' ')[1];
        const JWT_SECRET = process.env.JWT_SECRET || 'edgvoip-secret-key-2024';
        // Verify and decode JWT
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (!payload.tenant_id) {
            return res.status(401).json({ error: 'No tenant_id in JWT payload' });
        }
        // Fetch tenant from database
        const result = await pool.query('SELECT id, name, sip_domain FROM tenants WHERE id = $1 AND status = $2', [payload.tenant_id, 'active']);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        const tenant = result.rows[0];
        // Extract store_id from request body or query params (optional)
        const store_id = req.body?.store_id || req.query?.store_id;
        // Add tenant context to request
        req.tenantContext = {
            tenant_id: payload.tenant_id,
            sip_domain: tenant.sip_domain,
            store_id: store_id
        };
        next();
    }
    catch (error) {
        console.error('Tenant context middleware error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
}
// Helper function to generate SIP domain from tenant name
function generateSipDomain(tenantName) {
    return `${tenantName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')}.edgvoip.it`;
}
// Helper function to validate SIP domain format
function validateSipDomain(sipDomain) {
    const regex = /^[a-z0-9-]+\.edgvoip\.it$/;
    return regex.test(sipDomain) && sipDomain.length <= 253;
}
//# sourceMappingURL=tenant-context.js.map