import { getClient, withTransaction } from '@w3-voip/database';
// import { SipTrunk } from '@w3-voip/shared';
import { v4 as uuidv4 } from 'uuid';
// import { logAPICall } from '../utils/logger';

// Define SipTrunk type locally
export interface SipTrunk {
  id: string;
  tenant_id: string;
  store_id?: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive' | 'testing';
  sip_config: {
    host: string;
    port: number;
    transport: 'udp' | 'tcp' | 'tls';
    username: string;
    password: string;
    realm?: string;
    from_user?: string;
    from_domain?: string;
    register: boolean;
    register_proxy?: string;
    register_transport?: 'udp' | 'tcp' | 'tls';
    retry_seconds: number;
    caller_id_in_from: boolean;
    contact_params?: string;
    ping: boolean;
    ping_time: number;
  };
  did_config: {
    number: string;
    country_code: string;
    area_code?: string;
    local_number: string;
    provider_did?: string;
    inbound_route?: string;
  };
  security: {
    encryption: 'none' | 'tls' | 'srtp';
    authentication: 'none' | 'digest' | 'tls';
    acl: string[];
    rate_limit: {
      enabled: boolean;
      calls_per_minute: number;
      calls_per_hour: number;
    };
  };
  gdpr: {
    data_retention_days: number;
    recording_consent_required: boolean;
    data_processing_purpose: string;
    lawful_basis: 'consent' | 'contract' | 'legitimate_interest';
    data_controller: string;
    dpo_contact?: string;
  };
  created_at: Date;
  updated_at: Date;
}

