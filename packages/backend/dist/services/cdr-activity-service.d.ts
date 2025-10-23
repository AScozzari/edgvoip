export interface VoipCdr {
    id: string;
    tenant_id: string;
    store_id?: string;
    extension_id?: string;
    trunk_id?: string;
    call_uuid: string;
    direction: 'inbound' | 'outbound' | 'internal';
    caller_id: string;
    called_id: string;
    start_time: Date;
    answer_time?: Date;
    end_time?: Date;
    duration: number;
    bill_seconds: number;
    disposition: 'ANSWERED' | 'NO_ANSWER' | 'BUSY' | 'FAILED';
    hangup_cause: string;
    recording_path?: string;
    created_at: Date;
}
export interface VoipActivityLog {
    id: string;
    tenant_id: string;
    store_id?: string;
    extension_id?: string;
    trunk_id?: string;
    action: string;
    details: any;
    timestamp: Date;
    created_at: Date;
}
export interface TenantContext {
    tenant_id: string;
    sip_domain: string;
    store_id?: string;
}
export interface CdrFilters {
    tenant_id: string;
    store_id?: string;
    start_date?: string;
    end_date?: string;
    direction?: 'in' | 'out';
    disposition?: 'ANSWERED' | 'NO_ANSWER' | 'BUSY' | 'FAILED';
    ext_number?: string;
    did_e164?: string;
    limit?: number;
    offset?: number;
}
export interface ActivityLogFilters {
    tenant_id: string;
    actor?: string;
    action?: 'create' | 'update' | 'delete' | 'provision' | 'sync';
    target_type?: 'trunk' | 'did' | 'ext' | 'route' | 'policy';
    target_id?: string;
    status?: 'ok' | 'fail';
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}
export declare class CdrActivityService {
    private mockCdrs;
    private mockActivityLogs;
    createCdr(cdrData: Partial<VoipCdr>): Promise<VoipCdr>;
    getCdrs(filters: CdrFilters): Promise<{
        cdrs: VoipCdr[];
        total: number;
    }>;
    getCdrById(cdrId: string, tenantId: string): Promise<VoipCdr | null>;
    getCdrStats(tenantId: string, storeId?: string, startDate?: string, endDate?: string): Promise<{
        total_calls: number;
        answered_calls: number;
        missed_calls: number;
        total_duration: number;
        avg_duration: number;
        by_direction: {
            inbound: number;
            outbound: number;
        };
        by_disposition: Record<string, number>;
    }>;
    createActivityLog(tenantContext: TenantContext, logData: {
        actor: string;
        action: 'create' | 'update' | 'delete' | 'provision' | 'sync';
        target_type: 'trunk' | 'did' | 'ext' | 'route' | 'policy';
        target_id: string;
        status: 'ok' | 'fail';
        details_json?: any;
    }): Promise<VoipActivityLog>;
    getActivityLogs(filters: ActivityLogFilters): Promise<{
        logs: VoipActivityLog[];
        total: number;
    }>;
    getActivityLogById(logId: string, tenantId: string): Promise<VoipActivityLog | null>;
    getActivityStats(tenantId: string, startDate?: string, endDate?: string): Promise<{
        total_actions: number;
        successful_actions: number;
        failed_actions: number;
        by_action: Record<string, number>;
        by_target_type: Record<string, number>;
        by_actor: Record<string, number>;
    }>;
    generateMockData(tenantId: string, sipDomain: string): Promise<void>;
}
//# sourceMappingURL=cdr-activity-service.d.ts.map