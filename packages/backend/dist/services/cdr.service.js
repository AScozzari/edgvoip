"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDRService = void 0;
// @ts-nocheck
const database_1 = require("@w3-voip/database");
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
class CDRService {
    // Create CDR record
    async createCDR(cdrData) {
        return (0, database_1.withTransaction)(async (client) => {
            // Verify tenant exists
            const tenantResult = await client.query('SELECT id FROM tenants WHERE id = $1', [cdrData.tenant_id]);
            if (tenantResult.rows.length === 0) {
                throw new Error('Tenant not found');
            }
            // Create CDR record
            const result = await client.query(`INSERT INTO cdr (
          id, tenant_id, store_id, extension_id, trunk_id, call_uuid, call_direction,
          call_type, caller_id_number, caller_id_name, caller_extension, callee_id_number,
          callee_id_name, callee_extension, start_time, answer_time, end_time, duration,
          bill_seconds, hangup_cause, hangup_disposition, audio_codec, video_codec,
          rtp_audio_in_mos, rtp_audio_out_mos, recording_enabled, recording_path,
          recording_duration, recording_consent, local_ip, remote_ip, local_port,
          remote_port, fs_uuid, fs_domain, fs_context, fs_profile, metadata, tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
          $35, $36, $37, $38, $39, $40
        ) RETURNING *`, [
                (0, uuid_1.v4)(),
                cdrData.tenant_id,
                cdrData.store_id || null,
                cdrData.extension_id || null,
                cdrData.trunk_id || null,
                cdrData.call_uuid,
                cdrData.call_direction,
                cdrData.call_type || 'voice',
                cdrData.caller_id_number || null,
                cdrData.caller_id_name || null,
                cdrData.caller_extension || null,
                cdrData.callee_id_number || null,
                cdrData.callee_id_name || null,
                cdrData.callee_extension || null,
                cdrData.start_time,
                cdrData.answer_time || null,
                cdrData.end_time,
                cdrData.duration,
                cdrData.bill_seconds,
                cdrData.hangup_cause,
                cdrData.hangup_disposition,
                cdrData.audio_codec || null,
                cdrData.video_codec || null,
                cdrData.rtp_audio_in_mos || null,
                cdrData.rtp_audio_out_mos || null,
                cdrData.recording_enabled,
                cdrData.recording_path || null,
                cdrData.recording_duration || null,
                cdrData.recording_consent || null,
                cdrData.local_ip || null,
                cdrData.remote_ip || null,
                cdrData.local_port || null,
                cdrData.remote_port || null,
                cdrData.fs_uuid,
                cdrData.fs_domain,
                cdrData.fs_context || null,
                cdrData.fs_profile || null,
                cdrData.metadata ? JSON.stringify(cdrData.metadata) : null,
                cdrData.tags || []
            ]);
            const cdr = result.rows[0];
            // Log CDR creation
            (0, logger_1.logCDREvent)('cdr_created', {
                id: cdr.id,
                tenant_id: cdr.tenant_id,
                call_uuid: cdr.call_uuid,
                direction: cdr.call_direction,
                duration: cdr.duration
            });
            return {
                ...cdr,
                metadata: cdr.metadata
            };
        });
    }
    // Update CDR record
    async updateCDR(cdrId, updates, tenantId) {
        return (0, database_1.withTransaction)(async (client) => {
            // Build update query
            const updateFields = [];
            const values = [];
            let paramCount = 1;
            if (updates.answer_time !== undefined) {
                updateFields.push(`answer_time = $${paramCount++}`);
                values.push(updates.answer_time);
            }
            if (updates.end_time !== undefined) {
                updateFields.push(`end_time = $${paramCount++}`);
                values.push(updates.end_time);
            }
            if (updates.duration !== undefined) {
                updateFields.push(`duration = $${paramCount++}`);
                values.push(updates.duration);
            }
            if (updates.bill_seconds !== undefined) {
                updateFields.push(`bill_seconds = $${paramCount++}`);
                values.push(updates.bill_seconds);
            }
            if (updates.hangup_cause !== undefined) {
                updateFields.push(`hangup_cause = $${paramCount++}`);
                values.push(updates.hangup_cause);
            }
            if (updates.hangup_disposition !== undefined) {
                updateFields.push(`hangup_disposition = $${paramCount++}`);
                values.push(updates.hangup_disposition);
            }
            if (updates.audio_codec !== undefined) {
                updateFields.push(`audio_codec = $${paramCount++}`);
                values.push(updates.audio_codec);
            }
            if (updates.video_codec !== undefined) {
                updateFields.push(`video_codec = $${paramCount++}`);
                values.push(updates.video_codec);
            }
            if (updates.rtp_audio_in_mos !== undefined) {
                updateFields.push(`rtp_audio_in_mos = $${paramCount++}`);
                values.push(updates.rtp_audio_in_mos);
            }
            if (updates.rtp_audio_out_mos !== undefined) {
                updateFields.push(`rtp_audio_out_mos = $${paramCount++}`);
                values.push(updates.rtp_audio_out_mos);
            }
            if (updates.recording_enabled !== undefined) {
                updateFields.push(`recording_enabled = $${paramCount++}`);
                values.push(updates.recording_enabled);
            }
            if (updates.recording_path !== undefined) {
                updateFields.push(`recording_path = $${paramCount++}`);
                values.push(updates.recording_path);
            }
            if (updates.recording_duration !== undefined) {
                updateFields.push(`recording_duration = $${paramCount++}`);
                values.push(updates.recording_duration);
            }
            if (updates.recording_consent !== undefined) {
                updateFields.push(`recording_consent = $${paramCount++}`);
                values.push(updates.recording_consent);
            }
            if (updates.metadata !== undefined) {
                updateFields.push(`metadata = $${paramCount++}`);
                values.push(updates.metadata ? JSON.stringify(updates.metadata) : null);
            }
            if (updates.tags !== undefined) {
                updateFields.push(`tags = $${paramCount++}`);
                values.push(updates.tags);
            }
            if (updateFields.length === 0) {
                throw new Error('No fields to update');
            }
            values.push(cdrId);
            let query = `UPDATE cdr SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`;
            if (tenantId) {
                query += ` AND tenant_id = $${paramCount + 1}`;
                values.push(tenantId);
            }
            query += ' RETURNING *';
            const result = await client.query(query, values);
            if (result.rows.length === 0) {
                throw new Error('CDR not found');
            }
            const cdr = result.rows[0];
            // Log CDR update
            (0, logger_1.logCDREvent)('cdr_updated', {
                id: cdr.id,
                tenant_id: cdr.tenant_id,
                call_uuid: cdr.call_uuid,
                updates: updateFields
            });
            return {
                ...cdr,
                metadata: cdr.metadata
            };
        });
    }
    // Get CDR by ID
    async getCDRById(cdrId, tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            let query = 'SELECT * FROM cdr WHERE id = $1';
            let params = [cdrId];
            if (tenantId) {
                query += ' AND tenant_id = $2';
                params.push(tenantId);
            }
            const result = await client.query(query, params);
            if (result.rows.length === 0) {
                return null;
            }
            const cdr = result.rows[0];
            return {
                ...cdr,
                metadata: cdr.metadata
            };
        }
        finally {
            await client.release();
        }
    }
    // Get CDR by call UUID
    async getCDRByCallUuid(callUuid, tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            let query = 'SELECT * FROM cdr WHERE call_uuid = $1';
            let params = [callUuid];
            if (tenantId) {
                query += ' AND tenant_id = $2';
                params.push(tenantId);
            }
            const result = await client.query(query, params);
            if (result.rows.length === 0) {
                return null;
            }
            const cdr = result.rows[0];
            return {
                ...cdr,
                metadata: cdr.metadata
            };
        }
        finally {
            await client.release();
        }
    }
    // List CDR records with filters
    async listCDR(filter) {
        const client = await (0, database_1.getClient)();
        try {
            const offset = (filter.page - 1) * filter.limit;
            // Build WHERE clause
            const whereConditions = [];
            const queryParams = [];
            let paramCount = 1;
            if (filter.tenant_id) {
                whereConditions.push(`tenant_id = $${paramCount++}`);
                queryParams.push(filter.tenant_id);
            }
            if (filter.store_id) {
                whereConditions.push(`store_id = $${paramCount++}`);
                queryParams.push(filter.store_id);
            }
            if (filter.extension_id) {
                whereConditions.push(`extension_id = $${paramCount++}`);
                queryParams.push(filter.extension_id);
            }
            if (filter.trunk_id) {
                whereConditions.push(`trunk_id = $${paramCount++}`);
                queryParams.push(filter.trunk_id);
            }
            if (filter.start_date) {
                whereConditions.push(`start_time >= $${paramCount++}`);
                queryParams.push(filter.start_date);
            }
            if (filter.end_date) {
                whereConditions.push(`start_time <= $${paramCount++}`);
                queryParams.push(filter.end_date);
            }
            if (filter.call_direction) {
                whereConditions.push(`call_direction = $${paramCount++}`);
                queryParams.push(filter.call_direction);
            }
            if (filter.call_type) {
                whereConditions.push(`call_type = $${paramCount++}`);
                queryParams.push(filter.call_type);
            }
            if (filter.hangup_disposition) {
                whereConditions.push(`hangup_disposition = $${paramCount++}`);
                queryParams.push(filter.hangup_disposition);
            }
            if (filter.caller_number) {
                whereConditions.push(`(caller_id_number ILIKE $${paramCount} OR caller_extension ILIKE $${paramCount})`);
                queryParams.push(`%${filter.caller_number}%`);
                paramCount++;
            }
            if (filter.callee_number) {
                whereConditions.push(`(callee_id_number ILIKE $${paramCount} OR callee_extension ILIKE $${paramCount})`);
                queryParams.push(`%${filter.callee_number}%`);
                paramCount++;
            }
            if (filter.min_duration !== undefined) {
                whereConditions.push(`duration >= $${paramCount++}`);
                queryParams.push(filter.min_duration);
            }
            if (filter.max_duration !== undefined) {
                whereConditions.push(`duration <= $${paramCount++}`);
                queryParams.push(filter.max_duration);
            }
            if (filter.recording_enabled !== undefined) {
                whereConditions.push(`recording_enabled = $${paramCount++}`);
                queryParams.push(filter.recording_enabled);
            }
            if (filter.recording_consent !== undefined) {
                whereConditions.push(`recording_consent = $${paramCount++}`);
                queryParams.push(filter.recording_consent);
            }
            if (filter.min_mos !== undefined) {
                whereConditions.push(`(rtp_audio_in_mos >= $${paramCount} OR rtp_audio_out_mos >= $${paramCount})`);
                queryParams.push(filter.min_mos);
                paramCount++;
            }
            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
            // Get total count
            const countResult = await client.query(`SELECT COUNT(*) FROM cdr ${whereClause}`, queryParams);
            const total = parseInt(countResult.rows[0].count);
            // Get CDR records
            const sortOrder = filter.sort_order === 'asc' ? 'ASC' : 'DESC';
            const sortField = filter.sort_by === 'start_time' ? 'start_time' :
                filter.sort_by === 'duration' ? 'duration' :
                    filter.sort_by === 'caller_number' ? 'caller_id_number' :
                        filter.sort_by === 'callee_number' ? 'callee_id_number' : 'start_time';
            const result = await client.query(`SELECT * FROM cdr ${whereClause}
         ORDER BY ${sortField} ${sortOrder}
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`, [...queryParams, filter.limit, offset]);
            const cdr = result.rows.map(row => ({
                ...row,
                metadata: row.metadata
            }));
            return {
                cdr,
                total,
                totalPages: Math.ceil(total / filter.limit)
            };
        }
        finally {
            await client.release();
        }
    }
    // Get CDR statistics
    async getCDRStats(filter) {
        const client = await (0, database_1.getClient)();
        try {
            // Build WHERE clause (same as listCDR)
            const whereConditions = [];
            const queryParams = [];
            let paramCount = 1;
            if (filter.tenant_id) {
                whereConditions.push(`tenant_id = $${paramCount++}`);
                queryParams.push(filter.tenant_id);
            }
            if (filter.store_id) {
                whereConditions.push(`store_id = $${paramCount++}`);
                queryParams.push(filter.store_id);
            }
            if (filter.extension_id) {
                whereConditions.push(`extension_id = $${paramCount++}`);
                queryParams.push(filter.extension_id);
            }
            if (filter.trunk_id) {
                whereConditions.push(`trunk_id = $${paramCount++}`);
                queryParams.push(filter.trunk_id);
            }
            if (filter.start_date) {
                whereConditions.push(`start_time >= $${paramCount++}`);
                queryParams.push(filter.start_date);
            }
            if (filter.end_date) {
                whereConditions.push(`start_time <= $${paramCount++}`);
                queryParams.push(filter.end_date);
            }
            if (filter.call_direction) {
                whereConditions.push(`call_direction = $${paramCount++}`);
                queryParams.push(filter.call_direction);
            }
            if (filter.call_type) {
                whereConditions.push(`call_type = $${paramCount++}`);
                queryParams.push(filter.call_type);
            }
            if (filter.hangup_disposition) {
                whereConditions.push(`hangup_disposition = $${paramCount++}`);
                queryParams.push(filter.hangup_disposition);
            }
            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
            const result = await client.query(`SELECT 
           COUNT(*) as total_calls,
           COUNT(CASE WHEN hangup_disposition = 'answered' THEN 1 END) as answered_calls,
           COUNT(CASE WHEN hangup_disposition IN ('no_answer', 'busy') THEN 1 END) as missed_calls,
           COALESCE(SUM(duration), 0) as total_duration,
           COALESCE(AVG(duration), 0) as average_duration,
           COUNT(CASE WHEN call_direction = 'inbound' THEN 1 END) as inbound_calls,
           COUNT(CASE WHEN call_direction = 'outbound' THEN 1 END) as outbound_calls,
           COUNT(CASE WHEN call_direction = 'internal' THEN 1 END) as internal_calls,
           COALESCE(AVG(rtp_audio_in_mos), 0) as average_mos,
           MIN(start_time) as period_start,
           MAX(start_time) as period_end
         FROM cdr ${whereClause}`, queryParams);
            const stats = result.rows[0];
            // Get disposition statistics
            const dispositionResult = await client.query(`SELECT hangup_disposition, COUNT(*) as count
         FROM cdr ${whereClause}
         GROUP BY hangup_disposition`, queryParams);
            const dispositionStats = {};
            dispositionResult.rows.forEach(row => {
                dispositionStats[row.hangup_disposition] = parseInt(row.count);
            });
            return {
                total_calls: parseInt(stats.total_calls),
                answered_calls: parseInt(stats.answered_calls),
                missed_calls: parseInt(stats.missed_calls),
                total_duration: parseInt(stats.total_duration),
                average_duration: parseFloat(stats.average_duration),
                inbound_calls: parseInt(stats.inbound_calls),
                outbound_calls: parseInt(stats.outbound_calls),
                internal_calls: parseInt(stats.internal_calls),
                disposition_stats: dispositionStats,
                average_mos: parseFloat(stats.average_mos) || undefined,
                period_start: stats.period_start,
                period_end: stats.period_end,
                tenant_id: filter.tenant_id
            };
        }
        finally {
            await client.release();
        }
    }
    // Delete CDR records (for GDPR compliance)
    async deleteCDR(cdrId, tenantId) {
        return (0, database_1.withTransaction)(async (client) => {
            let query = 'DELETE FROM cdr WHERE id = $1';
            let params = [cdrId];
            if (tenantId) {
                query += ' AND tenant_id = $2';
                params.push(tenantId);
            }
            const result = await client.query(query, params);
            if (result.rowCount === 0) {
                throw new Error('CDR not found');
            }
            // Log CDR deletion
            (0, logger_1.logCDREvent)('cdr_deleted', {
                id: cdrId,
                tenant_id: tenantId
            });
        });
    }
    // Anonymize CDR records (for GDPR compliance)
    async anonymizeCDR(cdrId, tenantId) {
        return (0, database_1.withTransaction)(async (client) => {
            const updateFields = [
                'caller_id_number = $1',
                'caller_id_name = $1',
                'callee_id_number = $1',
                'callee_id_name = $1',
                'recording_path = NULL',
                'metadata = NULL'
            ];
            let query = `UPDATE cdr SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $2`;
            let params = ['ANONYMIZED', cdrId];
            if (tenantId) {
                query += ' AND tenant_id = $3';
                params.push(tenantId);
            }
            const result = await client.query(query, params);
            if (result.rowCount === 0) {
                throw new Error('CDR not found');
            }
            // Log CDR anonymization
            (0, logger_1.logCDREvent)('cdr_anonymized', {
                id: cdrId,
                tenant_id: tenantId
            });
        });
    }
}
exports.CDRService = CDRService;
//# sourceMappingURL=cdr.service.js.map