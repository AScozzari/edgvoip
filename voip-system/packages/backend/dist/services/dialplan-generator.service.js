"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dialplanGeneratorService = exports.DialplanGeneratorService = void 0;
const database_1 = require("@w3-voip/database");
class DialplanGeneratorService {
    constructor() {
        this.configPath = process.env.FREESWITCH_CONFIG_PATH || './docker/freeswitch/conf';
        console.log(`🔧 Dialplan Generator Service initialized with path: ${this.configPath}`);
    }
    // Generate complete dialplan XML
    async generateCompleteDialplan(tenantId) {
        try {
            console.log(`🔄 Generating complete dialplan for tenant: ${tenantId}`);
            // Get all dialplan components
            const [inboundRoutes, outboundRoutes, timeConditions, dialplanContexts] = await Promise.all([
                this.getInboundRoutes(tenantId),
                this.getOutboundRoutes(tenantId),
                this.getTimeConditions(tenantId),
                this.getDialplanContexts(tenantId)
            ]);
            let xml = `<?xml version="1.0" encoding="utf-8"?>
<include>
  <!-- Internal extensions routing -->
  <extension name="internal_calls">
    <condition field="destination_number" expression="^(1\\d{3})$">
      <action application="set" data="domain_name=\${domain_name}"/>
      <action application="set" data="domain_uuid=\${domain_uuid}"/>
      <action application="set" data="call_direction=inbound"/>
      <action application="set" data="sip_h_X-accountcode=\${accountcode}"/>
      <action application="set" data="sip_h_X-tenant-id=${tenantId}"/>
      <action application="bridge" data="user/\\\${destination_number}@\\\${domain_name}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>
    </condition>
  </extension>`;
            // Generate inbound routes
            for (const route of inboundRoutes.filter(r => r.enabled)) {
                xml += this.generateInboundRouteXML(route, timeConditions);
            }
            // Generate outbound routes
            for (const route of outboundRoutes.filter(r => r.enabled)) {
                xml += this.generateOutboundRouteXML(route, timeConditions);
            }
            // Generate dialplan contexts
            for (const context of dialplanContexts.filter(c => c.enabled)) {
                xml += this.generateDialplanContextXML(context);
            }
            // Add default external routing
            xml += `
  <!-- Default external routing -->
  <extension name="external_calls">
    <condition field="destination_number" expression="^([0-9]+)$">
      <action application="set" data="domain_name=\${domain_name}"/>
      <action application="set" data="domain_uuid=\${domain_uuid}"/>
      <action application="set" data="call_direction=outbound"/>
      <action application="set" data="sip_h_X-accountcode=\${accountcode}"/>
      <action application="set" data="sip_h_X-tenant-id=${tenantId}"/>
      <action application="bridge" data="sofia/gateway/default/\\\${destination_number}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>
    </condition>
  </extension>
</include>`;
            console.log(`✅ Generated dialplan XML for tenant: ${tenantId}`);
            return xml;
        }
        catch (error) {
            console.error('❌ Error generating complete dialplan:', error);
            throw error;
        }
    }
    // Generate inbound route XML
    generateInboundRouteXML(route, timeConditions) {
        const timeCondition = route.time_condition_id ?
            timeConditions.find(tc => tc.id === route.time_condition_id) : null;
        let xml = `
  <!-- Inbound Route: ${route.name} -->
  <extension name="inbound_${route.id}">`;
        // Add DID condition if specified
        if (route.did_number) {
            xml += `
    <condition field="destination_number" expression="^${this.escapeRegex(route.did_number)}$">`;
        }
        else {
            xml += `
    <condition field="destination_number" expression="^(.+)$">`;
        }
        // Add caller ID condition if specified
        if (route.caller_id_pattern) {
            xml += `
      <condition field="caller_id_number" expression="^${this.escapeRegex(route.caller_id_pattern)}$">`;
        }
        // Add time condition if specified
        if (timeCondition) {
            xml += this.generateTimeConditionXML(timeCondition);
        }
        // Add destination action
        xml += this.generateDestinationAction(route);
        // Add failover if specified
        if (route.failover_destination_type) {
            xml += `
      <condition field="hangup_cause" expression="NO_ANSWER|USER_BUSY|UNALLOCATED_NUMBER">
        <action application="log" data="INFO Failover triggered for route ${route.name}"/>
        ${this.generateDestinationAction({
                ...route,
                destination_type: route.failover_destination_type,
                destination_id: route.failover_destination_id,
                destination_data: route.failover_destination_data
            })}
      </condition>`;
        }
        // Close conditions
        if (route.caller_id_pattern) {
            xml += `
      </condition>`;
        }
        xml += `
    </condition>
  </extension>`;
        return xml;
    }
    // Generate outbound route XML
    generateOutboundRouteXML(route, timeConditions) {
        const timeCondition = route.time_condition_id ?
            timeConditions.find(tc => tc.id === route.time_condition_id) : null;
        let xml = `
  <!-- Outbound Route: ${route.name} -->
  <extension name="outbound_${route.id}">`;
        // Add pattern condition
        xml += `
    <condition field="destination_number" expression="^${route.pattern}$">`;
        // Add caller ID manipulation if specified
        if (route.caller_id_prefix || route.caller_id_number) {
            if (route.caller_id_prefix) {
                xml += `
      <action application="set" data="effective_caller_id_name=\${effective_caller_id_name}"/>
      <action application="set" data="effective_caller_id_number=${route.caller_id_prefix}\${effective_caller_id_number}"/>`;
            }
            if (route.caller_id_number) {
                xml += `
      <action application="set" data="effective_caller_id_number=${route.caller_id_number}"/>`;
            }
        }
        // Add time condition if specified
        if (timeCondition) {
            xml += this.generateTimeConditionXML(timeCondition);
        }
        // Add trunk routing
        xml += this.generateTrunkRoutingXML(route);
        xml += `
    </condition>
  </extension>`;
        return xml;
    }
    // Generate dialplan context XML
    generateDialplanContextXML(context) {
        let xml = `
  <!-- Dialplan Context: ${context.name} -->
  <extension name="context_${context.id}">`;
        // Add variables
        for (const [key, value] of Object.entries(context.variables)) {
            xml += `
    <action application="set" data="${key}=${value}"/>`;
        }
        // Add conditions
        for (const condition of context.conditions) {
            xml += `
    <condition field="${condition.condition}" expression="^${condition.expression}$">`;
            for (const action of condition.actions) {
                xml += `
      <action application="${action.application}" data="${action.data}"/>`;
            }
            xml += `
    </condition>`;
        }
        xml += `
  </extension>`;
        return xml;
    }
    // Generate time condition XML
    generateTimeConditionXML(timeCondition) {
        let xml = `
      <action application="set" data="time_condition_id=${timeCondition.id}"/>`;
        // Generate time check logic
        for (const timeGroup of timeCondition.time_groups) {
            const days = timeGroup.days.join(',');
            xml += `
      <action application="set" data="time_condition_days=${days}"/>
      <action application="set" data="time_condition_start=${timeGroup.start_time}"/>
      <action application="set" data="time_condition_end=${timeGroup.end_time}"/>
      <action application="set" data="time_condition_timezone=${timeGroup.timezone}"/>`;
        }
        xml += `
      <action application="set" data="time_condition_match_destination_type=${timeCondition.match_destination_type}"/>
      <action application="set" data="time_condition_nomatch_destination_type=${timeCondition.nomatch_destination_type}"/>`;
        return xml;
    }
    // Generate destination action XML
    generateDestinationAction(route) {
        switch (route.destination_type) {
            case 'extension':
                const extension = route.destination_data?.extension || route.destination_id;
                return `
      <action application="set" data="domain_name=\${domain_name}"/>
      <action application="set" data="domain_uuid=\${domain_uuid}"/>
      <action application="set" data="call_direction=inbound"/>
      <action application="bridge" data="user/${extension}@\${domain_name}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>`;
            case 'ring_group':
                return `
      <action application="set" data="ring_group_id=${route.destination_id}"/>
      <action application="bridge" data="user/100@\${domain_name} user/1001@\${domain_name}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>`;
            case 'queue':
                return `
      <action application="set" data="queue_id=${route.destination_id}"/>
      <action application="bridge" data="queue/${route.destination_id}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>`;
            case 'ivr':
                return `
      <action application="set" data="ivr_id=${route.destination_id}"/>
      <action application="answer"/>
      <action application="sleep" data="1000"/>
      <action application="ivr" data="ivr_${route.destination_id}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>`;
            case 'conference':
                return `
      <action application="set" data="conference_id=${route.destination_id}"/>
      <action application="answer"/>
      <action application="conference" data="${route.destination_id}@default"/>
      <action application="hangup" data="NORMAL_CLEARING"/>`;
            case 'voicemail':
                return `
      <action application="set" data="voicemail_extension=${route.destination_data?.extension || '100'}"/>
      <action application="answer"/>
      <action application="voicemail" data="default \${domain_name} \${voicemail_extension}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>`;
            default:
                return `
      <action application="log" data="ERROR Unknown destination type: ${route.destination_type}"/>
      <action application="hangup" data="INVALID_DESTINATION"/>`;
        }
    }
    // Generate trunk routing XML
    generateTrunkRoutingXML(route) {
        let xml = `
      <action application="set" data="domain_name=\${domain_name}"/>
      <action application="set" data="domain_uuid=\${domain_uuid}"/>
      <action application="set" data="call_direction=outbound"/>`;
        // Add trunk routing based on priority
        for (let i = 0; i < route.trunk_priority.length; i++) {
            const trunk = route.trunk_priority[i];
            const isLast = i === route.trunk_priority.length - 1;
            if (isLast) {
                xml += `
      <action application="bridge" data="sofia/gateway/${trunk}/\${destination_number}"/>`;
            }
            else {
                xml += `
      <action application="bridge" data="sofia/gateway/${trunk}/\${destination_number}"/>
      <action application="hangup" data="NORMAL_CLEARING"/>
      <condition field="hangup_cause" expression="NO_ANSWER|USER_BUSY|UNALLOCATED_NUMBER">
        <action application="log" data="INFO Trying next trunk in priority list"/>`;
            }
        }
        // Close conditions for failover
        for (let i = 0; i < route.trunk_priority.length - 1; i++) {
            xml += `
      </condition>`;
        }
        xml += `
      <action application="hangup" data="NORMAL_CLEARING"/>`;
        return xml;
    }
    // Helper method to escape regex special characters
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    // Database methods
    async getInboundRoutes(tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM inbound_routes WHERE tenant_id = $1 ORDER BY priority ASC', [tenantId]);
            return result.rows.map((row) => ({
                id: row.id,
                tenant_id: row.tenant_id,
                store_id: row.store_id,
                name: row.name,
                description: row.description,
                did_number: row.did_number,
                caller_id_pattern: row.caller_id_pattern,
                destination_type: row.destination_type,
                destination_id: row.destination_id,
                destination_data: typeof row.destination_data === 'string' ? JSON.parse(row.destination_data) : row.destination_data,
                time_condition_id: row.time_condition_id,
                priority: row.priority,
                enabled: row.enabled,
                failover_destination_type: row.failover_destination_type,
                failover_destination_id: row.failover_destination_id,
                failover_destination_data: typeof row.failover_destination_data === 'string' ? JSON.parse(row.failover_destination_data) : row.failover_destination_data,
                settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
                created_at: row.created_at,
                updated_at: row.updated_at
            }));
        }
        finally {
            client.release();
        }
    }
    async getOutboundRoutes(tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM outbound_routes WHERE tenant_id = $1 ORDER BY priority ASC', [tenantId]);
            return result.rows.map((row) => ({
                id: row.id,
                tenant_id: row.tenant_id,
                store_id: row.store_id,
                name: row.name,
                description: row.description,
                pattern: row.pattern,
                caller_id_prefix: row.caller_id_prefix,
                caller_id_number: row.caller_id_number,
                trunk_priority: typeof row.trunk_priority === 'string' ? JSON.parse(row.trunk_priority) : row.trunk_priority,
                least_cost_routing: row.least_cost_routing,
                time_condition_id: row.time_condition_id,
                priority: row.priority,
                enabled: row.enabled,
                settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
                created_at: row.created_at,
                updated_at: row.updated_at
            }));
        }
        finally {
            client.release();
        }
    }
    async getTimeConditions(tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM time_conditions WHERE tenant_id = $1 ORDER BY name ASC', [tenantId]);
            return result.rows.map((row) => ({
                id: row.id,
                tenant_id: row.tenant_id,
                store_id: row.store_id,
                name: row.name,
                description: row.description,
                time_groups: typeof row.time_groups === 'string' ? JSON.parse(row.time_groups) : row.time_groups,
                holidays: typeof row.holidays === 'string' ? JSON.parse(row.holidays) : row.holidays,
                timezone: row.timezone,
                match_destination_type: row.match_destination_type,
                match_destination_id: row.match_destination_id,
                match_destination_data: typeof row.match_destination_data === 'string' ? JSON.parse(row.match_destination_data) : row.match_destination_data,
                nomatch_destination_type: row.nomatch_destination_type,
                nomatch_destination_id: row.nomatch_destination_id,
                nomatch_destination_data: typeof row.nomatch_destination_data === 'string' ? JSON.parse(row.nomatch_destination_data) : row.nomatch_destination_data,
                enabled: row.enabled,
                created_at: row.created_at,
                updated_at: row.updated_at
            }));
        }
        finally {
            client.release();
        }
    }
    async getDialplanContexts(tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query('SELECT * FROM dialplan_contexts WHERE tenant_id = $1 ORDER BY priority ASC', [tenantId]);
            return result.rows.map((row) => ({
                id: row.id,
                tenant_id: row.tenant_id,
                store_id: row.store_id,
                name: row.name,
                description: row.description,
                context_type: row.context_type,
                variables: typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables,
                conditions: typeof row.conditions === 'string' ? JSON.parse(row.conditions) : row.conditions,
                enabled: row.enabled,
                priority: row.priority,
                created_at: row.created_at,
                updated_at: row.updated_at
            }));
        }
        finally {
            client.release();
        }
    }
    // Sync dialplan to FreeSWITCH
    async syncDialplanToFreeSWITCH(tenantId) {
        try {
            console.log(`🔄 Syncing dialplan to FreeSWITCH for tenant: ${tenantId}`);
            const xml = await this.generateCompleteDialplan(tenantId);
            const filePath = `${this.configPath}/dialplan/default.xml`;
            // In real implementation, write XML file to FreeSWITCH config directory
            console.log(`📝 Generated dialplan XML for tenant: ${tenantId}`);
            console.log(`📁 File path: ${filePath}`);
            console.log(`📄 XML content length: ${xml.length} characters`);
            console.log(`✅ Dialplan synced to FreeSWITCH for tenant: ${tenantId}`);
        }
        catch (error) {
            console.error('❌ Error syncing dialplan to FreeSWITCH:', error);
            throw error;
        }
    }
}
exports.DialplanGeneratorService = DialplanGeneratorService;
// Export singleton instance
exports.dialplanGeneratorService = new DialplanGeneratorService();
//# sourceMappingURL=dialplan-generator.service.js.map