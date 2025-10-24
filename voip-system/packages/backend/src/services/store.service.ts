// @ts-nocheck
import { getClient, withTransaction } from '@w3-voip/database';
// import { Store, StoreSchema } from '@w3-voip/shared';
import { v4 as uuidv4 } from 'uuid';

// Define Store type locally
export interface Store {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  phone: string;
  status: 'active' | 'inactive';
  settings: {
    timezone: string;
    business_hours: {
      open: string;
      close: string;
      days: string[];
    };
  };
  created_at: Date;
  updated_at: Date;
}

export class StoreService {
  // Create a new store
  async createStore(storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'>): Promise<Store> {
    return withTransaction(async (client) => {
      // Verify tenant exists
      const tenantResult = await client.query(
        'SELECT id FROM tenants WHERE id = $1 AND status = $2',
        [storeData.tenant_id, 'active']
      );

      if (tenantResult.rows.length === 0) {
        throw new Error('Tenant not found or inactive');
      }

      // Check if store_id already exists for this tenant
      const existingStore = await client.query(
        'SELECT id FROM stores WHERE tenant_id = $1 AND store_id = $2',
        [storeData.tenant_id, storeData.store_id]
      );

      if (existingStore.rows.length > 0) {
        throw new Error('Store ID already exists for this tenant');
      }

      // Create store
      const result = await client.query(
        `INSERT INTO stores (id, tenant_id, name, store_id, status, settings)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          uuidv4(),
          storeData.tenant_id,
          storeData.name,
          storeData.store_id,
          storeData.status || 'active',
          JSON.stringify(storeData.settings)
        ]
      );

      const store = result.rows[0];
      return {
        ...store,
        settings: store.settings
      };
    });
  }

  // Get store by ID
  async getStoreById(storeId: string, tenantId?: string): Promise<Store | null> {
    const client = await getClient();
    
    try {
      let query = 'SELECT * FROM stores WHERE id = $1';
      let params: any[] = [storeId];
      
      if (tenantId) {
        query += ' AND tenant_id = $2';
        params.push(tenantId);
      }

      const result = await client.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      const store = result.rows[0];
      return {
        ...store,
        settings: store.settings
      };
    } finally {
      await client.release();
    }
  }

  // Get store by store_id and tenant_id
  async getStoreByStoreId(storeId: string, tenantId: string): Promise<Store | null> {
    const client = await getClient();
    
    try {
      const result = await client.query(
        'SELECT * FROM stores WHERE store_id = $1 AND tenant_id = $2',
        [storeId, tenantId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const store = result.rows[0];
      return {
        ...store,
        settings: store.settings
      };
    } finally {
      await client.release();
    }
  }

  // Update store
  async updateStore(storeId: string, updates: Partial<Omit<Store, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>, tenantId?: string): Promise<Store> {
    return withTransaction(async (client) => {
      // Check if store_id conflicts with other stores in the same tenant
      if (updates.store_id) {
        const existingStore = await client.query(
          'SELECT id FROM stores WHERE tenant_id = $1 AND store_id = $2 AND id != $3',
          [tenantId, updates.store_id, storeId]
        );

        if (existingStore.rows.length > 0) {
          throw new Error('Store ID already exists for this tenant');
        }
      }

      // Build update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.store_id !== undefined) {
        updateFields.push(`store_id = $${paramCount++}`);
        values.push(updates.store_id);
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

      values.push(storeId);
      
      let query = `UPDATE stores SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`;
      
      if (tenantId) {
        query += ` AND tenant_id = $${paramCount + 1}`;
        values.push(tenantId);
      }
      
      query += ' RETURNING *';

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Store not found');
      }

      const store = result.rows[0];
      return {
        ...store,
        settings: store.settings
      };
    });
  }

  // Delete store
  async deleteStore(storeId: string, tenantId?: string): Promise<void> {
    return withTransaction(async (client) => {
      let query = 'DELETE FROM stores WHERE id = $1';
      let params: any[] = [storeId];
      
      if (tenantId) {
        query += ' AND tenant_id = $2';
        params.push(tenantId);
      }

      const result = await client.query(query, params);

      if (result.rowCount === 0) {
        throw new Error('Store not found');
      }
    });
  }

  // List stores for a tenant
  async listStores(tenantId: string, page: number = 1, limit: number = 50, search?: string): Promise<{
    stores: Store[];
    total: number;
    totalPages: number;
  }> {
    const client = await getClient();
    
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE tenant_id = $1';
      let queryParams: any[] = [tenantId];
      
      if (search) {
        whereClause += ' AND (name ILIKE $2 OR store_id ILIKE $2)';
        queryParams.push(`%${search}%`);
      }

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) FROM stores ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].count);

      // Get stores
      const result = await client.query(
        `SELECT * FROM stores ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      );

      const stores = result.rows.map(row => ({
        ...row,
        settings: row.settings
      }));

      return {
        stores,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } finally {
      await client.release();
    }
  }

  // Get store statistics
  async getStoreStats(storeId: string, tenantId?: string): Promise<{
    extension_count: number;
    trunk_count: number;
    total_calls: number;
    active_calls: number;
    last_call_time: Date | null;
  }> {
    const client = await getClient();
    
    try {
      let whereClause = 'WHERE s.id = $1';
      let params: any[] = [storeId];
      
      if (tenantId) {
        whereClause += ' AND s.tenant_id = $2';
        params.push(tenantId);
      }

      const result = await client.query(
        `SELECT 
           COUNT(DISTINCT e.id) as extension_count,
           COUNT(DISTINCT st.id) as trunk_count,
           COUNT(DISTINCT c.id) as total_calls,
           COUNT(DISTINCT ac.id) as active_calls,
           MAX(c.start_time) as last_call_time
         FROM stores s
         LEFT JOIN extensions e ON s.id = e.store_id
         LEFT JOIN sip_trunks st ON s.id = st.store_id
         LEFT JOIN cdr c ON s.id = c.store_id
         LEFT JOIN active_calls ac ON s.id = ac.store_id
         ${whereClause}
         GROUP BY s.id`,
        params
      );

      if (result.rows.length === 0) {
        throw new Error('Store not found');
      }

      return result.rows[0];
    } finally {
      await client.release();
    }
  }

  // Activate store
  async activateStore(storeId: string, tenantId?: string): Promise<Store> {
    return this.updateStore(storeId, { status: 'active' }, tenantId);
  }

  // Deactivate store
  async deactivateStore(storeId: string, tenantId?: string): Promise<Store> {
    return this.updateStore(storeId, { status: 'inactive' }, tenantId);
  }

  // Validate store_id uniqueness within tenant
  async validateStoreIdUniqueness(storeId: string, tenantId: string, excludeStoreId?: string): Promise<boolean> {
    const client = await getClient();
    
    try {
      let query = 'SELECT id FROM stores WHERE tenant_id = $1 AND store_id = $2';
      let params: any[] = [tenantId, storeId];
      
      if (excludeStoreId) {
        query += ' AND id != $3';
        params.push(excludeStoreId);
      }

      const result = await client.query(query, params);
      return result.rows.length === 0;
    } finally {
      await client.release();
    }
  }
}

