"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdrActivityService = void 0;
// @ts-nocheck
const uuid_1 = require("uuid");
class CdrActivityService {
    constructor() {
        // Mock database - in production this would be real database operations
        this.mockCdrs = [];
        this.mockActivityLogs = [];
    }
    // ===== VOIP CDR =====
    async createCdr(cdrData) {
        const cdr = {
            id: (0, uuid_1.v4)(),
            tenant_id: cdrData.tenant_id,
            store_id: cdrData.store_id,
            sip_domain: cdrData.sip_domain,
            call_id: cdrData.call_id,
            direction: cdrData.direction,
            from_uri: cdrData.from_uri,
            to_uri: cdrData.to_uri,
            did_e164: cdrData.did_e164,
            ext_number: cdrData.ext_number,
            start_ts: cdrData.start_ts,
            answer_ts: cdrData.answer_ts,
            end_ts: cdrData.end_ts,
            billsec: cdrData.billsec || 0,
            disposition: cdrData.disposition,
            recording_url: cdrData.recording_url,
            meta_json: cdrData.meta_json
        };
        this.mockCdrs.push(cdr);
        console.log(`Created CDR: ${cdr.call_id} for tenant: ${cdr.tenant_id}`);
        return cdr;
    }
    async getCdrs(filters) {
        let filteredCdrs = this.mockCdrs.filter(cdr => cdr.tenant_id === filters.tenant_id);
        // Apply filters
        if (filters.store_id) {
            filteredCdrs = filteredCdrs.filter(cdr => cdr.store_id === filters.store_id);
        }
        if (filters.direction) {
            filteredCdrs = filteredCdrs.filter(cdr => cdr.direction === filters.direction);
        }
        if (filters.disposition) {
            filteredCdrs = filteredCdrs.filter(cdr => cdr.disposition === filters.disposition);
        }
        if (filters.ext_number) {
            filteredCdrs = filteredCdrs.filter(cdr => cdr.ext_number === filters.ext_number);
        }
        if (filters.did_e164) {
            filteredCdrs = filteredCdrs.filter(cdr => cdr.did_e164 === filters.did_e164);
        }
        if (filters.start_date) {
            filteredCdrs = filteredCdrs.filter(cdr => cdr.start_ts >= filters.start_date);
        }
        if (filters.end_date) {
            filteredCdrs = filteredCdrs.filter(cdr => cdr.start_ts <= filters.end_date);
        }
        const total = filteredCdrs.length;
        // Apply pagination
        const offset = filters.offset || 0;
        const limit = filters.limit || 100;
        const paginatedCdrs = filteredCdrs.slice(offset, offset + limit);
        return { cdrs: paginatedCdrs, total };
    }
    async getCdrById(cdrId, tenantId) {
        return this.mockCdrs.find(cdr => cdr.id === cdrId && cdr.tenant_id === tenantId) || null;
    }
    async getCdrStats(tenantId, storeId, startDate, endDate) {
        let filteredCdrs = this.mockCdrs.filter(cdr => cdr.tenant_id === tenantId);
        if (storeId) {
            filteredCdrs = filteredCdrs.filter(cdr => cdr.store_id === storeId);
        }
        if (startDate) {
            filteredCdrs = filteredCdrs.filter(cdr => cdr.start_ts >= startDate);
        }
        if (endDate) {
            filteredCdrs = filteredCdrs.filter(cdr => cdr.start_ts <= endDate);
        }
        const total_calls = filteredCdrs.length;
        const answered_calls = filteredCdrs.filter(cdr => cdr.disposition === 'ANSWERED').length;
        const missed_calls = total_calls - answered_calls;
        const total_duration = filteredCdrs.reduce((sum, cdr) => sum + cdr.billsec, 0);
        const avg_duration = total_calls > 0 ? total_duration / total_calls : 0;
        const by_direction = {
            inbound: filteredCdrs.filter(cdr => cdr.direction === 'in').length,
            outbound: filteredCdrs.filter(cdr => cdr.direction === 'out').length
        };
        const by_disposition = filteredCdrs.reduce((acc, cdr) => {
            acc[cdr.disposition] = (acc[cdr.disposition] || 0) + 1;
            return acc;
        }, {});
        return {
            total_calls,
            answered_calls,
            missed_calls,
            total_duration,
            avg_duration,
            by_direction,
            by_disposition
        };
    }
    // ===== VOIP ACTIVITY LOG =====
    async createActivityLog(tenantContext, logData) {
        const log = {
            id: (0, uuid_1.v4)(),
            tenant_id: tenantContext.tenant_id,
            actor: logData.actor,
            action: logData.action,
            target_type: logData.target_type,
            target_id: logData.target_id,
            status: logData.status,
            details_json: logData.details_json,
            ts: new Date().toISOString()
        };
        this.mockActivityLogs.push(log);
        console.log(`Created activity log: ${log.action} ${log.target_type} for tenant: ${log.tenant_id}`);
        return log;
    }
    async getActivityLogs(filters) {
        let filteredLogs = this.mockActivityLogs.filter(log => log.tenant_id === filters.tenant_id);
        // Apply filters
        if (filters.actor) {
            filteredLogs = filteredLogs.filter(log => log.actor.includes(filters.actor));
        }
        if (filters.action) {
            filteredLogs = filteredLogs.filter(log => log.action === filters.action);
        }
        if (filters.target_type) {
            filteredLogs = filteredLogs.filter(log => log.target_type === filters.target_type);
        }
        if (filters.target_id) {
            filteredLogs = filteredLogs.filter(log => log.target_id === filters.target_id);
        }
        if (filters.status) {
            filteredLogs = filteredLogs.filter(log => log.status === filters.status);
        }
        if (filters.start_date) {
            filteredLogs = filteredLogs.filter(log => log.ts >= filters.start_date);
        }
        if (filters.end_date) {
            filteredLogs = filteredLogs.filter(log => log.ts <= filters.end_date);
        }
        const total = filteredLogs.length;
        // Apply pagination
        const offset = filters.offset || 0;
        const limit = filters.limit || 100;
        const paginatedLogs = filteredLogs.slice(offset, offset + limit);
        return { logs: paginatedLogs, total };
    }
    async getActivityLogById(logId, tenantId) {
        return this.mockActivityLogs.find(log => log.id === logId && log.tenant_id === tenantId) || null;
    }
    async getActivityStats(tenantId, startDate, endDate) {
        let filteredLogs = this.mockActivityLogs.filter(log => log.tenant_id === tenantId);
        if (startDate) {
            filteredLogs = filteredLogs.filter(log => log.ts >= startDate);
        }
        if (endDate) {
            filteredLogs = filteredLogs.filter(log => log.ts <= endDate);
        }
        const total_actions = filteredLogs.length;
        const successful_actions = filteredLogs.filter(log => log.status === 'ok').length;
        const failed_actions = filteredLogs.filter(log => log.status === 'fail').length;
        const by_action = filteredLogs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});
        const by_target_type = filteredLogs.reduce((acc, log) => {
            acc[log.target_type] = (acc[log.target_type] || 0) + 1;
            return acc;
        }, {});
        const by_actor = filteredLogs.reduce((acc, log) => {
            acc[log.actor] = (acc[log.actor] || 0) + 1;
            return acc;
        }, {});
        return {
            total_actions,
            successful_actions,
            failed_actions,
            by_action,
            by_target_type,
            by_actor
        };
    }
    // ===== UTILITY METHODS =====
    async generateMockData(tenantId, sipDomain) {
        // Generate some mock CDRs
        const mockCdrs = [
            {
                tenant_id: tenantId,
                sip_domain: sipDomain,
                call_id: 'call-001',
                direction: 'inbound',
                from_uri: '+390686356924',
                to_uri: '1001',
                did_e164: '+390686356924',
                ext_number: '1001',
                start_ts: new Date(Date.now() - 3600000).toISOString(),
                answer_ts: new Date(Date.now() - 3595000).toISOString(),
                end_ts: new Date(Date.now() - 3000000).toISOString(),
                billsec: 600,
                disposition: 'ANSWERED',
                recording_url: 'https://recordings.example.com/call-001.wav',
                meta_json: { codec: 'G729', mos: 4.2 }
            },
            {
                tenant_id: tenantId,
                sip_domain: sipDomain,
                call_id: 'call-002',
                direction: 'outbound',
                from_uri: '1001',
                to_uri: '+39061234567',
                ext_number: '1001',
                start_ts: new Date(Date.now() - 1800000).toISOString(),
                end_ts: new Date(Date.now() - 1750000).toISOString(),
                billsec: 0,
                disposition: 'NO_ANSWER',
                meta_json: { codec: 'G729' }
            }
        ];
        for (const cdrData of mockCdrs) {
            await this.createCdr(cdrData);
        }
        // Generate some mock activity logs
        const mockLogs = [
            {
                actor: 'user:admin',
                action: 'create',
                target_type: 'trunk',
                target_id: 'trunk-001',
                status: 'ok',
                details_json: { provider: 'Messagenet', proxy: 'sip.messagenet.it' }
            },
            {
                actor: 'user:admin',
                action: 'create',
                target_type: 'ext',
                target_id: 'ext-001',
                status: 'ok',
                details_json: { ext_number: '1001', display_name: 'John Doe' }
            }
        ];
        for (const logData of mockLogs) {
            await this.createActivityLog({ tenant_id: tenantId, sip_domain: sipDomain }, logData);
        }
        console.log(`Generated mock data for tenant: ${tenantId}`);
    }
}
exports.CdrActivityService = CdrActivityService;
//# sourceMappingURL=cdr-activity-service.js.map