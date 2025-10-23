import { getClient, withTransaction } from '@w3-voip/database';
import { v4 as uuidv4 } from 'uuid';

// Queue interfaces
export interface CallQueue {
  id: string;
  tenant_id: string;
  store_id?: string;
  name: string;
  description?: string;
  extension: string;
  strategy: 'ring-all' | 'longest-idle' | 'round-robin' | 'top-down' | 'agent-with-least-talk-time';
  max_wait_time: number;
  max_wait_time_with_no_agent: number;
  max_wait_time_with_no_agent_time_reached: number;
  tier_rules_apply: boolean;
  tier_rule_wait_second: number;
  tier_rule_wait_multiply_level: boolean;
  tier_rule_no_agent_no_wait: boolean;
  discard_abandoned_after: number;
  abandoned_resume_allowed: boolean;
  agents: Array<{
    id: string;
    extension_id: string;
    agent_name: string;
    agent_type: 'callback' | 'uuid-standby' | 'uuid-bridge';
    contact: string;
    status: 'Available' | 'On Break' | 'Logged Out';
    state: 'Waiting' | 'Receiving' | 'In a queue call';
    max_no_answer: number;
    wrap_up_time: number;
    reject_delay_time: number;
    busy_delay_time: number;
    no_answer_delay_time: number;
    calls_answered: number;
    talk_time: number;
    tier_level: number;
    tier_position: number;
    enabled: boolean;
  }>;
  moh_sound?: string;
  record_template?: string;
  time_base_score: 'system' | 'queue' | 'member';
  queue_timeout: number;
  queue_timeout_action: 'hangup' | 'voicemail' | 'forward';
  queue_timeout_destination?: string;
  failover_enabled: boolean;
  failover_destination_type?: string;
  failover_destination_id?: string;
  failover_destination_data?: any;
  caller_id_name?: string;
  caller_id_number?: string;
  recording_enabled: boolean;
  recording_path?: string;
  recording_consent_required: boolean;
  max_concurrent_calls: number;
  current_calls: number;
  settings: any;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface QueueAgent {
  id: string;
  queue_id: string;
  extension_id: string;
  agent_name: string;
  agent_type: 'callback' | 'uuid-standby' | 'uuid-bridge';
  contact: string;
  status: 'Available' | 'On Break' | 'Logged Out';
  state: 'Waiting' | 'Receiving' | 'In a queue call';
  max_no_answer: number;
  wrap_up_time: number;
  reject_delay_time: number;
  busy_delay_time: number;
  no_answer_delay_time: number;
  last_bridge_start?: Date;
  last_bridge_end?: Date;
  last_offered_call?: Date;
  last_status_change?: Date;
  no_answer_count: number;
  calls_answered: number;
  talk_time: number;
  ready_time?: Date;
  external_calls_count: number;
  uuid?: string;
  tier_level: number;
  tier_position: number;
  enabled: boolean;
  settings: any;
  created_at: Date;
  updated_at: Date;
}

export interface QueueCallLog {
  id: string;
  queue_id: string;
  call_uuid: string;
  caller_id_name?: string;
  caller_id_number?: string;
  destination_number?: string;
  queue_position?: number;
  queue_wait_time: number;
  start_time: Date;
  end_time?: Date;
  duration: number;
  hangup_cause?: string;
  answered_by_agent?: string;
  answered_by_extension?: string;
  agent_wait_time: number;
  agent_talk_time: number;
  recording_path?: string;
  settings: any;
  created_at: Date;
}

export interface QueueStatistics {
  id: string;
  queue_id: string;
  date: Date;
  total_calls: number;
  answered_calls: number;
  abandoned_calls: number;
  total_wait_time: number;
  average_wait_time: number;
  longest_wait_time: number;
  total_talk_time: number;
  average_talk_time: number;
  longest_talk_time: number;
  service_level_percentage: number;
  service_level_threshold: number;
  created_at: Date;
  updated_at: Date;
}

export class QueueService {
  // Create a new call queue
  async createCallQueue(queueData: Partial<CallQueue>): Promise<CallQueue> {
    return withTransaction(async (client) => {
      // Verify tenant exists
      const tenantResult = await client.query(
        'SELECT id FROM tenants WHERE id = $1 AND status = $2',
        [queueData.tenant_id, 'active']
      );

      if (tenantResult.rows.length === 0) {
        throw new Error('Tenant not found or inactive');
      }

      // Check if extension is already in use
      const extensionCheck = await client.query(
        'SELECT id FROM call_queues WHERE extension = $1 AND tenant_id = $2',
        [queueData.extension, queueData.tenant_id]
      );

      if (extensionCheck.rows.length > 0) {
        throw new Error('Extension already in use by another queue');
      }

      const result = await client.query(
        `INSERT INTO call_queues (
          id, tenant_id, store_id, name, description, extension, strategy,
          max_wait_time, max_wait_time_with_no_agent, max_wait_time_with_no_agent_time_reached,
          tier_rules_apply, tier_rule_wait_second, tier_rule_wait_multiply_level,
          tier_rule_no_agent_no_wait, discard_abandoned_after, abandoned_resume_allowed,
          moh_sound, record_template, time_base_score, queue_timeout, queue_timeout_action,
          queue_timeout_destination, failover_enabled, failover_destination_type,
          failover_destination_id, failover_destination_data, caller_id_name, caller_id_number,
          recording_enabled, recording_path, recording_consent_required,
          max_concurrent_calls, current_calls, settings, enabled
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
        ) RETURNING *`,
        [
          uuidv4(),
          queueData.tenant_id,
          queueData.store_id,
          queueData.name,
          queueData.description,
          queueData.extension,
          queueData.strategy || 'ring-all',
          queueData.max_wait_time || 300,
          queueData.max_wait_time_with_no_agent || 60,
          queueData.max_wait_time_with_no_agent_time_reached || 5,
          queueData.tier_rules_apply !== false,
          queueData.tier_rule_wait_second || 300,
          queueData.tier_rule_wait_multiply_level !== false,
          queueData.tier_rule_no_agent_no_wait || false,
          queueData.discard_abandoned_after || 60,
          queueData.abandoned_resume_allowed || false,
          queueData.moh_sound,
          queueData.record_template,
          queueData.time_base_score || 'system',
          queueData.queue_timeout || 60,
          queueData.queue_timeout_action || 'hangup',
          queueData.queue_timeout_destination,
          queueData.failover_enabled || false,
          queueData.failover_destination_type,
          queueData.failover_destination_id,
          JSON.stringify(queueData.failover_destination_data || {}),
          queueData.caller_id_name,
          queueData.caller_id_number,
          queueData.recording_enabled || false,
          queueData.recording_path,
          queueData.recording_consent_required !== false,
          queueData.max_concurrent_calls || 10,
          queueData.current_calls || 0,
          JSON.stringify(queueData.settings || {}),
          queueData.enabled !== false
        ]
      );

      const queue = result.rows[0];
      return this.mapRowToCallQueue(queue);
    });
  }

