import { z } from 'zod';

// Call Detail Record schema
export const CDRSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  extension_id: z.string().uuid().optional(),
  trunk_id: z.string().uuid().optional(),
  
  // Call identification
  call_uuid: z.string().uuid(),
  call_direction: z.enum(['inbound', 'outbound', 'internal']),
  call_type: z.enum(['voice', 'video', 'fax']),
  
  // Caller information
  caller_id_number: z.string().optional(),
  caller_id_name: z.string().optional(),
  caller_extension: z.string().optional(),
  
  // Callee information
  callee_id_number: z.string().optional(),
  callee_id_name: z.string().optional(),
  callee_extension: z.string().optional(),
  
  // Call details
  start_time: z.date(),
  answer_time: z.date().optional(),
  end_time: z.date(),
  duration: z.number().min(0), // seconds
  bill_seconds: z.number().min(0), // billable seconds
  hangup_cause: z.string(),
  hangup_disposition: z.enum(['answered', 'busy', 'no_answer', 'congestion', 'fail', 'timeout']),
  
  // Media information
  audio_codec: z.string().optional(),
  video_codec: z.string().optional(),
  rtp_audio_in_mos: z.number().min(1).max(5).optional(), // Mean Opinion Score
  rtp_audio_out_mos: z.number().min(1).max(5).optional(),
  
  // Recording
  recording_enabled: z.boolean().default(false),
  recording_path: z.string().optional(),
  recording_duration: z.number().min(0).optional(),
  recording_consent: z.boolean().optional(),
  
  // Network information
  local_ip: z.string().optional(),
  remote_ip: z.string().optional(),
  local_port: z.number().optional(),
  remote_port: z.number().optional(),
  
  // FreeSWITCH specific
  fs_uuid: z.string().uuid(),
  fs_domain: z.string(),
  fs_context: z.string().optional(),
  fs_profile: z.string().optional(),
  
  // Metadata
  metadata: z.record(z.string()).optional(),
  tags: z.array(z.string()).default([]),
  
  // Timestamps
  created_at: z.date(),
  updated_at: z.date()
});

export type CDR = z.infer<typeof CDRSchema>;

// CDR filter schema for queries
export const CDRFilterSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  store_id: z.string().uuid().optional(),
  extension_id: z.string().uuid().optional(),
  trunk_id: z.string().uuid().optional(),
  
  // Date range
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  
  // Call filters
  call_direction: z.enum(['inbound', 'outbound', 'internal']).optional(),
  call_type: z.enum(['voice', 'video', 'fax']).optional(),
  hangup_disposition: z.enum(['answered', 'busy', 'no_answer', 'congestion', 'fail', 'timeout']).optional(),
  
  // Number filters
  caller_number: z.string().optional(),
  callee_number: z.string().optional(),
  
  // Duration filters
  min_duration: z.number().min(0).optional(),
  max_duration: z.number().min(0).optional(),
  
  // Recording filters
  recording_enabled: z.boolean().optional(),
  recording_consent: z.boolean().optional(),
  
  // Quality filters
  min_mos: z.number().min(1).max(5).optional(),
  
  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(1000).default(50),
  
  // Sorting
  sort_by: z.enum(['start_time', 'duration', 'caller_number', 'callee_number']).default('start_time'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type CDRFilter = z.infer<typeof CDRFilterSchema>;

// CDR statistics schema
export const CDRStatsSchema = z.object({
  total_calls: z.number().min(0),
  answered_calls: z.number().min(0),
  missed_calls: z.number().min(0),
  total_duration: z.number().min(0), // seconds
  average_duration: z.number().min(0), // seconds
  total_cost: z.number().min(0).optional(), // if billing enabled
  
  // By direction
  inbound_calls: z.number().min(0),
  outbound_calls: z.number().min(0),
  internal_calls: z.number().min(0),
  
  // By disposition
  disposition_stats: z.record(z.number().min(0)),
  
  // Quality metrics
  average_mos: z.number().min(1).max(5).optional(),
  
  // Time period
  period_start: z.date(),
  period_end: z.date(),
  
  // Tenant isolation
  tenant_id: z.string().uuid()
});

export type CDRStats = z.infer<typeof CDRStatsSchema>;

