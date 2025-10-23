"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
// @ts-nocheck
const database_1 = require("@w3-voip/database");
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class TenantService {
    // Create a new tenant
    async createTenant(tenantData) {
        return (0, database_1.withTransaction)(async (client) => {
            // Check if domain already exists
            const existingTenant = await client.query('SELECT id FROM tenants WHERE domain = $1 OR sip_domain = $2', [tenantData.domain, tenantData.sip_domain]);
            if (existingTenant.rows.length > 0) {
                throw new Error('Domain or SIP domain already exists');
            }
            // Create tenant
            const result = await client.query(`INSERT INTO tenants (id, name, domain, sip_domain, status, settings)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`, [
                (0, uuid_1.v4)(),
                tenantData.name,
                tenantData.domain,
                tenantData.sip_domain,
                tenantData.status || 'pending',
                JSON.stringify(tenantData.settings)
            ]);
            const tenant = result.rows[0];
            return {
                ...tenant,
                settings: JSON.parse(tenant.settings)
            };
        });
    }
    // Get tenant by ID
    async getTenantById(tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
            if (result.rows.length === 0) {
                return null;
            }
            const tenant = result.rows[0];
            return {
                ...tenant,
                settings: JSON.parse(tenant.settings)
            };
        }
        finally {
            await client.release();
        }
    }
    // Get tenant by domain
    async getTenantByDomain(domain) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM tenants WHERE domain = $1 OR sip_domain = $1', [domain]);
            if (result.rows.length === 0) {
                return null;
            }
            const tenant = result.rows[0];
            return {
                ...tenant,
                settings: JSON.parse(tenant.settings)
            };
        }
        finally {
            await client.release();
        }
    }
    // Update tenant
    async updateTenant(tenantId, updates) {
        return (0, database_1.withTransaction)(async (client) => {
            // Check if domain conflicts with other tenants
            if (updates.domain || updates.sip_domain) {
                const existingTenant = await client.query('SELECT id FROM tenants WHERE (domain = $1 OR sip_domain = $2) AND id != $3', [updates.domain, updates.sip_domain, tenantId]);
                if (existingTenant.rows.length > 0) {
                    throw new Error('Domain or SIP domain already exists');
                }
            }
            // Build update query
            const updateFields = [];
            const values = [];
            let paramCount = 1;
            if (updates.name !== undefined) {
                updateFields.push(`name = $${paramCount++}`);
                values.push(updates.name);
            }
            if (updates.domain !== undefined) {
                updateFields.push(`domain = $${paramCount++}`);
                values.push(updates.domain);
            }
            if (updates.sip_domain !== undefined) {
                updateFields.push(`sip_domain = $${paramCount++}`);
                values.push(updates.sip_domain);
            }
            if (updates.status !== undefined) {
                updateFields.push(`status = $${paramCount++}`);
                values.push(updates.status);
            }
            if (updates.settings !== undefined) {
                updateFields.push(`settings = $${paramCount++}`);
                values.push(JSON.stringify(updates.settings));
            }
            if (updateFields.length === 0) {
                throw new Error('No fields to update');
            }
            values.push(tenantId);
            const result = await client.query(`UPDATE tenants SET ${updateFields.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount}
         RETURNING *`, values);
            if (result.rows.length === 0) {
                throw new Error('Tenant not found');
            }
            const tenant = result.rows[0];
            return {
                ...tenant,
                settings: JSON.parse(tenant.settings)
            };
        });
    }
    // Delete tenant (soft delete by setting status to suspended)
    async deleteTenant(tenantId) {
        return (0, database_1.withTransaction)(async (client) => {
            const result = await client.query('UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2', ['suspended', tenantId]);
            if (result.rowCount === 0) {
                throw new Error('Tenant not found');
            }
        });
    }
    // List tenants with pagination
    async listTenants(page = 1, limit = 50, search) {
        const client = await (0, database_1.getClient)();
        try {
            const offset = (page - 1) * limit;
            let whereClause = '';
            let queryParams = [];
            if (search) {
                whereClause = 'WHERE name ILIKE $1 OR domain ILIKE $1 OR sip_domain ILIKE $1';
                queryParams.push(`%${search}%`);
            }
            // Get total count
            const countResult = await client.query(`SELECT COUNT(*) FROM tenants ${whereClause}`, queryParams);
            const total = parseInt(countResult.rows[0].count);
            // Get tenants
            const result = await client.query(`SELECT * FROM tenants ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
            const tenants = result.rows.map(row => ({
                ...row,
                settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
            }));
            return {
                tenants,
                total,
                totalPages: Math.ceil(total / limit)
            };
        }
        finally {
            await client.release();
        }
    }
    // Get tenant statistics
    async getTenantStats(tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`SELECT 
           COUNT(DISTINCT s.id) as store_count,
           COUNT(DISTINCT e.id) as extension_count,
           COUNT(DISTINCT st.id) as trunk_count,
           COUNT(DISTINCT c.id) as total_calls,
           COUNT(DISTINCT ac.id) as active_calls,
           MAX(c.start_time) as last_call_time
         FROM tenants t
         LEFT JOIN stores s ON t.id = s.tenant_id
         LEFT JOIN extensions e ON t.id = e.tenant_id
         LEFT JOIN sip_trunks st ON t.id = st.tenant_id
         LEFT JOIN cdr c ON t.id = c.tenant_id
         LEFT JOIN active_calls ac ON t.id = ac.tenant_id
         WHERE t.id = $1
         GROUP BY t.id`, [tenantId]);
            if (result.rows.length === 0) {
                throw new Error('Tenant not found');
            }
            return result.rows[0];
        }
        finally {
            await client.release();
        }
    }
    // Activate tenant
    async activateTenant(tenantId) {
        return this.updateTenant(tenantId, { status: 'active' });
    }
    // Suspend tenant
    async suspendTenant(tenantId) {
        return this.updateTenant(tenantId, { status: 'suspended' });
    }
    // Validate tenant domain uniqueness
    async validateDomainUniqueness(domain, sipDomain, excludeTenantId) {
        const client = await (0, database_1.getClient)();
        try {
            let query = 'SELECT id FROM tenants WHERE domain = $1 OR sip_domain = $2';
            let params = [domain, sipDomain];
            if (excludeTenantId) {
                query += ' AND id != $3';
                params.push(excludeTenantId);
            }
            const result = await client.query(query, params);
            return result.rows.length === 0;
        }
        finally {
            await client.release();
        }
    }
    // Create tenant with companies, contacts and admin user
    async createTenantWithCompanies(data) {
        return (0, database_1.withTransaction)(async (client) => {
            // Validate domain uniqueness
            const isUnique = await this.validateDomainUniqueness(data.domain, data.sip_domain);
            if (!isUnique) {
                throw new Error('Domain or SIP domain already exists');
            }
            // Validate admin user email uniqueness
            const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [data.admin_user.email]);
            if (existingUser.rows.length > 0) {
                throw new Error('Admin user email already exists');
            }
            // Validate at least one primary company and contact
            const hasPrimaryCompany = data.companies.some(c => c.is_primary);
            const hasPrimaryContact = data.contacts.some(c => c.is_primary);
            if (!hasPrimaryCompany) {
                throw new Error('At least one company must be marked as primary');
            }
            if (!hasPrimaryContact) {
                throw new Error('At least one contact must be marked as primary');
            }
            const tenantId = (0, uuid_1.v4)();
            // Create tenant
            const tenantResult = await client.query(`INSERT INTO tenants (id, name, slug, domain, sip_domain, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`, [tenantId, data.name, data.slug, data.domain, data.sip_domain, 'active']);
            // Create admin user
            const hashedPassword = await bcrypt_1.default.hash(data.admin_user.password, 10);
            const adminUserId = (0, uuid_1.v4)();
            await client.query(`INSERT INTO users (id, tenant_id, first_name, last_name, email, password_hash, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`, [
                adminUserId, tenantId, data.admin_user.first_name, data.admin_user.last_name,
                data.admin_user.email, hashedPassword, data.admin_user.role, 'active'
            ]);
            // Create companies
            for (const companyData of data.companies) {
                await client.query(`INSERT INTO companies (id, tenant_id, legal_name, vat_number, tax_code, address, city, state, postal_code, country, is_primary, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`, [
                    (0, uuid_1.v4)(), tenantId, companyData.legal_name, companyData.vat_number, companyData.tax_code,
                    companyData.address, companyData.city, companyData.state, companyData.postal_code,
                    companyData.country || 'Italy', companyData.is_primary
                ]);
            }
            // Create contacts
            for (const contactData of data.contacts) {
                await client.query(`INSERT INTO tenant_contacts (id, tenant_id, first_name, last_name, role, email, phone, mobile, is_primary, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`, [
                    (0, uuid_1.v4)(), tenantId, contactData.first_name, contactData.last_name, contactData.role,
                    contactData.email, contactData.phone, contactData.mobile, contactData.is_primary
                ]);
            }
            return tenantResult.rows[0];
        });
    }
    // Get cross-tenant statistics
    async getCrossTenantStats() {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`
        SELECT 
          COUNT(DISTINCT t.id) as total_tenants,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT e.id) as total_extensions,
          COUNT(DISTINCT CASE WHEN c.start_time > NOW() - INTERVAL '24 hours' THEN c.id END) as total_calls_24h,
          COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,
          COUNT(DISTINCT CASE WHEN t.status = 'suspended' THEN t.id END) as inactive_tenants
        FROM tenants t
        LEFT JOIN users u ON t.id = u.tenant_id
        LEFT JOIN extensions e ON t.id = e.tenant_id
        LEFT JOIN cdr c ON t.id = c.tenant_id
      `);
            return result.rows[0];
        }
        finally {
            await client.release();
        }
    }
    // Get tenant statistics for cross-tenant view
    async getTenantStatsList() {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`
        SELECT 
          t.id as tenant_id,
          t.name as tenant_name,
          t.slug as tenant_slug,
          t.status,
          COUNT(DISTINCT u.id) as users_count,
          COUNT(DISTINCT e.id) as extensions_count,
          COUNT(DISTINCT CASE WHEN c.start_time > NOW() - INTERVAL '24 hours' THEN c.id END) as calls_24h,
          COUNT(DISTINCT comp.id) as companies_count,
          COUNT(DISTINCT cont.id) as contacts_count
        FROM tenants t
        LEFT JOIN users u ON t.id = u.tenant_id
        LEFT JOIN extensions e ON t.id = e.tenant_id
        LEFT JOIN cdr c ON t.id = c.tenant_id
        LEFT JOIN companies comp ON t.id = comp.tenant_id
        LEFT JOIN tenant_contacts cont ON t.id = cont.tenant_id
        GROUP BY t.id, t.name, t.slug, t.status
        ORDER BY t.created_at DESC
      `);
            return result.rows;
        }
        finally {
            await client.release();
        }
    }
    // Impersonate user (generate JWT for target user)
    async impersonateUser(superAdminId, targetUserId) {
        const client = await (0, database_1.getClient)();
        try {
            // Verify super admin
            const superAdminResult = await client.query('SELECT role FROM users WHERE id = $1', [superAdminId]);
            if (superAdminResult.rows.length === 0 || superAdminResult.rows[0].role !== 'super_admin') {
                throw new Error('Super admin access required');
            }
            // Get target user with tenant info
            const targetUserResult = await client.query(`
        SELECT u.*, t.slug as tenant_slug
        FROM users u
        JOIN tenants t ON u.tenant_id = t.id
        WHERE u.id = $1
      `, [targetUserId]);
            if (targetUserResult.rows.length === 0) {
                throw new Error('Target user not found');
            }
            const targetUser = targetUserResult.rows[0];
            // Generate impersonation token
            const token = jsonwebtoken_1.default.sign({
                id: targetUser.id,
                email: targetUser.email,
                tenant_id: targetUser.tenant_id,
                tenant_slug: targetUser.tenant_slug,
                role: targetUser.role,
                impersonated_by: superAdminId,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 hours for impersonation
            }, process.env.JWT_SECRET || 'fallback-secret');
            return token;
        }
        finally {
            await client.release();
        }
    }
    // Get tenant with companies and contacts
    async getTenantWithDetails(tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            // Get tenant
            const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
            if (tenantResult.rows.length === 0) {
                throw new Error('Tenant not found');
            }
            // Get companies
            const companiesResult = await client.query('SELECT * FROM companies WHERE tenant_id = $1 ORDER BY is_primary DESC, created_at ASC', [tenantId]);
            // Get contacts
            const contactsResult = await client.query('SELECT * FROM tenant_contacts WHERE tenant_id = $1 ORDER BY is_primary DESC, created_at ASC', [tenantId]);
            return {
                tenant: tenantResult.rows[0],
                companies: companiesResult.rows,
                contacts: contactsResult.rows
            };
        }
        finally {
            await client.release();
        }
    }
}
exports.TenantService = TenantService;
//# sourceMappingURL=tenant.service.js.map