export class SipTrunkService {
  // Create a new SIP trunk
  async createSipTrunk(trunkData: Omit<SipTrunk, 'id' | 'created_at' | 'updated_at'>): Promise<SipTrunk> {
    return withTransaction(async (client) => {
      // Verify tenant exists
      const tenantResult = await client.query(
        'SELECT id FROM tenants WHERE id = $1 AND status = $2',
        [trunkData.tenant_id, 'active']
      );

      if (tenantResult.rows.length === 0) {
        throw new Error('Tenant not found or inactive');
      }

      // Verify store exists if provided
      if (trunkData.store_id) {
        const storeResult = await client.query(
          'SELECT id FROM stores WHERE id = $1 AND tenant_id = $2 AND status = $3',
          [trunkData.store_id, trunkData.tenant_id, 'active']
        );

        if (storeResult.rows.length === 0) {
          throw new Error('Store not found or inactive');
        }
      }

      // Check if trunk name already exists for this tenant
      const existingTrunk = await client.query(
        'SELECT id FROM sip_trunks WHERE tenant_id = $1 AND name = $2',
        [trunkData.tenant_id, trunkData.name]
      );

      if (existingTrunk.rows.length > 0) {
        throw new Error('Trunk name already exists for this tenant');
      }

      // Create SIP trunk
      const result = await client.query(
        `INSERT INTO sip_trunks (
          id, tenant_id, store_id, name, provider, status, 
          sip_config, did_config, security, gdpr
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          uuidv4(),
          trunkData.tenant_id,
          trunkData.store_id || null,
          trunkData.name,
          trunkData.provider,
          trunkData.status || 'testing',
          JSON.stringify(trunkData.sip_config),
          JSON.stringify(trunkData.did_config),
          JSON.stringify(trunkData.security),
          JSON.stringify(trunkData.gdpr)
        ]
      );

      const trunk = result.rows[0];
      
      // logAPICall('sip_trunk_created', {
      //   tenant_id: trunkData.tenant_id,
      //   trunk_id: trunk.id,
      //   trunk_name: trunk.name
      // });

      return {
        ...trunk,
        sip_config: typeof trunk.sip_config === 'string' ? JSON.parse(trunk.sip_config) : trunk.sip_config,
        did_config: typeof trunk.did_config === 'string' ? JSON.parse(trunk.did_config) : trunk.did_config,
        security: typeof trunk.security === 'string' ? JSON.parse(trunk.security) : trunk.security,
        gdpr: typeof trunk.gdpr === 'string' ? JSON.parse(trunk.gdpr) : trunk.gdpr
      };
    });
  }

  // Get SIP trunk by ID
  async getSipTrunkById(trunkId: string, tenantId: string): Promise<SipTrunk | null> {
    const client = await getClient();
    
    try {
      const result = await client.query(
        'SELECT * FROM sip_trunks WHERE id = $1 AND tenant_id = $2',
        [trunkId, tenantId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const trunk = result.rows[0];
      return {
        ...trunk,
        sip_config: typeof trunk.sip_config === 'string' ? JSON.parse(trunk.sip_config) : trunk.sip_config,
        did_config: typeof trunk.did_config === 'string' ? JSON.parse(trunk.did_config) : trunk.did_config,
        security: typeof trunk.security === 'string' ? JSON.parse(trunk.security) : trunk.security,
        gdpr: typeof trunk.gdpr === 'string' ? JSON.parse(trunk.gdpr) : trunk.gdpr
      };
    } finally {
      client.release();
    }
  }

  // List SIP trunks for tenant
  async listSipTrunks(tenantId: string, storeId?: string): Promise<SipTrunk[]> {
    const client = await getClient();
    
    try {
      let query = 'SELECT * FROM sip_trunks WHERE tenant_id = $1';
      const params: any[] = [tenantId];

      if (storeId) {
        query += ' AND store_id = $2';
        params.push(storeId);
      }

      query += ' ORDER BY created_at DESC';

      const result = await client.query(query, params);

      return result.rows.map((trunk: any) => ({
        ...trunk,
        sip_config: typeof trunk.sip_config === 'string' ? JSON.parse(trunk.sip_config) : trunk.sip_config,
        did_config: typeof trunk.did_config === 'string' ? JSON.parse(trunk.did_config) : trunk.did_config,
        security: typeof trunk.security === 'string' ? JSON.parse(trunk.security) : trunk.security,
        gdpr: typeof trunk.gdpr === 'string' ? JSON.parse(trunk.gdpr) : trunk.gdpr
      }));
    } finally {
      client.release();
    }
  }

  // Update SIP trunk
  async updateSipTrunk(
    trunkId: string, 
    tenantId: string, 
    updateData: Partial<Omit<SipTrunk, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
  ): Promise<SipTrunk> {
    return withTransaction(async (client) => {
      // Verify trunk exists and belongs to tenant
      const existingTrunk = await client.query(
        'SELECT id FROM sip_trunks WHERE id = $1 AND tenant_id = $2',
        [trunkId, tenantId]
      );

      if (existingTrunk.rows.length === 0) {
        throw new Error('SIP trunk not found');
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      if (updateData.name) {
        updateFields.push(`name = $${paramCount++}`);
        updateValues.push(updateData.name);
      }
      if (updateData.provider) {
        updateFields.push(`provider = $${paramCount++}`);
        updateValues.push(updateData.provider);
      }
      if (updateData.status) {
        updateFields.push(`status = $${paramCount++}`);
        updateValues.push(updateData.status);
      }
      if (updateData.store_id !== undefined) {
        updateFields.push(`store_id = $${paramCount++}`);
        updateValues.push(updateData.store_id);
      }
      if (updateData.sip_config) {
        updateFields.push(`sip_config = $${paramCount++}`);
        updateValues.push(JSON.stringify(updateData.sip_config));
      }
      if (updateData.did_config) {
        updateFields.push(`did_config = $${paramCount++}`);
        updateValues.push(JSON.stringify(updateData.did_config));
      }
      if (updateData.security) {
        updateFields.push(`security = $${paramCount++}`);
        updateValues.push(JSON.stringify(updateData.security));
      }
      if (updateData.gdpr) {
        updateFields.push(`gdpr = $${paramCount++}`);
        updateValues.push(JSON.stringify(updateData.gdpr));
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(trunkId, tenantId);

      const query = `
        UPDATE sip_trunks 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
        RETURNING *
      `;

      const result = await client.query(query, updateValues);
      const trunk = result.rows[0];

      // logAPICall('sip_trunk_updated', {
      //   tenant_id: tenantId,
      //   trunk_id: trunkId,
      //   updated_fields: Object.keys(updateData)
      // });

      return {
        ...trunk,
        sip_config: typeof trunk.sip_config === 'string' ? JSON.parse(trunk.sip_config) : trunk.sip_config,
        did_config: typeof trunk.did_config === 'string' ? JSON.parse(trunk.did_config) : trunk.did_config,
        security: typeof trunk.security === 'string' ? JSON.parse(trunk.security) : trunk.security,
        gdpr: typeof trunk.gdpr === 'string' ? JSON.parse(trunk.gdpr) : trunk.gdpr
      };
    });
  }

  // Delete SIP trunk
  async deleteSipTrunk(trunkId: string, tenantId: string): Promise<void> {
    return withTransaction(async (client) => {
      const result = await client.query(
        'DELETE FROM sip_trunks WHERE id = $1 AND tenant_id = $2',
        [trunkId, tenantId]
      );

      if (result.rowCount === 0) {
        throw new Error('SIP trunk not found');
      }

      // logAPICall('sip_trunk_deleted', {
      //   tenant_id: tenantId,
      //   trunk_id: trunkId
      // });
    });
  }

  // Test SIP trunk connectivity
  async testSipTrunk(trunkId: string, tenantId: string): Promise<{ success: boolean; message: string; details?: any }> {
    const trunk = await this.getSipTrunkById(trunkId, tenantId);
    
    if (!trunk) {
      return { success: false, message: 'SIP trunk not found' };
    }

    try {
      // Here you would implement actual SIP trunk testing
      // For now, we'll simulate a test
      const testResult = {
        success: Math.random() > 0.3, // 70% success rate for demo
        message: Math.random() > 0.3 ? 'Connection successful' : 'Connection failed - Authentication error',
        details: {
          host: trunk.sip_config.host,
          port: trunk.sip_config.port,
          transport: trunk.sip_config.transport,
          tested_at: new Date().toISOString()
        }
      };

      // logAPICall('sip_trunk_tested', {
      //   tenant_id: tenantId,
      //   trunk_id: trunkId,
      //   test_result: testResult
      // });

      return testResult;
    } catch (error) {
      return { 
        success: false, 
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Get SIP trunk statistics
  async getSipTrunkStats(trunkId: string, tenantId: string): Promise<any> {
    const client = await getClient();
    
    try {
      // Get call statistics for this trunk
      const statsResult = await client.query(
        `SELECT 
          COUNT(*) as total_calls,
          COUNT(CASE WHEN hangup_disposition = 'answered' THEN 1 END) as answered_calls,
          COUNT(CASE WHEN hangup_disposition = 'no_answer' THEN 1 END) as no_answer_calls,
          COUNT(CASE WHEN hangup_disposition = 'busy' THEN 1 END) as busy_calls,
          AVG(duration) as avg_duration,
          SUM(bill_seconds) as total_bill_seconds
        FROM cdr 
        WHERE trunk_id = $1 AND tenant_id = $2
        AND start_time >= NOW() - INTERVAL '30 days'`,
        [trunkId, tenantId]
      );

      return statsResult.rows[0];
    } finally {
      client.release();
    }
  }
}

export const sipTrunkService = new SipTrunkService();
