"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionService = void 0;
// @ts-nocheck
const database_1 = require("@w3-voip/database");
// import { Extension, ExtensionSchema } from '@w3-voip/shared';
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Helper function to safely parse JSON settings
function parseSettings(settings) {
    if (typeof settings === 'string') {
        try {
            return JSON.parse(settings);
        }
        catch (e) {
            console.error('Failed to parse settings:', e);
            return {};
        }
    }
    return settings || {};
}
class ExtensionService {
    // Create a new extension
    async createExtension(extensionData) {
        return (0, database_1.withTransaction)(async (client) => {
            // Verify tenant exists
            const tenantResult = await client.query('SELECT id FROM tenants WHERE id = $1 AND status = $2', [extensionData.tenant_id, 'active']);
            if (tenantResult.rows.length === 0) {
                throw new Error('Tenant not found or inactive');
            }
            // Verify store exists if provided
            if (extensionData.store_id) {
                const storeResult = await client.query('SELECT id FROM stores WHERE id = $1 AND tenant_id = $2 AND status = $3', [extensionData.store_id, extensionData.tenant_id, 'active']);
                if (storeResult.rows.length === 0) {
                    throw new Error('Store not found or inactive');
                }
            }
            // Check if extension already exists for this tenant
            const existingExtension = await client.query('SELECT id FROM extensions WHERE tenant_id = $1 AND extension = $2', [extensionData.tenant_id, extensionData.extension]);
            if (existingExtension.rows.length > 0) {
                throw new Error('Extension already exists for this tenant');
            }
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(extensionData.password, 12);
            // Create extension
            const result = await client.query(`INSERT INTO extensions (id, tenant_id, store_id, extension, password, display_name, status, type, settings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`, [
                (0, uuid_1.v4)(),
                extensionData.tenant_id,
                extensionData.store_id || null,
                extensionData.extension,
                hashedPassword,
                extensionData.display_name,
                extensionData.status || 'active',
                extensionData.type || 'user',
                JSON.stringify(extensionData.settings)
            ]);
            const extension = result.rows[0];
            return {
                ...extension,
                password: extensionData.password, // Return original password for response
                settings: parseSettings(extension.settings)
            };
        });
    }
    // Get extension by ID
    async getExtensionById(extensionId, tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            let query = 'SELECT * FROM extensions WHERE id = $1';
            let params = [extensionId];
            if (tenantId) {
                query += ' AND tenant_id = $2';
                params.push(tenantId);
            }
            const result = await client.query(query, params);
            if (result.rows.length === 0) {
                return null;
            }
            const extension = result.rows[0];
            return {
                ...extension,
                settings: parseSettings(extension.settings)
            };
        }
        finally {
            await client.release();
        }
    }
    // Get extension by extension number and tenant
    async getExtensionByNumber(extension, tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM extensions WHERE extension = $1 AND tenant_id = $2', [extension, tenantId]);
            if (result.rows.length === 0) {
                return null;
            }
            const ext = result.rows[0];
            return {
                ...ext,
                settings: parseSettings(ext.settings)
            };
        }
        finally {
            await client.release();
        }
    }
    // Update extension
    async updateExtension(extensionId, updates, tenantId) {
        return (0, database_1.withTransaction)(async (client) => {
            // Check if extension conflicts with other extensions in the same tenant
            if (updates.extension) {
                const existingExtension = await client.query('SELECT id FROM extensions WHERE tenant_id = $1 AND extension = $2 AND id != $3', [tenantId, updates.extension, extensionId]);
                if (existingExtension.rows.length > 0) {
                    throw new Error('Extension already exists for this tenant');
                }
            }
            // Build update query
            const updateFields = [];
            const values = [];
            let paramCount = 1;
            if (updates.extension !== undefined) {
                updateFields.push(`extension = $${paramCount++}`);
                values.push(updates.extension);
            }
            if (updates.password !== undefined) {
                const hashedPassword = await bcryptjs_1.default.hash(updates.password, 12);
                updateFields.push(`password = $${paramCount++}`);
                values.push(hashedPassword);
            }
            if (updates.display_name !== undefined) {
                updateFields.push(`display_name = $${paramCount++}`);
                values.push(updates.display_name);
            }
            if (updates.status !== undefined) {
                updateFields.push(`status = $${paramCount++}`);
                values.push(updates.status);
            }
            if (updates.type !== undefined) {
                updateFields.push(`type = $${paramCount++}`);
                values.push(updates.type);
            }
            if (updates.store_id !== undefined) {
                updateFields.push(`store_id = $${paramCount++}`);
                values.push(updates.store_id || null);
            }
            if (updates.settings !== undefined) {
                updateFields.push(`settings = $${paramCount++}`);
                values.push(JSON.stringify(updates.settings));
            }
            if (updateFields.length === 0) {
                throw new Error('No fields to update');
            }
            values.push(extensionId);
            let query = `UPDATE extensions SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`;
            if (tenantId) {
                query += ` AND tenant_id = $${paramCount + 1}`;
                values.push(tenantId);
            }
            query += ' RETURNING *';
            const result = await client.query(query, values);
            if (result.rows.length === 0) {
                throw new Error('Extension not found');
            }
            const extension = result.rows[0];
            return {
                ...extension,
                password: updates.password || '[HIDDEN]', // Return updated password or hidden
                settings: parseSettings(extension.settings)
            };
        });
    }
    // Delete extension
    async deleteExtension(extensionId, tenantId) {
        return (0, database_1.withTransaction)(async (client) => {
            let query = 'DELETE FROM extensions WHERE id = $1';
            let params = [extensionId];
            if (tenantId) {
                query += ' AND tenant_id = $2';
                params.push(tenantId);
            }
            const result = await client.query(query, params);
            if (result.rowCount === 0) {
                throw new Error('Extension not found');
            }
        });
    }
    // List extensions for a tenant
    async listExtensions(tenantId, storeId, page = 1, limit = 50, search) {
        const client = await (0, database_1.getClient)();
        try {
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE tenant_id = $1';
            let queryParams = [tenantId];
            if (storeId) {
                whereClause += ' AND store_id = $2';
                queryParams.push(storeId);
            }
            if (search) {
                const searchParam = storeId ? 3 : 2;
                whereClause += ` AND (extension ILIKE $${searchParam} OR display_name ILIKE $${searchParam})`;
                queryParams.push(`%${search}%`);
            }
            // Get total count
            const countResult = await client.query(`SELECT COUNT(*) FROM extensions ${whereClause}`, queryParams);
            const total = parseInt(countResult.rows[0].count);
            // Get extensions
            const result = await client.query(`SELECT * FROM extensions ${whereClause}
         ORDER BY extension ASC
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [...queryParams, limit, offset]);
            const extensions = result.rows.map(row => ({
                ...row,
                password: '[HIDDEN]', // Hide passwords in list
                settings: parseSettings(row.settings)
            }));
            return {
                extensions,
                total,
                totalPages: Math.ceil(total / limit)
            };
        }
        finally {
            await client.release();
        }
    }
    // Verify extension password
    async verifyExtensionPassword(extension, password, tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM extensions WHERE extension = $1 AND tenant_id = $2 AND status = $3', [extension, tenantId, 'active']);
            if (result.rows.length === 0) {
                return null;
            }
            const ext = result.rows[0];
            const isValidPassword = await bcryptjs_1.default.compare(password, ext.password);
            if (!isValidPassword) {
                return null;
            }
            return {
                ...ext,
                password: '[HIDDEN]',
                settings: parseSettings(ext.settings)
            };
        }
        finally {
            await client.release();
        }
    }
    // Activate extension
    async activateExtension(extensionId, tenantId) {
        return this.updateExtension(extensionId, { status: 'active' }, tenantId);
    }
    // Deactivate extension
    async deactivateExtension(extensionId, tenantId) {
        return this.updateExtension(extensionId, { status: 'inactive' }, tenantId);
    }
    // Lock extension
    async lockExtension(extensionId, tenantId) {
        return this.updateExtension(extensionId, { status: 'inactive' }, tenantId);
    }
    // Validate extension number uniqueness within tenant
    async validateExtensionUniqueness(extension, tenantId, excludeExtensionId) {
        const client = await (0, database_1.getClient)();
        try {
            let query = 'SELECT id FROM extensions WHERE tenant_id = $1 AND extension = $2';
            let params = [tenantId, extension];
            if (excludeExtensionId) {
                query += ' AND id != $3';
                params.push(excludeExtensionId);
            }
            const result = await client.query(query, params);
            return result.rows.length === 0;
        }
        finally {
            await client.release();
        }
    }
    // Get extension registration status from FreeSWITCH
    async getExtensionStatus(extensionId, tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            // Set RLS context if tenant ID provided
            // NOTA: SET LOCAL non supporta parametri, ma tenantId è già validato dal JWT
            if (tenantId) {
                await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
                await client.query("SET LOCAL app.user_role = 'user'");
            }
            // Get extension details
            let whereClause = 'WHERE e.id = $1';
            let params = [extensionId];
            if (tenantId) {
                whereClause += ' AND e.tenant_id = $2';
                params.push(tenantId);
            }
            const result = await client.query(`SELECT e.extension, e.display_name, t.sip_domain 
         FROM extensions e 
         JOIN tenants t ON e.tenant_id = t.id 
         ${whereClause}`, params);
            if (result.rows.length === 0) {
                throw new Error('Extension not found');
            }
            const ext = result.rows[0];
            // Query FreeSWITCH for registration status via ESL
            try {
                const { FreeSWITCHService } = await Promise.resolve().then(() => __importStar(require('./freeswitch.service')));
                const fsService = new FreeSWITCHService();
                // Get registrations from FreeSWITCH
                const registrations = await fsService.getRegistrations();
                // Find this extension's registration
                const registration = registrations.find((reg) => reg.user === ext.extension && reg.realm === ext.sip_domain);
                if (registration) {
                    return {
                        extension: ext.extension,
                        registered: true,
                        ip: registration.network_ip,
                        port: registration.network_port,
                        user_agent: registration.agent,
                        expires: registration.expires
                    };
                }
            }
            catch (fsError) {
                console.error('FreeSWITCH query error:', fsError);
            }
            // Not registered
            return {
                extension: ext.extension,
                registered: false
            };
        }
        finally {
            await client.release();
        }
    }
    // Get extension statistics
    async getExtensionStats(extensionId, tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            let whereClause = 'WHERE e.id = $1';
            let params = [extensionId];
            if (tenantId) {
                whereClause += ' AND e.tenant_id = $2';
                params.push(tenantId);
            }
            const result = await client.query(`SELECT 
           COUNT(DISTINCT c.id) as total_calls,
           COUNT(DISTINCT CASE WHEN c.hangup_disposition = 'answered' THEN c.id END) as answered_calls,
           COUNT(DISTINCT CASE WHEN c.hangup_disposition IN ('no_answer', 'busy') THEN c.id END) as missed_calls,
           COALESCE(SUM(c.duration), 0) as total_duration,
           MAX(c.start_time) as last_call_time
         FROM extensions e
         LEFT JOIN cdr c ON e.id = c.extension_id
         ${whereClause}
         GROUP BY e.id`, params);
            if (result.rows.length === 0) {
                throw new Error('Extension not found');
            }
            return result.rows[0];
        }
        finally {
            await client.release();
        }
    }
}
exports.ExtensionService = ExtensionService;
//# sourceMappingURL=extension.service.js.map