  // Get call queues for a tenant
  async getCallQueues(tenantId: string, storeId?: string): Promise<CallQueue[]> {
    const client = await getClient();
    try {
      let query = `
        SELECT cq.*, 
               COALESCE(
                 (SELECT jsonb_agg(
                   jsonb_build_object(
                     'id', qa.id,
                     'extension_id', qa.extension_id,
                     'agent_name', qa.agent_name,
                     'agent_type', qa.agent_type,
                     'contact', qa.contact,
                     'status', qa.status,
                     'state', qa.state,
                     'max_no_answer', qa.max_no_answer,
                     'wrap_up_time', qa.wrap_up_time,
                     'reject_delay_time', qa.reject_delay_time,
                     'busy_delay_time', qa.busy_delay_time,
                     'no_answer_delay_time', qa.no_answer_delay_time,
                     'calls_answered', qa.calls_answered,
                     'talk_time', qa.talk_time,
                     'tier_level', qa.tier_level,
                     'tier_position', qa.tier_position,
                     'enabled', qa.enabled
                   )
                 )
                 FROM queue_agents qa
                 WHERE qa.queue_id = cq.id
                 AND qa.enabled = true
                 ORDER BY qa.tier_level ASC, qa.tier_position ASC
                ), '[]'::jsonb
               ) as agents
        FROM call_queues cq
        WHERE cq.tenant_id = $1
      `;
      
      const params: any[] = [tenantId];
      
      if (storeId) {
        query += ' AND cq.store_id = $2';
        params.push(storeId);
      }
      
      query += ' ORDER BY cq.name ASC';
      
      const result = await client.query(query, params);
      
      return result.rows.map((row: any) => this.mapRowToCallQueue(row));
    } finally {
      client.release();
    }
  }

