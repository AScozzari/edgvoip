export interface DialplanRule {
    id?: string;
    tenant_id: string;
    context: string;
    name: string;
    description?: string;
    priority: number;
    match_pattern: string;
    match_condition?: any;
    actions: any[];
    enabled: boolean;
    created_at?: Date;
    updated_at?: Date;
}
export declare class DialplanRulesService {
    /**
     * Create default dialplan rules for a specific context
     */
    createDefaultRulesForContext(tenantId: string, context: string): Promise<void>;
    /**
     * Create a single dialplan rule
     */
    createRule(rule: Partial<DialplanRule>): Promise<DialplanRule>;
    /**
     * Get all rules for a specific context
     */
    getRulesByContext(tenantId: string, context: string): Promise<DialplanRule[]>;
    /**
     * Get all rules for a tenant
     */
    getRulesByTenant(tenantId: string): Promise<DialplanRule[]>;
    /**
     * Update a dialplan rule
     */
    updateRule(ruleId: string, updates: Partial<DialplanRule>): Promise<DialplanRule>;
    /**
     * Delete a dialplan rule
     */
    deleteRule(ruleId: string): Promise<void>;
    /**
     * Validate a regex pattern
     */
    validatePattern(pattern: string): boolean;
    /**
     * Test if a number matches a rule's pattern
     */
    testRule(rule: DialplanRule, number: string): boolean;
    /**
     * Test a pattern against a number
     */
    testPattern(pattern: string, number: string): {
        match: boolean;
        groups?: string[];
    };
}
//# sourceMappingURL=dialplan-rules.service.d.ts.map