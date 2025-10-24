"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sipTrunkEnhancedService = exports.SipTrunkEnhancedService = void 0;
const database_1 = require("@w3-voip/database");
const uuid_1 = require("uuid");
class SipTrunkEnhancedService {
    // Get all provider templates
    async getProviderTemplates() {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM sip_provider_templates ORDER BY name ASC');
            return result.rows.map((row) => ({
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
        }
        finally {
            client.release();
        }
    }
    // Get provider template by type
    async getProviderTemplate(providerType) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM sip_provider_templates WHERE provider_type = $1', [providerType]);
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
        }
        finally {
            client.release();
        }
    }
    // Create enhanced SIP trunk
    async createSipTrunk(trunkData) {
        return (0, database_1.withTransaction)(async (client) => {
            // Get provider template if specified
            let template = null;
            if (trunkData.provider_type) {
                template = await this.getProviderTemplate(trunkData.provider_type);
            }
            // Merge template config with provided config
            const mergedConfig = template ? {
                ...template.default_config,
                ...trunkData.sip_config
            } : trunkData.sip_config;
            const result = await client.query(`INSERT INTO sip_trunks (
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
        ) RETURNING *`, [
                (0, uuid_1.v4)(),
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
            ]);
            const trunk = result.rows[0];
            return this.mapRowToSipTrunk(trunk);
        });
    }
    // Get enhanced SIP trunks
    async getSipTrunks(tenantId, storeId) {
        const client = await (0, database_1.getClient)();
        try {
            let query = 'SELECT * FROM sip_trunks WHERE tenant_id = $1';
            const params = [tenantId];
            if (storeId) {
                query += ' AND store_id = $2';
                params.push(storeId);
            }
            query += ' ORDER BY name ASC';
            const result = await client.query(query, params);
            return result.rows.map((row) => this.mapRowToSipTrunk(row));
        }
        finally {
            client.release();
        }
    }
    // Test SIP trunk connection
    async testSipTrunk(trunkId) {
        const client = await (0, database_1.getClient)();
        try {
            // Get trunk configuration
            const result = await client.query('SELECT * FROM sip_trunks WHERE id = $1', [trunkId]);
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
            }
            catch (error) {
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
        }
        finally {
            client.release();
        }
    }
    // Get SIP trunk health logs
    async getHealthLogs(trunkId, limit = 50) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM sip_trunk_health_logs WHERE trunk_id = $1 ORDER BY checked_at DESC LIMIT $2', [trunkId, limit]);
            return result.rows.map((row) => ({
                id: row.id,
                trunk_id: row.trunk_id,
                check_type: row.check_type,
                status: row.status,
                response_time: row.response_time,
                error_message: row.error_message,
                details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
                checked_at: row.checked_at
            }));
        }
        finally {
            client.release();
        }
    }
    // Get SIP trunk usage statistics
    async getUsageStats(trunkId, startDate, endDate) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM sip_trunk_usage_stats WHERE trunk_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC', [trunkId, startDate, endDate]);
            return result.rows.map((row) => ({
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
        }
        finally {
            client.release();
        }
    }
    // Log health check
    async logHealthCheck(trunkId, checkType, status, responseTime, errorMessage, details) {
        const client = await (0, database_1.getClient)();
        try {
            await client.query(`SELECT log_sip_trunk_health_check($1, $2, $3, $4, $5, $6)`, [trunkId, checkType, status, responseTime, errorMessage, details ? JSON.stringify(details) : null]);
        }
        finally {
            client.release();
        }
    }
    // Simulate SIP trunk test (replace with actual SIP testing)
    async simulateSipTrunkTest(trunk) {
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
    mapRowToSipTrunk(row) {
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
exports.SipTrunkEnhancedService = SipTrunkEnhancedService;
// Export singleton instance
exports.sipTrunkEnhancedService = new SipTrunkEnhancedService();
//# sourceMappingURL=sip-trunk-enhanced.service.js.map