  // Get call queue by ID
  async getCallQueue(queueId: string): Promise<CallQueue | null> {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT cq.*, 
                COALESCE(
                  (SELECT jsonb_agg(
                    jsonb_build_object(
                      'id', qa.id,
                      'extension_id', qa.extension_id,
                      'agent_name', qa.agent_name,
                      'agent_type', qa.agent_type,
                      'contact', qa.contact,
                      'status', qa.status,
                      'state', qa.state,
                      'max_no_answer', qa.max_no_answer,
                      'wrap_up_time', qa.wrap_up_time,
                      'reject_delay_time', qa.reject_delay_time,
                      'busy_delay_time', qa.busy_delay_time,
                      'no_answer_delay_time', qa.no_answer_delay_time,
                      'calls_answered', qa.calls_answered,
                      'talk_time', qa.talk_time,
                      'tier_level', qa.tier_level,
                      'tier_position', qa.tier_position,
                      'enabled', qa.enabled
                    )
                  )
                  FROM queue_agents qa
                  WHERE qa.queue_id = cq.id
                  AND qa.enabled = true
                  ORDER BY qa.tier_level ASC, qa.tier_position ASC
                 ), '[]'::jsonb
                ) as agents
         FROM call_queues cq
         WHERE cq.id = $1`,
        [queueId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToCallQueue(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Add agent to queue
  async addAgent(queueId: string, extensionId: string, agentData: Partial<QueueAgent>): Promise<QueueAgent> {
    return withTransaction(async (client) => {
      // Verify queue exists
      const queueResult = await client.query(
        'SELECT id FROM call_queues WHERE id = $1',
        [queueId]
      );

      if (queueResult.rows.length === 0) {
        throw new Error('Call queue not found');
      }

      // Verify extension exists
      const extensionResult = await client.query(
        'SELECT id, extension, display_name FROM extensions WHERE id = $1',
        [extensionId]
      );

      if (extensionResult.rows.length === 0) {
        throw new Error('Extension not found');
      }

      const extension = extensionResult.rows[0];

      const result = await client.query(
        `INSERT INTO queue_agents (
          id, queue_id, extension_id, agent_name, agent_type, contact,
          status, state, max_no_answer, wrap_up_time, reject_delay_time,
          busy_delay_time, no_answer_delay_time, tier_level, tier_position,
          enabled, settings
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (queue_id, extension_id) 
        DO UPDATE SET 
          agent_name = EXCLUDED.agent_name,
          agent_type = EXCLUDED.agent_type,
          contact = EXCLUDED.contact,
          max_no_answer = EXCLUDED.max_no_answer,
          wrap_up_time = EXCLUDED.wrap_up_time,
          reject_delay_time = EXCLUDED.reject_delay_time,
          busy_delay_time = EXCLUDED.busy_delay_time,
          no_answer_delay_time = EXCLUDED.no_answer_delay_time,
          tier_level = EXCLUDED.tier_level,
          tier_position = EXCLUDED.tier_position,
          enabled = EXCLUDED.enabled,
          settings = EXCLUDED.settings,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
          uuidv4(),
          queueId,
          extensionId,
          agentData.agent_name || `${extension.display_name} (${extension.extension})`,
          agentData.agent_type || 'callback',
          agentData.contact || `user/${extension.extension}@\${domain_name}`,
          agentData.status || 'Available',
          agentData.state || 'Waiting',
          agentData.max_no_answer || 3,
          agentData.wrap_up_time || 10,
          agentData.reject_delay_time || 10,
          agentData.busy_delay_time || 60,
          agentData.no_answer_delay_time || 60,
          agentData.tier_level || 1,
          agentData.tier_position || 1,
          agentData.enabled !== false,
          JSON.stringify(agentData.settings || {})
        ]
      );

