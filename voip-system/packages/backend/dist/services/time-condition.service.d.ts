export interface TimeCondition {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    timezone: string;
    conditions: Array<{
        day_of_week: number;
        start_time: string;
        end_time: string;
        is_active: boolean;
    }>;
    action_true: {
        type: 'extension' | 'voicemail' | 'queue' | 'ivr' | 'hangup';
        destination: string;
        timeout?: number;
    };
    action_false: {
        type: 'extension' | 'voicemail' | 'queue' | 'ivr' | 'hangup';
        destination: string;
        timeout?: number;
    };
    enabled: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare class TimeConditionService {
    private mapRowToTimeCondition;
    createTimeCondition(timeConditionData: Omit<TimeCondition, 'id' | 'created_at' | 'updated_at'>): Promise<TimeCondition>;
    getTimeConditionById(id: string, tenantId: string): Promise<TimeCondition | undefined>;
    listTimeConditions(tenantId: string): Promise<TimeCondition[]>;
    updateTimeCondition(id: string, tenantId: string, updateData: Partial<Omit<TimeCondition, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>): Promise<TimeCondition | undefined>;
    deleteTimeCondition(id: string, tenantId: string): Promise<boolean>;
    evaluateTimeCondition(id: string, tenantId: string): Promise<{
        condition: boolean;
        action: any;
    }>;
    validateTimeCondition(timeCondition: Partial<TimeCondition>): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    getActiveTimeConditions(tenantId: string): Promise<TimeCondition[]>;
}
//# sourceMappingURL=time-condition.service.d.ts.map