export interface InboundRoute {
    id?: string;
    tenant_id: string;
    store_id?: string;
    name: string;
    description?: string;
    did_number?: string;
    caller_id_pattern?: string;
    destination_type: string;
    destination_value: string;
    time_condition_id?: string;
    enabled: boolean;
    caller_id_override?: boolean;
    caller_id_name_override?: string;
    caller_id_number_override?: string;
    record_calls?: boolean;
    recording_path?: string;
    failover_enabled?: boolean;
    failover_destination_type?: string;
    failover_destination_value?: string;
}
export interface OutboundRoute {
    id?: string;
    tenant_id: string;
    store_id?: string;
    name: string;
    description?: string;
    dial_pattern: string;
    caller_id_name?: string;
    caller_id_number?: string;
    trunk_id: string;
    prefix?: string;
    strip_digits?: number;
    add_digits?: string;
    priority?: number;
    enabled: boolean;
    caller_id_override?: boolean;
    caller_id_name_override?: string;
    caller_id_number_override?: string;
    record_calls?: boolean;
    recording_path?: string;
    failover_trunk_id?: string;
}
export interface TimeCondition {
    id?: string;
    tenant_id: string;
    store_id?: string;
    name: string;
    description?: string;
    timezone: string;
    business_hours: any;
    holidays: any[];
    business_hours_action: string;
    business_hours_destination?: string;
    after_hours_action: string;
    after_hours_destination?: string;
    holiday_action: string;
    holiday_destination?: string;
    enabled: boolean;
}
export declare class RoutingService {
    createInboundRoute(route: Partial<InboundRoute>): Promise<InboundRoute>;
    getInboundRoutes(tenantId: string): Promise<InboundRoute[]>;
    getInboundRouteById(id: string): Promise<InboundRoute | null>;
    updateInboundRoute(id: string, updates: Partial<InboundRoute>): Promise<InboundRoute>;
    deleteInboundRoute(id: string): Promise<void>;
    createOutboundRoute(route: Partial<OutboundRoute>): Promise<OutboundRoute>;
    getOutboundRoutes(tenantId: string): Promise<OutboundRoute[]>;
    updateOutboundRoute(id: string, updates: Partial<OutboundRoute>): Promise<OutboundRoute>;
    deleteOutboundRoute(id: string): Promise<void>;
    createTimeCondition(condition: Partial<TimeCondition>): Promise<TimeCondition>;
    getTimeConditions(tenantId: string): Promise<TimeCondition[]>;
    updateTimeCondition(id: string, updates: Partial<TimeCondition>): Promise<TimeCondition>;
    deleteTimeCondition(id: string): Promise<void>;
    /**
     * Normalize phone number (remove +39, add prefixes, etc.)
     */
    normalizeCallerNumber(number: string, countryCode?: string): string;
    /**
     * Check if current time matches business hours
     */
    checkTimeMatch(condition: TimeCondition, date?: Date): 'business' | 'after_hours' | 'holiday';
}
//# sourceMappingURL=routing.service.d.ts.map