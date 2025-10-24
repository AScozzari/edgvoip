"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDRStatsSchema = exports.CDRFilterSchema = exports.CDRSchema = void 0;
const zod_1 = require("zod");
// Call Detail Record schema
exports.CDRSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    extension_id: zod_1.z.string().uuid().optional(),
    trunk_id: zod_1.z.string().uuid().optional(),
    // Call identification
    call_uuid: zod_1.z.string().uuid(),
    call_direction: zod_1.z.enum(['inbound', 'outbound', 'internal']),
    call_type: zod_1.z.enum(['voice', 'video', 'fax']),
    // Caller information
    caller_id_number: zod_1.z.string().optional(),
    caller_id_name: zod_1.z.string().optional(),
    caller_extension: zod_1.z.string().optional(),
    // Callee information
    callee_id_number: zod_1.z.string().optional(),
    callee_id_name: zod_1.z.string().optional(),
    callee_extension: zod_1.z.string().optional(),
    // Call details
    start_time: zod_1.z.date(),
    answer_time: zod_1.z.date().optional(),
    end_time: zod_1.z.date(),
    duration: zod_1.z.number().min(0), // seconds
    bill_seconds: zod_1.z.number().min(0), // billable seconds
    hangup_cause: zod_1.z.string(),
    hangup_disposition: zod_1.z.enum(['answered', 'busy', 'no_answer', 'congestion', 'fail', 'timeout']),
    // Media information
    audio_codec: zod_1.z.string().optional(),
    video_codec: zod_1.z.string().optional(),
    rtp_audio_in_mos: zod_1.z.number().min(1).max(5).optional(), // Mean Opinion Score
    rtp_audio_out_mos: zod_1.z.number().min(1).max(5).optional(),
    // Recording
    recording_enabled: zod_1.z.boolean().default(false),
    recording_path: zod_1.z.string().optional(),
    recording_duration: zod_1.z.number().min(0).optional(),
    recording_consent: zod_1.z.boolean().optional(),
    // Network information
    local_ip: zod_1.z.string().optional(),
    remote_ip: zod_1.z.string().optional(),
    local_port: zod_1.z.number().optional(),
    remote_port: zod_1.z.number().optional(),
    // FreeSWITCH specific
    fs_uuid: zod_1.z.string().uuid(),
    fs_domain: zod_1.z.string(),
    fs_context: zod_1.z.string().optional(),
    fs_profile: zod_1.z.string().optional(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    // Timestamps
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date()
});
// CDR filter schema for queries
exports.CDRFilterSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().uuid().optional(),
    store_id: zod_1.z.string().uuid().optional(),
    extension_id: zod_1.z.string().uuid().optional(),
    trunk_id: zod_1.z.string().uuid().optional(),
    // Date range
    start_date: zod_1.z.date().optional(),
    end_date: zod_1.z.date().optional(),
    // Call filters
    call_direction: zod_1.z.enum(['inbound', 'outbound', 'internal']).optional(),
    call_type: zod_1.z.enum(['voice', 'video', 'fax']).optional(),
    hangup_disposition: zod_1.z.enum(['answered', 'busy', 'no_answer', 'congestion', 'fail', 'timeout']).optional(),
    // Number filters
    caller_number: zod_1.z.string().optional(),
    callee_number: zod_1.z.string().optional(),
    // Duration filters
    min_duration: zod_1.z.number().min(0).optional(),
    max_duration: zod_1.z.number().min(0).optional(),
    // Recording filters
    recording_enabled: zod_1.z.boolean().optional(),
    recording_consent: zod_1.z.boolean().optional(),
    // Quality filters
    min_mos: zod_1.z.number().min(1).max(5).optional(),
    // Pagination
    page: zod_1.z.number().min(1).default(1),
    limit: zod_1.z.number().min(1).max(1000).default(50),
    // Sorting
    sort_by: zod_1.z.enum(['start_time', 'duration', 'caller_number', 'callee_number']).default('start_time'),
    sort_order: zod_1.z.enum(['asc', 'desc']).default('desc')
});
// CDR statistics schema
exports.CDRStatsSchema = zod_1.z.object({
    total_calls: zod_1.z.number().min(0),
    answered_calls: zod_1.z.number().min(0),
    missed_calls: zod_1.z.number().min(0),
    total_duration: zod_1.z.number().min(0), // seconds
    average_duration: zod_1.z.number().min(0), // seconds
    total_cost: zod_1.z.number().min(0).optional(), // if billing enabled
    // By direction
    inbound_calls: zod_1.z.number().min(0),
    outbound_calls: zod_1.z.number().min(0),
    internal_calls: zod_1.z.number().min(0),
    // By disposition
    disposition_stats: zod_1.z.record(zod_1.z.number().min(0)),
    // Quality metrics
    average_mos: zod_1.z.number().min(1).max(5).optional(),
    // Time period
    period_start: zod_1.z.date(),
    period_end: zod_1.z.date(),
    // Tenant isolation
    tenant_id: zod_1.z.string().uuid()
});
//# sourceMappingURL=cdr.js.map