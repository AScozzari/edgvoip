import { z } from 'zod';
export declare const ActiveCallSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    store_id: z.ZodOptional<z.ZodString>;
    call_uuid: z.ZodString;
    direction: z.ZodEnum<["inbound", "outbound", "internal"]>;
    state: z.ZodEnum<["ringing", "answered", "hold", "transfer", "conference"]>;
    caller_number: z.ZodOptional<z.ZodString>;
    caller_name: z.ZodOptional<z.ZodString>;
    callee_number: z.ZodOptional<z.ZodString>;
    callee_name: z.ZodOptional<z.ZodString>;
    start_time: z.ZodDate;
    duration: z.ZodNumber;
    recording_enabled: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: Date;
    recording_enabled: boolean;
    tenant_id: string;
    call_uuid: string;
    start_time: Date;
    duration: number;
    direction: "inbound" | "outbound" | "internal";
    state: "conference" | "answered" | "ringing" | "hold" | "transfer";
    store_id?: string | undefined;
    caller_number?: string | undefined;
    callee_number?: string | undefined;
    caller_name?: string | undefined;
    callee_name?: string | undefined;
}, {
    id: string;
    created_at: Date;
    tenant_id: string;
    call_uuid: string;
    start_time: Date;
    duration: number;
    direction: "inbound" | "outbound" | "internal";
    state: "conference" | "answered" | "ringing" | "hold" | "transfer";
    recording_enabled?: boolean | undefined;
    store_id?: string | undefined;
    caller_number?: string | undefined;
    callee_number?: string | undefined;
    caller_name?: string | undefined;
    callee_name?: string | undefined;
}>;
export type ActiveCall = z.infer<typeof ActiveCallSchema>;
export declare const CallActionSchema: z.ZodObject<{
    action: z.ZodEnum<["answer", "hangup", "hold", "unhold", "transfer", "conference", "mute", "unmute", "record_start", "record_stop"]>;
    call_uuid: z.ZodString;
    target_extension: z.ZodOptional<z.ZodString>;
    target_number: z.ZodOptional<z.ZodString>;
    conference_uuid: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    call_uuid: string;
    action: "conference" | "hold" | "transfer" | "answer" | "hangup" | "unhold" | "mute" | "unmute" | "record_start" | "record_stop";
    target_extension?: string | undefined;
    target_number?: string | undefined;
    conference_uuid?: string | undefined;
}, {
    call_uuid: string;
    action: "conference" | "hold" | "transfer" | "answer" | "hangup" | "unhold" | "mute" | "unmute" | "record_start" | "record_stop";
    target_extension?: string | undefined;
    target_number?: string | undefined;
    conference_uuid?: string | undefined;
}>;
export type CallAction = z.infer<typeof CallActionSchema>;
//# sourceMappingURL=call.d.ts.map