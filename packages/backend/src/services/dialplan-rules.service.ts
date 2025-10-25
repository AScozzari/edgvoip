import { getClient } from '@w3-voip/database';
import { v4 as uuidv4 } from 'uuid';

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

export class DialplanRulesService {
  /**
   * Create default dialplan rules for a specific context
   */
  async createDefaultRulesForContext(
    tenantId: string,
    context: string
  ): Promise<void> {
    const contextType = context.split('-').pop(); // internal|outbound|external|features|voicemail|emergency

    switch (contextType) {
      case 'internal':
        // Internal calls: 1XXX → bridge to user
        await this.createRule({
          tenant_id: tenantId,
          context,
          name: 'Internal Calls',
          description: 'Route calls to internal extensions (1000-1999)',
          priority: 100,
          match_pattern: '^(1\\d{3})$',
          actions: [
            {
              type: 'set',
              data: 'hangup_after_bridge=true',
            },
            {
              type: 'bridge',
              target: 'user/$1@${domain_name}',
            },
          ],
          enabled: true,
        });
        break;

      case 'outbound':
        // Outbound context: will be populated dynamically from outbound_routes table
        await this.createRule({
          tenant_id: tenantId,
          context,
          name: 'Outbound Default',
          description: 'Default outbound routing (dynamically loaded from outbound_routes)',
          priority: 999,
          match_pattern: '^(.+)$',
          actions: [
            {
              type: 'hangup',
              cause: 'NO_ROUTE_DESTINATION',
            },
          ],
          enabled: true,
        });
        break;

      case 'features':
        // Feature codes
        await this.createRule({
          tenant_id: tenantId,
          context,
          name: 'Call Forward Enable',
          description: 'Enable call forwarding: *21 + extension',
          priority: 10,
          match_pattern: '^\\*21(\\d+)$',
          actions: [
            {
              type: 'set',
              data: 'user_data(${caller_id_number}@${domain_name} var call_forward_number)=$1',
            },
            {
              type: 'answer',
            },
            {
              type: 'playback',
              data: 'ivr/ivr-call_forwarding_has_been_set.wav',
            },
            {
              type: 'hangup',
            },
          ],
          enabled: true,
        });

        await this.createRule({
          tenant_id: tenantId,
          context,
          name: 'Call Forward Disable',
          description: 'Disable call forwarding: *22',
          priority: 11,
          match_pattern: '^\\*22$',
          actions: [
            {
              type: 'set',
              data: 'user_data(${caller_id_number}@${domain_name} var call_forward_number)=',
            },
            {
              type: 'answer',
            },
            {
              type: 'playback',
              data: 'ivr/ivr-call_forwarding_has_been_cancelled.wav',
            },
            {
              type: 'hangup',
            },
          ],
          enabled: true,
        });

        await this.createRule({
          tenant_id: tenantId,
          context,
          name: 'Voicemail Check',
          description: 'Check voicemail: *98',
          priority: 20,
          match_pattern: '^\\*98$',
          actions: [
            {
              type: 'answer',
            },
            {
              type: 'voicemail',
              data: 'check default ${domain_name} ${caller_id_number}',
            },
          ],
          enabled: true,
        });

        await this.createRule({
          tenant_id: tenantId,
          context,
          name: 'DND Enable',
          description: 'Enable Do Not Disturb: *76',
          priority: 30,
          match_pattern: '^\\*76$',
          actions: [
            {
              type: 'set',
              data: 'user_data(${caller_id_number}@${domain_name} var dnd)=true',
            },
            {
              type: 'answer',
            },
            {
              type: 'playback',
              data: 'ivr/ivr-dnd_activated.wav',
            },
            {
              type: 'hangup',
            },
          ],
          enabled: true,
        });

        await this.createRule({
          tenant_id: tenantId,
          context,
          name: 'DND Disable',
          description: 'Disable Do Not Disturb: *77',
          priority: 31,
          match_pattern: '^\\*77$',
          actions: [
            {
              type: 'set',
              data: 'user_data(${caller_id_number}@${domain_name} var dnd)=false',
            },
            {
              type: 'answer',
            },
            {
              type: 'playback',
              data: 'ivr/ivr-dnd_cancelled.wav',
            },
            {
              type: 'hangup',
            },
          ],
          enabled: true,
        });
        break;

      case 'voicemail':
        // Voicemail deposit
        await this.createRule({
          tenant_id: tenantId,
          context,
          name: 'Voicemail Deposit',
          description: 'Send caller to voicemail for extension',
          priority: 100,
          match_pattern: '^(\\d+)$',
          actions: [
            {
              type: 'answer',
            },
            {
              type: 'voicemail',
              data: 'default ${domain_name} $1',
            },
          ],
          enabled: true,
        });
        break;

      case 'emergency':
        // Emergency numbers (112, 113, 115, 118, etc.)
        await this.createRule({
          tenant_id: tenantId,
          context,
          name: 'Emergency Numbers',
          description: 'Route emergency calls (112, 113, 115, 118)',
          priority: 1,
          match_pattern: '^(112|113|115|118)$',
          actions: [
            {
              type: 'set',
              data: 'effective_caller_id_number=${outbound_caller_id_number}',
            },
            {
              type: 'bridge',
              target: 'sofia/external/$1',
            },
          ],
          enabled: true,
        });
        break;

      case 'external':
        // External context (inbound from trunk)
        await this.createRule({
          tenant_id: tenantId,
          context,
          name: 'External Inbound Default',
          description: 'Default inbound routing (dynamically loaded from inbound_routes)',
          priority: 999,
          match_pattern: '^(.+)$',
          actions: [
            {
              type: 'answer',
            },
            {
              type: 'playback',
              data: 'ivr/ivr-no_route_destination.wav',
            },
            {
              type: 'hangup',
            },
          ],
          enabled: true,
        });
        break;
    }

    console.log(`✅ Dialplan rules defaults created for ${context} (${contextType})`);
  }

