"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallActionSchema = exports.ActiveCallSchema = void 0;
const zod_1 = require("zod");
// Active call schema
exports.ActiveCallSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    store_id: zod_1.z.string().uuid().optional(),
    call_uuid: zod_1.z.string().uuid(),
    direction: zod_1.z.enum(['inbound', 'outbound', 'internal']),
    state: zod_1.z.enum(['ringing', 'answered', 'hold', 'transfer', 'conference']),
    caller_number: zod_1.z.string().optional(),
    caller_name: zod_1.z.string().optional(),
    callee_number: zod_1.z.string().optional(),
    callee_name: zod_1.z.string().optional(),
    start_time: zod_1.z.date(),
    duration: zod_1.z.number().min(0),
    recording_enabled: zod_1.z.boolean().default(false),
    created_at: zod_1.z.date()
});
// Call control actions
exports.CallActionSchema = zod_1.z.object({
    action: zod_1.z.enum(['answer', 'hangup', 'hold', 'unhold', 'transfer', 'conference', 'mute', 'unmute', 'record_start', 'record_stop']),
    call_uuid: zod_1.z.string().uuid(),
    target_extension: zod_1.z.string().optional(), // for transfer
    target_number: zod_1.z.string().optional(), // for transfer
    conference_uuid: zod_1.z.string().uuid().optional() // for conference
});
//# sourceMappingURL=call.js.map