export interface InboundRoute {
    id: string;
    tenant_id: string;
    store_id?: string;
    name: string;
    description?: string;
    did_number?: string;
    caller_id_pattern?: string;
    destination_type: 'extension' | 'ring_group' | 'queue' | 'ivr' | 'conference' | 'voicemail';
    destination_id?: string;
    destination_data?: any;
    time_condition_id?: string;
    priority: number;
    enabled: boolean;
    failover_destination_type?: string;
    failover_destination_id?: string;
    failover_destination_data?: any;
    settings?: any;
    created_at: Date;
    updated_at: Date;
}
export interface OutboundRoute {
    id: string;
    tenant_id: string;
    store_id?: string;
    name: string;
    description?: string;
    pattern: string;
    caller_id_prefix?: string;
    caller_id_number?: string;
    trunk_priority: string[];
    least_cost_routing: boolean;
    time_condition_id?: string;
    priority: number;
    enabled: boolean;
    settings?: any;
    created_at: Date;
    updated_at: Date;
}
export interface TimeCondition {
    id: string;
    tenant_id: string;
    store_id?: string;
    name: string;
    description?: string;
    time_groups: Array<{
        days: number[];
        start_time: string;
        end_time: string;
        timezone: string;
    }>;
    holidays: Array<{
        date: string;
        name: string;
        type: 'holiday' | 'special_day';
    }>;
    timezone: string;
    match_destination_type: string;
    match_destination_id?: string;
    match_destination_data?: any;
    nomatch_destination_type: string;
    nomatch_destination_id?: string;
    nomatch_destination_data?: any;
    enabled: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface DialplanContext {
    id: string;
    tenant_id: string;
    store_id?: string;
    name: string;
    description?: string;
    context_type: 'internal' | 'external' | 'public' | 'private';
    variables: any;
    conditions: Array<{
        condition: string;
        expression: string;
        actions: Array<{
            application: string;
            data: string;
        }>;
    }>;
    enabled: boolean;
    priority: number;
    created_at: Date;
    updated_at: Date;
}
export declare class DialplanGeneratorService {
    private configPath;
    constructor();
    generateCompleteDialplan(tenantId: string): Promise<string>;
    private generateInboundRouteXML;
    private generateOutboundRouteXML;
    private generateDialplanContextXML;
    private generateTimeConditionXML;
    private generateDestinationAction;
    private generateTrunkRoutingXML;
    private escapeRegex;
    getInboundRoutes(tenantId: string): Promise<InboundRoute[]>;
    getOutboundRoutes(tenantId: string): Promise<OutboundRoute[]>;
    getTimeConditions(tenantId: string): Promise<TimeCondition[]>;
    getDialplanContexts(tenantId: string): Promise<DialplanContext[]>;
    syncDialplanToFreeSWITCH(tenantId: string): Promise<void>;
}
export declare const dialplanGeneratorService: DialplanGeneratorService;
//# sourceMappingURL=dialplan-generator.service.d.ts.map