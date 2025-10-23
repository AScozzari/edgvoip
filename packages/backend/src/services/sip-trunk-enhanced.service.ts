import { getClient, withTransaction } from '@w3-voip/database';
import { v4 as uuidv4 } from 'uuid';

// Enhanced SIP Trunk interface with multi-provider support
export interface SipTrunkEnhanced {
  id: string;
  tenant_id: string;
  store_id?: string;
  name: string;
  provider: string;
  provider_type: string;
  provider_config: any;
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
  // Enhanced fields for multi-provider support
  codec_preferences: string[];
  dtmf_mode: 'rfc2833' | 'inband' | 'info';
  nat_traversal: boolean;
  nat_type: 'none' | 'stun' | 'turn' | 'ice';
  session_timers: boolean;
  session_refresh_method: 'uas' | 'uac';
  session_expires: number;
  session_min_se: number;
  media_timeout: number;
  media_hold_timeout: number;
  rtp_timeout: number;
  rtp_hold_timeout: number;
  call_timeout: number;
  call_timeout_code: string;
  hangup_after_bridge: boolean;
  record_calls: boolean;
  record_path?: string;
  record_sample_rate: number;
  record_channels: number;
  failover_trunk_id?: string;
  max_concurrent_calls: number;
  current_calls: number;
  last_registration_attempt?: Date;
  last_successful_registration?: Date;
  registration_attempts: number;
  registration_failures: number;
  last_error_message?: string;
  health_check_interval: number;
  health_check_timeout: number;
  health_check_enabled: boolean;
  last_health_check?: Date;
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  created_at: Date;
  updated_at: Date;
}

