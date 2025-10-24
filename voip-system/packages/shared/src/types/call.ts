import { z } from 'zod';

// Active call schema
export const ActiveCallSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  store_id: z.string().uuid().optional(),
  call_uuid: z.string().uuid(),
  direction: z.enum(['inbound', 'outbound', 'internal']),
  state: z.enum(['ringing', 'answered', 'hold', 'transfer', 'conference']),
  caller_number: z.string().optional(),
  caller_name: z.string().optional(),
  callee_number: z.string().optional(),
  callee_name: z.string().optional(),
  start_time: z.date(),
  duration: z.number().min(0),
  recording_enabled: z.boolean().default(false),
  created_at: z.date()
});

export type ActiveCall = z.infer<typeof ActiveCallSchema>;

// Call control actions
export const CallActionSchema = z.object({
  action: z.enum(['answer', 'hangup', 'hold', 'unhold', 'transfer', 'conference', 'mute', 'unmute', 'record_start', 'record_stop']),
  call_uuid: z.string().uuid(),
  target_extension: z.string().optional(), // for transfer
  target_number: z.string().optional(), // for transfer
  conference_uuid: z.string().uuid().optional() // for conference
});

export type CallAction = z.infer<typeof CallActionSchema>;