      return this.mapRowToQueueAgent(result.rows[0]);
    });
  }

  // Remove agent from queue
  async removeAgent(queueId: string, extensionId: string): Promise<void> {
    return withTransaction(async (client) => {
      const result = await client.query(
        'DELETE FROM queue_agents WHERE queue_id = $1 AND extension_id = $2',
        [queueId, extensionId]
      );

      if (result.rowCount === 0) {
        throw new Error('Agent not found in queue');
      }
    });
  }

  // Update agent status
  async updateAgentStatus(queueId: string, extensionId: string, status: string, state?: string): Promise<QueueAgent> {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE queue_agents SET 
          status = $1,
          state = COALESCE($2, state),
          last_status_change = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE queue_id = $3 AND extension_id = $4
        RETURNING *`,
        [status, state, queueId, extensionId]
      );

      if (result.rows.length === 0) {
        throw new Error('Agent not found in queue');
      }

      return this.mapRowToQueueAgent(result.rows[0]);
    });
  }

  // Update call queue
  async updateCallQueue(queueId: string, updateData: Partial<CallQueue>): Promise<CallQueue> {
    return withTransaction(async (client) => {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      if (updateData.name) {
        updateFields.push(`name = $${paramCount++}`);
        updateValues.push(updateData.name);
      }
      if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        updateValues.push(updateData.description);
      }
      if (updateData.strategy) {
        updateFields.push(`strategy = $${paramCount++}`);
        updateValues.push(updateData.strategy);
      }
      if (updateData.max_wait_time !== undefined) {
        updateFields.push(`max_wait_time = $${paramCount++}`);
        updateValues.push(updateData.max_wait_time);
      }
      if (updateData.enabled !== undefined) {
        updateFields.push(`enabled = $${paramCount++}`);
        updateValues.push(updateData.enabled);
      }
      if (updateData.settings) {
        updateFields.push(`settings = $${paramCount++}`);
        updateValues.push(JSON.stringify(updateData.settings));
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(queueId);

      const result = await client.query(
        `UPDATE call_queues SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        throw new Error('Call queue not found');
      }

      return this.mapRowToCallQueue(result.rows[0]);
    });
  }

  // Delete call queue
  async deleteCallQueue(queueId: string): Promise<void> {
    return withTransaction(async (client) => {
      const result = await client.query(
        'DELETE FROM call_queues WHERE id = $1',
        [queueId]
      );

      if (result.rowCount === 0) {
        throw new Error('Call queue not found');
      }
    });
  }

  // Get queue call logs
  async getCallLogs(queueId: string, limit: number = 50, offset: number = 0): Promise<QueueCallLog[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT * FROM queue_call_logs 
         WHERE queue_id = $1 
         ORDER BY start_time DESC 
         LIMIT $2 OFFSET $3`,
        [queueId, limit, offset]
      );
      
      return result.rows.map((row: any) => this.mapRowToQueueCallLog(row));
    } finally {
      client.release();
    }
  }

  // Get queue statistics
  async getStatistics(queueId: string, startDate: Date, endDate: Date): Promise<QueueStatistics[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        'SELECT * FROM queue_statistics WHERE queue_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC',
        [queueId, startDate, endDate]
      );
      
      return result.rows.map((row: any) => this.mapRowToQueueStatistics(row));
    } finally {
      client.release();
    }
  }

  // Log queue call
  async logCall(callData: Partial<QueueCallLog>): Promise<string> {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT log_queue_call($1, $2, $3, $4, $5, $6, $7)`,
        [
          callData.queue_id,
          callData.call_uuid,
          callData.caller_id_name,
          callData.caller_id_number,
          callData.destination_number,
          callData.queue_position,
          callData.settings ? JSON.stringify(callData.settings) : '{}'
        ]
      );

      return result.rows[0].log_queue_call;
    } finally {
      client.release();
    }
  }

  // Update queue call log
  async updateCallLog(callUuid: string, updateData: Partial<QueueCallLog>): Promise<void> {
    const client = await getClient();
    try {
      await client.query(
        `SELECT update_queue_call_log($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          callUuid,
          updateData.end_time,
          updateData.duration,
          updateData.hangup_cause,
          updateData.answered_by_agent,
          updateData.answered_by_extension,
          updateData.agent_wait_time,
          updateData.agent_talk_time,
          updateData.recording_path
        ]
      );
    } finally {
      client.release();
    }
  }

  // Update queue statistics
  async updateStatistics(queueId: string, date: Date, stats: {
    total_calls?: number;
    answered_calls?: number;
    abandoned_calls?: number;
    total_wait_time?: number;
    total_talk_time?: number;
  }): Promise<void> {
    const client = await getClient();
    try {
      await client.query(
        `SELECT update_queue_statistics($1, $2, $3, $4, $5, $6, $7)`,
        [
          queueId,
          date,
          stats.total_calls,
          stats.answered_calls,
          stats.abandoned_calls,
          stats.total_wait_time,
          stats.total_talk_time
        ]
      );
    } finally {
      client.release();
    }
  }

  // Generate FreeSWITCH callcenter configuration XML
  generateCallcenterXML(queue: CallQueue): string {
    const agents = queue.agents.filter(a => a.enabled);
    
    let xml = `
  <!-- Call Queue: ${queue.name} (${queue.extension}) -->
  <extension name="queue_${queue.id}">
    <condition field="destination_number" expression="^${queue.extension}$">
      <action application="answer"/>
      <action application="set" data="queue_id=${queue.id}"/>
      <action application="set" data="queue_name=${queue.name}"/>
      <action application="set" data="queue_timeout=${queue.queue_timeout}"/>`;

    // Add caller ID settings
    if (queue.caller_id_name) {
      xml += `
      <action application="set" data="effective_caller_id_name=${queue.caller_id_name}"/>`;
    }
    if (queue.caller_id_number) {
      xml += `
      <action application="set" data="effective_caller_id_number=${queue.caller_id_number}"/>`;
    }

    // Add music on hold if specified
    if (queue.moh_sound) {
      xml += `
      <action application="set" data="moh_sound=${queue.moh_sound}"/>`;
    }

    // Generate queue bridge based on strategy
    xml += this.generateQueueBridgeXML(queue);

    // Add timeout action
    xml += this.generateTimeoutActionXML(queue);

    xml += `
    </condition>
  </extension>`;

    return xml;
  }

  // Generate queue bridge XML based on strategy
  private generateQueueBridgeXML(queue: CallQueue): string {
    const agents = queue.agents.filter(a => a.enabled);
    if (agents.length === 0) {
      return `
      <action application="log" data="ERROR No active agents in queue ${queue.name}"/>
      <action application="hangup" data="NO_ANSWER"/>`;
    }

    // For mod_callcenter, we use the callcenter application
    const agentTargets = agents
      .map(agent => `agent/${agent.agent_name}`)
      .join(' ');

    return `
      <action application="callcenter" data="queue_${queue.id}"/>`;
  }

  // Generate timeout action XML
  private generateTimeoutActionXML(queue: CallQueue): string {
    switch (queue.queue_timeout_action) {
      case 'voicemail':
        return `
      <condition field="hangup_cause" expression="NO_ANSWER|TIMEOUT">
        <action application="voicemail" data="default \${domain_name} ${queue.queue_timeout_destination || '100'}"/>
        <action application="hangup" data="NORMAL_CLEARING"/>
      </condition>`;
      case 'forward':
        if (queue.queue_timeout_destination) {
          return `
      <condition field="hangup_cause" expression="NO_ANSWER|TIMEOUT">
        <action application="bridge" data="user/${queue.queue_timeout_destination}@\${domain_name}"/>
        <action application="hangup" data="NORMAL_CLEARING"/>
      </condition>`;
        }
        break;
      case 'hangup':
        return `
      <condition field="hangup_cause" expression="NO_ANSWER|TIMEOUT">
        <action application="hangup" data="NO_ANSWER"/>
      </condition>`;
    }

    return `
      <condition field="hangup_cause" expression="NO_ANSWER|TIMEOUT">
        <action application="hangup" data="NO_ANSWER"/>
      </condition>`;
  }

  // Helper methods to map database rows to objects
  private mapRowToCallQueue(row: any): CallQueue {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      store_id: row.store_id,
      name: row.name,
      description: row.description,
      extension: row.extension,
      strategy: row.strategy,
      max_wait_time: row.max_wait_time,
      max_wait_time_with_no_agent: row.max_wait_time_with_no_agent,
      max_wait_time_with_no_agent_time_reached: row.max_wait_time_with_no_agent_time_reached,
      tier_rules_apply: row.tier_rules_apply,
      tier_rule_wait_second: row.tier_rule_wait_second,
      tier_rule_wait_multiply_level: row.tier_rule_wait_multiply_level,
      tier_rule_no_agent_no_wait: row.tier_rule_no_agent_no_wait,
      discard_abandoned_after: row.discard_abandoned_after,
      abandoned_resume_allowed: row.abandoned_resume_allowed,
      agents: typeof row.agents === 'string' ? JSON.parse(row.agents) : row.agents,
      moh_sound: row.moh_sound,
      record_template: row.record_template,
      time_base_score: row.time_base_score,
      queue_timeout: row.queue_timeout,
      queue_timeout_action: row.queue_timeout_action,
      queue_timeout_destination: row.queue_timeout_destination,
      failover_enabled: row.failover_enabled,
      failover_destination_type: row.failover_destination_type,
      failover_destination_id: row.failover_destination_id,
      failover_destination_data: typeof row.failover_destination_data === 'string' ? JSON.parse(row.failover_destination_data) : row.failover_destination_data,
      caller_id_name: row.caller_id_name,
      caller_id_number: row.caller_id_number,
      recording_enabled: row.recording_enabled,
      recording_path: row.recording_path,
      recording_consent_required: row.recording_consent_required,
      max_concurrent_calls: row.max_concurrent_calls,
      current_calls: row.current_calls,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
      enabled: row.enabled,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapRowToQueueAgent(row: any): QueueAgent {
    return {
      id: row.id,
      queue_id: row.queue_id,
      extension_id: row.extension_id,
      agent_name: row.agent_name,
      agent_type: row.agent_type,
      contact: row.contact,
      status: row.status,
      state: row.state,
      max_no_answer: row.max_no_answer,
      wrap_up_time: row.wrap_up_time,
      reject_delay_time: row.reject_delay_time,
      busy_delay_time: row.busy_delay_time,
      no_answer_delay_time: row.no_answer_delay_time,
      last_bridge_start: row.last_bridge_start,
      last_bridge_end: row.last_bridge_end,
      last_offered_call: row.last_offered_call,
      last_status_change: row.last_status_change,
      no_answer_count: row.no_answer_count,
      calls_answered: row.calls_answered,
      talk_time: row.talk_time,
      ready_time: row.ready_time,
      external_calls_count: row.external_calls_count,
      uuid: row.uuid,
      tier_level: row.tier_level,
      tier_position: row.tier_position,
      enabled: row.enabled,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapRowToQueueCallLog(row: any): QueueCallLog {
    return {
      id: row.id,
      queue_id: row.queue_id,
      call_uuid: row.call_uuid,
      caller_id_name: row.caller_id_name,
      caller_id_number: row.caller_id_number,
      destination_number: row.destination_number,
      queue_position: row.queue_position,
      queue_wait_time: row.queue_wait_time,
      start_time: row.start_time,
      end_time: row.end_time,
      duration: row.duration,
      hangup_cause: row.hangup_cause,
      answered_by_agent: row.answered_by_agent,
      answered_by_extension: row.answered_by_extension,
      agent_wait_time: row.agent_wait_time,
      agent_talk_time: row.agent_talk_time,
      recording_path: row.recording_path,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
      created_at: row.created_at
    };
  }

  private mapRowToQueueStatistics(row: any): QueueStatistics {
    return {
      id: row.id,
      queue_id: row.queue_id,
      date: row.date,
      total_calls: row.total_calls,
      answered_calls: row.answered_calls,
      abandoned_calls: row.abandoned_calls,
      total_wait_time: row.total_wait_time,
      average_wait_time: row.average_wait_time,
      longest_wait_time: row.longest_wait_time,
      total_talk_time: row.total_talk_time,
      average_talk_time: row.average_talk_time,
      longest_talk_time: row.longest_talk_time,
      service_level_percentage: row.service_level_percentage,
      service_level_threshold: row.service_level_threshold,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

// Export singleton instance
export const queueService = new QueueService();