  /**
   * Create a single dialplan rule
   */
  async createRule(rule: Partial<DialplanRule>): Promise<DialplanRule> {
    const client = await getClient();

    try {
      const id = rule.id || uuidv4();

      const result = await client.query(
        `INSERT INTO dialplan_rules (
          id, tenant_id, context, name, description, priority, 
          match_pattern, match_condition, actions, enabled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          id,
          rule.tenant_id,
          rule.context,
          rule.name,
          rule.description || null,
          rule.priority || 100,
          rule.match_pattern,
          JSON.stringify(rule.match_condition || null),
          JSON.stringify(rule.actions),
          rule.enabled !== false,
        ]
      );

      return result.rows[0];
    } finally {
      await client.release();
    }
  }

  /**
   * Get all rules for a specific context
   */
  async getRulesByContext(
    tenantId: string,
    context: string
  ): Promise<DialplanRule[]> {
    const client = await getClient();

    try {
      const result = await client.query(
        `SELECT * FROM dialplan_rules 
         WHERE tenant_id = $1 AND context = $2 AND enabled = true 
         ORDER BY priority ASC`,
        [tenantId, context]
      );

      return result.rows;
    } finally {
      await client.release();
    }
  }

  /**
   * Get all rules for a tenant
   */
  async getRulesByTenant(tenantId: string): Promise<DialplanRule[]> {
    const client = await getClient();

    try {
      const result = await client.query(
        `SELECT * FROM dialplan_rules 
         WHERE tenant_id = $1 
         ORDER BY context, priority ASC`,
        [tenantId]
      );

      return result.rows;
    } finally {
      await client.release();
    }
  }

  /**
   * Update a dialplan rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<DialplanRule>
  ): Promise<DialplanRule> {
    const client = await getClient();

    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(updates.description);
      }
      if (updates.priority !== undefined) {
        fields.push(`priority = $${paramCount++}`);
        values.push(updates.priority);
      }
      if (updates.match_pattern !== undefined) {
        fields.push(`match_pattern = $${paramCount++}`);
        values.push(updates.match_pattern);
      }
      if (updates.match_condition !== undefined) {
        fields.push(`match_condition = $${paramCount++}`);
        values.push(JSON.stringify(updates.match_condition));
      }
      if (updates.actions !== undefined) {
        fields.push(`actions = $${paramCount++}`);
        values.push(JSON.stringify(updates.actions));
      }
      if (updates.enabled !== undefined) {
        fields.push(`enabled = $${paramCount++}`);
        values.push(updates.enabled);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(ruleId);

      const result = await client.query(
        `UPDATE dialplan_rules SET ${fields.join(', ')}, updated_at = NOW() 
         WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Dialplan rule not found');
      }

      return result.rows[0];
    } finally {
      await client.release();
    }
  }

  /**
   * Delete a dialplan rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    const client = await getClient();

    try {
      await client.query('DELETE FROM dialplan_rules WHERE id = $1', [ruleId]);
    } finally {
      await client.release();
    }
  }

  /**
   * Validate a regex pattern
   */
  validatePattern(pattern: string): boolean {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test if a number matches a rule's pattern
   */
  testRule(rule: DialplanRule, number: string): boolean {
    try {
      const regex = new RegExp(rule.match_pattern);
      return regex.test(number);
    } catch {
      return false;
    }
  }

  /**
   * Test a pattern against a number
   */
  testPattern(pattern: string, number: string): { match: boolean; groups?: string[] } {
    try {
      const regex = new RegExp(pattern);
      const result = number.match(regex);

      if (result) {
        return {
          match: true,
          groups: result.slice(1), // Capture groups
        };
      }

      return { match: false };
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${pattern}`);
    }
  }
}

