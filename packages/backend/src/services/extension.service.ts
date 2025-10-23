// @ts-nocheck
import { getClient, withTransaction } from '@w3-voip/database';
// import { Extension, ExtensionSchema } from '@w3-voip/shared';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Define Extension type locally
export interface Extension {
  id: string;
  tenant_id: string;
  store_id?: string;
  extension: string;
  password: string;
  display_name: string;
  status: 'active' | 'inactive';
  type: 'user' | 'queue' | 'conference';
  settings: {
    voicemail_enabled: boolean;
    call_forwarding: {
      enabled: boolean;
      destination?: string;
    };
    recording: {
      enabled: boolean;
      mode: 'always' | 'on_demand';
    };
  };
  created_at: Date;
  updated_at: Date;
}

export class ExtensionService {
  // Create a new extension
  async createExtension(extensionData: Omit<Extension, 'id' | 'created_at' | 'updated_at'>): Promise<Extension> {
    return withTransaction(async (client) => {
      // Verify tenant exists
      const tenantResult = await client.query(
        'SELECT id FROM tenants WHERE id = $1 AND status = $2',
        [extensionData.tenant_id, 'active']
      );

      if (tenantResult.rows.length === 0) {
        throw new Error('Tenant not found or inactive');
      }

      // Verify store exists if provided
      if (extensionData.store_id) {
        const storeResult = await client.query(
          'SELECT id FROM stores WHERE id = $1 AND tenant_id = $2 AND status = $3',
          [extensionData.store_id, extensionData.tenant_id, 'active']
        );

        if (storeResult.rows.length === 0) {
          throw new Error('Store not found or inactive');
        }
      }

      // Check if extension already exists for this tenant
      const existingExtension = await client.query(
        'SELECT id FROM extensions WHERE tenant_id = $1 AND extension = $2',
        [extensionData.tenant_id, extensionData.extension]
      );

      if (existingExtension.rows.length > 0) {
        throw new Error('Extension already exists for this tenant');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(extensionData.password, 12);

      // Create extension
      const result = await client.query(
        `INSERT INTO extensions (id, tenant_id, store_id, extension, password, display_name, status, type, settings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          uuidv4(),
          extensionData.tenant_id,
          extensionData.store_id || null,
          extensionData.extension,
          hashedPassword,
          extensionData.display_name,
          extensionData.status || 'active',
          extensionData.type || 'user',
          JSON.stringify(extensionData.settings)
        ]
      );

      const extension = result.rows[0];
      return {
        ...extension,
        password: extensionData.password, // Return original password for response
        settings: JSON.parse(extension.settings)
      };
    });
  }

  // Get extension by ID
  async getExtensionById(extensionId: string, tenantId?: string): Promise<Extension | null> {
    const client = await getClient();
    
    try {
      let query = 'SELECT * FROM extensions WHERE id = $1';
      let params: any[] = [extensionId];
      
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
        settings: JSON.parse(extension.settings)
      };
    } finally {
      await client.release();
    }
  }

  // Get extension by extension number and tenant
  async getExtensionByNumber(extension: string, tenantId: string): Promise<Extension | null> {
    const client = await getClient();
    
    try {
      const result = await client.query(
        'SELECT * FROM extensions WHERE extension = $1 AND tenant_id = $2',
        [extension, tenantId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const ext = result.rows[0];
      return {
        ...ext,
        settings: JSON.parse(ext.settings)
      };
    } finally {
      await client.release();
    }
  }

  // Update extension
  async updateExtension(extensionId: string, updates: Partial<Omit<Extension, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>, tenantId?: string): Promise<Extension> {
    return withTransaction(async (client) => {
      // Check if extension conflicts with other extensions in the same tenant
      if (updates.extension) {
        const existingExtension = await client.query(
          'SELECT id FROM extensions WHERE tenant_id = $1 AND extension = $2 AND id != $3',
          [tenantId, updates.extension, extensionId]
        );

        if (existingExtension.rows.length > 0) {
          throw new Error('Extension already exists for this tenant');
        }
      }

      // Build update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.extension !== undefined) {
        updateFields.push(`extension = $${paramCount++}`);
        values.push(updates.extension);
      }
      if (updates.password !== undefined) {
        const hashedPassword = await bcrypt.hash(updates.password, 12);
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
        settings: JSON.parse(extension.settings)
      };
    });
  }

  // Delete extension
  async deleteExtension(extensionId: string, tenantId?: string): Promise<void> {
    return withTransaction(async (client) => {
      let query = 'DELETE FROM extensions WHERE id = $1';
      let params: any[] = [extensionId];
      
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
  async listExtensions(tenantId: string, storeId?: string, page: number = 1, limit: number = 50, search?: string): Promise<{
    extensions: Extension[];
    total: number;
    totalPages: number;
  }> {
    const client = await getClient();
    
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE tenant_id = $1';
      let queryParams: any[] = [tenantId];
      
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
      const countResult = await client.query(
        `SELECT COUNT(*) FROM extensions ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].count);

      // Get extensions
      const result = await client.query(
        `SELECT * FROM extensions ${whereClause}
         ORDER BY extension ASC
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      );

      const extensions = result.rows.map(row => ({
        ...row,
        password: '[HIDDEN]', // Hide passwords in list
        settings: JSON.parse(row.settings)
      }));

      return {
        extensions,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } finally {
      await client.release();
    }
  }

  // Verify extension password
  async verifyExtensionPassword(extension: string, password: string, tenantId: string): Promise<Extension | null> {
    const client = await getClient();
    
    try {
      const result = await client.query(
        'SELECT * FROM extensions WHERE extension = $1 AND tenant_id = $2 AND status = $3',
        [extension, tenantId, 'active']
      );

      if (result.rows.length === 0) {
        return null;
      }

      const ext = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, ext.password);

      if (!isValidPassword) {
        return null;
      }

      return {
        ...ext,
        password: '[HIDDEN]',
        settings: JSON.parse(ext.settings)
      };
    } finally {
      await client.release();
    }
  }

  // Activate extension
  async activateExtension(extensionId: string, tenantId?: string): Promise<Extension> {
    return this.updateExtension(extensionId, { status: 'active' }, tenantId);
  }

  // Deactivate extension
  async deactivateExtension(extensionId: string, tenantId?: string): Promise<Extension> {
    return this.updateExtension(extensionId, { status: 'inactive' }, tenantId);
  }

  // Lock extension
  async lockExtension(extensionId: string, tenantId?: string): Promise<Extension> {
    return this.updateExtension(extensionId, { status: 'inactive' }, tenantId);
  }

  // Validate extension number uniqueness within tenant
  async validateExtensionUniqueness(extension: string, tenantId: string, excludeExtensionId?: string): Promise<boolean> {
    const client = await getClient();
    
    try {
      let query = 'SELECT id FROM extensions WHERE tenant_id = $1 AND extension = $2';
      let params: any[] = [tenantId, extension];
      
      if (excludeExtensionId) {
        query += ' AND id != $3';
        params.push(excludeExtensionId);
      }

      const result = await client.query(query, params);
      return result.rows.length === 0;
    } finally {
      await client.release();
    }
  }

  // Get extension statistics
  async getExtensionStats(extensionId: string, tenantId?: string): Promise<{
    total_calls: number;
    answered_calls: number;
    missed_calls: number;
    total_duration: number;
    last_call_time: Date | null;
  }> {
    const client = await getClient();
    
    try {
      let whereClause = 'WHERE e.id = $1';
      let params: any[] = [extensionId];
      
      if (tenantId) {
        whereClause += ' AND e.tenant_id = $2';
        params.push(tenantId);
      }

      const result = await client.query(
        `SELECT 
           COUNT(DISTINCT c.id) as total_calls,
           COUNT(DISTINCT CASE WHEN c.hangup_disposition = 'answered' THEN c.id END) as answered_calls,
           COUNT(DISTINCT CASE WHEN c.hangup_disposition IN ('no_answer', 'busy') THEN c.id END) as missed_calls,
           COALESCE(SUM(c.duration), 0) as total_duration,
           MAX(c.start_time) as last_call_time
         FROM extensions e
         LEFT JOIN cdr c ON e.id = c.extension_id
         ${whereClause}
         GROUP BY e.id`,
        params
      );

      if (result.rows.length === 0) {
        throw new Error('Extension not found');
      }

      return result.rows[0];
    } finally {
      await client.release();
    }
  }
}