export interface SipProviderTemplate {
  id: string;
  name: string;
  provider_type: string;
  description: string;
  default_config: any;
  required_fields: string[];
  optional_fields: string[];
  codec_preferences: string[];
  supported_features: any;
  documentation_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SipTrunkHealthLog {
  id: string;
  trunk_id: string;
  check_type: 'registration' | 'ping' | 'call_test';
  status: 'success' | 'failure' | 'timeout';
  response_time?: number;
  error_message?: string;
  details?: any;
  checked_at: Date;
}

export interface SipTrunkUsageStats {
  id: string;
  trunk_id: string;
  date: Date;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  total_duration: number;
  total_cost: number;
  peak_concurrent_calls: number;
  created_at: Date;
  updated_at: Date;
}

export class SipTrunkEnhancedService {
  // Get all provider templates
  async getProviderTemplates(): Promise<SipProviderTemplate[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        'SELECT * FROM sip_provider_templates ORDER BY name ASC'
      );
      
      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        provider_type: row.provider_type,
        description: row.description,
        default_config: typeof row.default_config === 'string' ? JSON.parse(row.default_config) : row.default_config,
        required_fields: typeof row.required_fields === 'string' ? JSON.parse(row.required_fields) : row.required_fields,
        optional_fields: typeof row.optional_fields === 'string' ? JSON.parse(row.optional_fields) : row.optional_fields,
        codec_preferences: typeof row.codec_preferences === 'string' ? JSON.parse(row.codec_preferences) : row.codec_preferences,
        supported_features: typeof row.supported_features === 'string' ? JSON.parse(row.supported_features) : row.supported_features,
        documentation_url: row.documentation_url,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  // Get provider template by type
  async getProviderTemplate(providerType: string): Promise<SipProviderTemplate | null> {
    const client = await getClient();
    try {
      const result = await client.query(
        'SELECT * FROM sip_provider_templates WHERE provider_type = $1',
        [providerType]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        provider_type: row.provider_type,
        description: row.description,
        default_config: typeof row.default_config === 'string' ? JSON.parse(row.default_config) : row.default_config,
        required_fields: typeof row.required_fields === 'string' ? JSON.parse(row.required_fields) : row.required_fields,
        optional_fields: typeof row.optional_fields === 'string' ? JSON.parse(row.optional_fields) : row.optional_fields,
        codec_preferences: typeof row.codec_preferences === 'string' ? JSON.parse(row.codec_preferences) : row.codec_preferences,
        supported_features: typeof row.supported_features === 'string' ? JSON.parse(row.supported_features) : row.supported_features,
        documentation_url: row.documentation_url,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  // Create enhanced SIP trunk
  async createSipTrunk(trunkData: Partial<SipTrunkEnhanced>): Promise<SipTrunkEnhanced> {
    return withTransaction(async (client) => {
      // Get provider template if specified
      let template: SipProviderTemplate | null = null;
      if (trunkData.provider_type) {
        template = await this.getProviderTemplate(trunkData.provider_type);
      }

      // Merge template config with provided config
      const mergedConfig = template ? {
        ...template.default_config,
        ...trunkData.sip_config
      } : trunkData.sip_config;

      const result = await client.query(
        `INSERT INTO sip_trunks (
          id, tenant_id, store_id, name, provider, provider_type, provider_config, status,
          sip_config, did_config, security, gdpr, codec_preferences, dtmf_mode,
          nat_traversal, nat_type, session_timers, session_refresh_method,
          session_expires, session_min_se, media_timeout, media_hold_timeout,
          rtp_timeout, rtp_hold_timeout, call_timeout, call_timeout_code,
          hangup_after_bridge, record_calls, record_path, record_sample_rate,
          record_channels, failover_trunk_id, max_concurrent_calls, current_calls,
          registration_attempts, registration_failures, health_check_interval,
          health_check_timeout, health_check_enabled, health_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
        ) RETURNING *`,
        [
          uuidv4(),
          trunkData.tenant_id,
          trunkData.store_id,
          trunkData.name,
          trunkData.provider || trunkData.provider_type || 'generic',
          trunkData.provider_type || 'generic',
          JSON.stringify(trunkData.provider_config || {}),
          trunkData.status || 'inactive',
          JSON.stringify(mergedConfig),
          JSON.stringify(trunkData.did_config),
          JSON.stringify(trunkData.security),
          JSON.stringify(trunkData.gdpr),
          JSON.stringify(trunkData.codec_preferences || template?.codec_preferences || ['PCMU', 'PCMA', 'G729']),
          trunkData.dtmf_mode || 'rfc2833',
          trunkData.nat_traversal || false,
          trunkData.nat_type || 'none',
          trunkData.session_timers || false,
          trunkData.session_refresh_method || 'uas',
          trunkData.session_expires || 1800,
          trunkData.session_min_se || 90,
          trunkData.media_timeout || 300,
          trunkData.media_hold_timeout || 1800,
          trunkData.rtp_timeout || 300,
          trunkData.rtp_hold_timeout || 1800,
          trunkData.call_timeout || 60,
          trunkData.call_timeout_code || 'NO_ANSWER',
          trunkData.hangup_after_bridge !== false,
          trunkData.record_calls || false,
          trunkData.record_path,
          trunkData.record_sample_rate || 8000,
          trunkData.record_channels || 1,
          trunkData.failover_trunk_id,
          trunkData.max_concurrent_calls || 10,
          trunkData.current_calls || 0,
          trunkData.registration_attempts || 0,
          trunkData.registration_failures || 0,
          trunkData.health_check_interval || 300,
          trunkData.health_check_timeout || 30,
          trunkData.health_check_enabled !== false,
          trunkData.health_status || 'unknown'
        ]
      );

      const trunk = result.rows[0];
      return this.mapRowToSipTrunk(trunk);
    });
  }

  // Get enhanced SIP trunks
  async getSipTrunks(tenantId: string, storeId?: string): Promise<SipTrunkEnhanced[]> {
    const client = await getClient();
    try {
      let query = 'SELECT * FROM sip_trunks WHERE tenant_id = $1';
      const params: any[] = [tenantId];
      
      if (storeId) {
        query += ' AND store_id = $2';
        params.push(storeId);
      }
      
      query += ' ORDER BY name ASC';
      
      const result = await client.query(query, params);
      
      return result.rows.map((row: any) => this.mapRowToSipTrunk(row));
    } finally {
      client.release();
    }
  }

  // Test SIP trunk connection
  async testSipTrunk(trunkId: string): Promise<{
    success: boolean;
    message: string;
    response_time?: number;
    error?: string;
  }> {
    const client = await getClient();
    try {
      // Get trunk configuration
      const result = await client.query(
        'SELECT * FROM sip_trunks WHERE id = $1',
        [trunkId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('SIP trunk not found');
      }
      
      const trunk = this.mapRowToSipTrunk(result.rows[0]);
      
      // Log health check attempt
      const startTime = Date.now();
      
      try {
        // Simulate SIP trunk test (in real implementation, use actual SIP testing)
        await this.simulateSipTrunkTest(trunk);
        
        const responseTime = Date.now() - startTime;
        
        // Log successful test
        await this.logHealthCheck(trunkId, 'call_test', 'success', responseTime);
        
        return {
          success: true,
          message: 'SIP trunk test successful',
          response_time: responseTime
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Log failed test
        await this.logHealthCheck(trunkId, 'call_test', 'failure', responseTime, errorMessage);
        
        return {
          success: false,
          message: 'SIP trunk test failed',
          response_time: responseTime,
          error: errorMessage
        };
      }
    } finally {
      client.release();
    }
  }

  // Get SIP trunk health logs
  async getHealthLogs(trunkId: string, limit: number = 50): Promise<SipTrunkHealthLog[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        'SELECT * FROM sip_trunk_health_logs WHERE trunk_id = $1 ORDER BY checked_at DESC LIMIT $2',
        [trunkId, limit]
      );
      
      return result.rows.map((row: any) => ({
        id: row.id,
        trunk_id: row.trunk_id,
        check_type: row.check_type,
        status: row.status,
        response_time: row.response_time,
        error_message: row.error_message,
        details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
        checked_at: row.checked_at
      }));
    } finally {
      client.release();
    }
  }

  // Get SIP trunk usage statistics
  async getUsageStats(trunkId: string, startDate: Date, endDate: Date): Promise<SipTrunkUsageStats[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        'SELECT * FROM sip_trunk_usage_stats WHERE trunk_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC',
        [trunkId, startDate, endDate]
      );
      
      return result.rows.map((row: any) => ({
        id: row.id,
        trunk_id: row.trunk_id,
        date: row.date,
        total_calls: row.total_calls,
        successful_calls: row.successful_calls,
        failed_calls: row.failed_calls,
        total_duration: row.total_duration,
        total_cost: row.total_cost,
        peak_concurrent_calls: row.peak_concurrent_calls,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  // Log health check
  private async logHealthCheck(
    trunkId: string,
    checkType: string,
    status: string,
    responseTime?: number,
    errorMessage?: string,
    details?: any
  ): Promise<void> {
    const client = await getClient();
    try {
      await client.query(
        `SELECT log_sip_trunk_health_check($1, $2, $3, $4, $5, $6)`,
        [trunkId, checkType, status, responseTime, errorMessage, details ? JSON.stringify(details) : null]
      );
    } finally {
      client.release();
    }
  }

  // Simulate SIP trunk test (replace with actual SIP testing)
  private async simulateSipTrunkTest(trunk: SipTrunkEnhanced): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));
    
    // Simulate test failure for demonstration
    if (trunk.sip_config.host === 'invalid.host') {
      throw new Error('Connection timeout');
    }
    
    // Simulate success
    return;
  }

  // Map database row to SipTrunkEnhanced object
  private mapRowToSipTrunk(row: any): SipTrunkEnhanced {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      store_id: row.store_id,
      name: row.name,
      provider: row.provider,
      provider_type: row.provider_type,
      provider_config: typeof row.provider_config === 'string' ? JSON.parse(row.provider_config) : row.provider_config,
      status: row.status,
      sip_config: typeof row.sip_config === 'string' ? JSON.parse(row.sip_config) : row.sip_config,
      did_config: typeof row.did_config === 'string' ? JSON.parse(row.did_config) : row.did_config,
      security: typeof row.security === 'string' ? JSON.parse(row.security) : row.security,
      gdpr: typeof row.gdpr === 'string' ? JSON.parse(row.gdpr) : row.gdpr,
      codec_preferences: typeof row.codec_preferences === 'string' ? JSON.parse(row.codec_preferences) : row.codec_preferences,
      dtmf_mode: row.dtmf_mode,
      nat_traversal: row.nat_traversal,
      nat_type: row.nat_type,
      session_timers: row.session_timers,
      session_refresh_method: row.session_refresh_method,
      session_expires: row.session_expires,
      session_min_se: row.session_min_se,
      media_timeout: row.media_timeout,
      media_hold_timeout: row.media_hold_timeout,
      rtp_timeout: row.rtp_timeout,
      rtp_hold_timeout: row.rtp_hold_timeout,
      call_timeout: row.call_timeout,
      call_timeout_code: row.call_timeout_code,
      hangup_after_bridge: row.hangup_after_bridge,
      record_calls: row.record_calls,
      record_path: row.record_path,
      record_sample_rate: row.record_sample_rate,
      record_channels: row.record_channels,
      failover_trunk_id: row.failover_trunk_id,
      max_concurrent_calls: row.max_concurrent_calls,
      current_calls: row.current_calls,
      last_registration_attempt: row.last_registration_attempt,
      last_successful_registration: row.last_successful_registration,
      registration_attempts: row.registration_attempts,
      registration_failures: row.registration_failures,
      last_error_message: row.last_error_message,
      health_check_interval: row.health_check_interval,
      health_check_timeout: row.health_check_timeout,
      health_check_enabled: row.health_check_enabled,
      last_health_check: row.last_health_check,
      health_status: row.health_status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

// Export singleton instance
export const sipTrunkEnhancedService = new SipTrunkEnhancedService();
