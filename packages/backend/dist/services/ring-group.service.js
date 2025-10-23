"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ringGroupService = exports.RingGroupService = void 0;
const database_1 = require("@w3-voip/database");
const uuid_1 = require("uuid");
class RingGroupService {
    // Create a new ring group
    async createRingGroup(ringGroupData) {
        return (0, database_1.withTransaction)(async (client) => {
            // Verify tenant exists
            const tenantResult = await client.query('SELECT id FROM tenants WHERE id = $1 AND status = $2', [ringGroupData.tenant_id, 'active']);
            if (tenantResult.rows.length === 0) {
                throw new Error('Tenant not found or inactive');
            }
            // Check if extension is already in use
            const extensionCheck = await client.query('SELECT id FROM ring_groups WHERE extension = $1 AND tenant_id = $2', [ringGroupData.extension, ringGroupData.tenant_id]);
            if (extensionCheck.rows.length > 0) {
                throw new Error('Extension already in use by another ring group');
            }
            const result = await client.query(`INSERT INTO ring_groups (
          id, tenant_id, store_id, name, description, extension, strategy,
          ring_time, member_settings, moh_sound, voicemail_enabled,
          voicemail_extension, voicemail_password, voicemail_email,
          call_timeout, call_timeout_action, call_timeout_destination,
          failover_enabled, failover_destination_type, failover_destination_id,
          failover_destination_data, caller_id_name, caller_id_number,
          recording_enabled, recording_path, recording_consent_required,
          max_concurrent_calls, current_calls, settings, enabled
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        ) RETURNING *`, [
                (0, uuid_1.v4)(),
                ringGroupData.tenant_id,
                ringGroupData.store_id,
                ringGroupData.name,
                ringGroupData.description,
                ringGroupData.extension,
                ringGroupData.strategy || 'ringall',
                ringGroupData.ring_time || 20,
                JSON.stringify(ringGroupData.member_settings || {}),
                ringGroupData.moh_sound,
                ringGroupData.voicemail_enabled || false,
                ringGroupData.voicemail_extension,
                ringGroupData.voicemail_password,
                ringGroupData.voicemail_email,
                ringGroupData.call_timeout || 60,
                ringGroupData.call_timeout_action || 'voicemail',
                ringGroupData.call_timeout_destination,
                ringGroupData.failover_enabled || false,
                ringGroupData.failover_destination_type,
                ringGroupData.failover_destination_id,
                JSON.stringify(ringGroupData.failover_destination_data || {}),
                ringGroupData.caller_id_name,
                ringGroupData.caller_id_number,
                ringGroupData.recording_enabled || false,
                ringGroupData.recording_path,
                ringGroupData.recording_consent_required !== false,
                ringGroupData.max_concurrent_calls || 10,
                ringGroupData.current_calls || 0,
                JSON.stringify(ringGroupData.settings || {}),
                ringGroupData.enabled !== false
            ]);
            const ringGroup = result.rows[0];
            return this.mapRowToRingGroup(ringGroup);
        });
    }
    // Get ring groups for a tenant
    async getRingGroups(tenantId, storeId) {
        const client = await (0, database_1.getClient)();
        try {
            let query = `
        SELECT rg.*, 
               COALESCE(
                 (SELECT jsonb_agg(
                   jsonb_build_object(
                     'extension_id', rgm.extension_id,
                     'extension', e.extension,
                     'display_name', e.display_name,
                     'priority', rgm.priority,
                     'ring_delay', rgm.ring_delay,
                     'ring_timeout', rgm.ring_timeout,
                     'enabled', rgm.enabled
                   )
                 )
                 FROM ring_group_members rgm
                 JOIN extensions e ON rgm.extension_id = e.id
                 WHERE rgm.ring_group_id = rg.id
                 AND rgm.enabled = true
                 ORDER BY rgm.priority ASC
                ), '[]'::jsonb
               ) as members
        FROM ring_groups rg
        WHERE rg.tenant_id = $1
      `;
            const params = [tenantId];
            if (storeId) {
                query += ' AND rg.store_id = $2';
                params.push(storeId);
            }
            query += ' ORDER BY rg.name ASC';
            const result = await client.query(query, params);
            return result.rows.map((row) => this.mapRowToRingGroup(row));
        }
        finally {
            client.release();
        }
    }
    // Get ring group by ID
    async getRingGroup(ringGroupId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`SELECT rg.*, 
                COALESCE(
                  (SELECT jsonb_agg(
                    jsonb_build_object(
                      'extension_id', rgm.extension_id,
                      'extension', e.extension,
                      'display_name', e.display_name,
                      'priority', rgm.priority,
                      'ring_delay', rgm.ring_delay,
                      'ring_timeout', rgm.ring_timeout,
                      'enabled', rgm.enabled
                    )
                  )
                  FROM ring_group_members rgm
                  JOIN extensions e ON rgm.extension_id = e.id
                  WHERE rgm.ring_group_id = rg.id
                  AND rgm.enabled = true
                  ORDER BY rgm.priority ASC
                 ), '[]'::jsonb
                ) as members
         FROM ring_groups rg
         WHERE rg.id = $1`, [ringGroupId]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToRingGroup(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    // Add member to ring group
    async addMember(ringGroupId, extensionId, memberData) {
        return (0, database_1.withTransaction)(async (client) => {
            // Verify ring group exists
            const ringGroupResult = await client.query('SELECT id FROM ring_groups WHERE id = $1', [ringGroupId]);
            if (ringGroupResult.rows.length === 0) {
                throw new Error('Ring group not found');
            }
            // Verify extension exists
            const extensionResult = await client.query('SELECT id FROM extensions WHERE id = $1', [extensionId]);
            if (extensionResult.rows.length === 0) {
                throw new Error('Extension not found');
            }
            const result = await client.query(`INSERT INTO ring_group_members (
          id, ring_group_id, extension_id, priority, ring_delay, 
          ring_timeout, enabled, settings
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (ring_group_id, extension_id) 
        DO UPDATE SET 
          priority = EXCLUDED.priority,
          ring_delay = EXCLUDED.ring_delay,
          ring_timeout = EXCLUDED.ring_timeout,
          enabled = EXCLUDED.enabled,
          settings = EXCLUDED.settings,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`, [
                (0, uuid_1.v4)(),
                ringGroupId,
                extensionId,
                memberData.priority || 100,
                memberData.ring_delay || 0,
                memberData.ring_timeout || 20,
                memberData.enabled !== false,
                JSON.stringify(memberData.settings || {})
            ]);
            return this.mapRowToRingGroupMember(result.rows[0]);
        });
    }
    // Remove member from ring group
    async removeMember(ringGroupId, extensionId) {
        return (0, database_1.withTransaction)(async (client) => {
            const result = await client.query('DELETE FROM ring_group_members WHERE ring_group_id = $1 AND extension_id = $2', [ringGroupId, extensionId]);
            if (result.rowCount === 0) {
                throw new Error('Member not found in ring group');
            }
        });
    }
    // Update ring group member settings
    async updateMember(ringGroupId, extensionId, memberData) {
        return (0, database_1.withTransaction)(async (client) => {
            const result = await client.query(`UPDATE ring_group_members SET 
          priority = COALESCE($1, priority),
          ring_delay = COALESCE($2, ring_delay),
          ring_timeout = COALESCE($3, ring_timeout),
          enabled = COALESCE($4, enabled),
          settings = COALESCE($5, settings),
          updated_at = CURRENT_TIMESTAMP
        WHERE ring_group_id = $6 AND extension_id = $7
        RETURNING *`, [
                memberData.priority,
                memberData.ring_delay,
                memberData.ring_timeout,
                memberData.enabled,
                memberData.settings ? JSON.stringify(memberData.settings) : null,
                ringGroupId,
                extensionId
            ]);
            if (result.rows.length === 0) {
                throw new Error('Member not found in ring group');
            }
            return this.mapRowToRingGroupMember(result.rows[0]);
        });
    }
    // Update ring group
    async updateRingGroup(ringGroupId, updateData) {
        return (0, database_1.withTransaction)(async (client) => {
            const updateFields = [];
            const updateValues = [];
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
            if (updateData.ring_time !== undefined) {
                updateFields.push(`ring_time = $${paramCount++}`);
                updateValues.push(updateData.ring_time);
            }
            if (updateData.moh_sound !== undefined) {
                updateFields.push(`moh_sound = $${paramCount++}`);
                updateValues.push(updateData.moh_sound);
            }
            if (updateData.voicemail_enabled !== undefined) {
                updateFields.push(`voicemail_enabled = $${paramCount++}`);
                updateValues.push(updateData.voicemail_enabled);
            }
            if (updateData.call_timeout !== undefined) {
                updateFields.push(`call_timeout = $${paramCount++}`);
                updateValues.push(updateData.call_timeout);
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
            updateValues.push(ringGroupId);
            const result = await client.query(`UPDATE ring_groups SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`, updateValues);
            if (result.rows.length === 0) {
                throw new Error('Ring group not found');
            }
            return this.mapRowToRingGroup(result.rows[0]);
        });
    }
    // Delete ring group
    async deleteRingGroup(ringGroupId) {
        return (0, database_1.withTransaction)(async (client) => {
            const result = await client.query('DELETE FROM ring_groups WHERE id = $1', [ringGroupId]);
            if (result.rowCount === 0) {
                throw new Error('Ring group not found');
            }
        });
    }
    // Get ring group call logs
    async getCallLogs(ringGroupId, limit = 50, offset = 0) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`SELECT * FROM ring_group_call_logs 
         WHERE ring_group_id = $1 
         ORDER BY start_time DESC 
         LIMIT $2 OFFSET $3`, [ringGroupId, limit, offset]);
            return result.rows.map((row) => this.mapRowToRingGroupCallLog(row));
        }
        finally {
            client.release();
        }
    }
    // Log ring group call
    async logCall(callData) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`SELECT log_ring_group_call($1, $2, $3, $4, $5, $6)`, [
                callData.ring_group_id,
                callData.call_uuid,
                callData.caller_id_name,
                callData.caller_id_number,
                callData.destination_number,
                callData.settings ? JSON.stringify(callData.settings) : '{}'
            ]);
            return result.rows[0].log_ring_group_call;
        }
        finally {
            client.release();
        }
    }
    // Update ring group call log
    async updateCallLog(callUuid, updateData) {
        const client = await (0, database_1.getClient)();
        try {
            await client.query(`SELECT update_ring_group_call_log($1, $2, $3, $4, $5, $6, $7)`, [
                callUuid,
                updateData.end_time,
                updateData.duration,
                updateData.hangup_cause,
                updateData.answered_by_extension,
                updateData.answered_by_name,
                updateData.recording_path
            ]);
        }
        finally {
            client.release();
        }
    }
    // Generate FreeSWITCH dialplan XML for ring group
    generateRingGroupXML(ringGroup) {
        let xml = `
  <!-- Ring Group: ${ringGroup.name} (${ringGroup.extension}) -->
  <extension name="ring_group_${ringGroup.id}">
    <condition field="destination_number" expression="^${ringGroup.extension}$">
      <action application="answer"/>
      <action application="set" data="ring_group_id=${ringGroup.id}"/>
      <action application="set" data="ring_group_name=${ringGroup.name}"/>
      <action application="set" data="call_timeout=${ringGroup.call_timeout}"/>`;
        // Add caller ID settings
        if (ringGroup.caller_id_name) {
            xml += `
      <action application="set" data="effective_caller_id_name=${ringGroup.caller_id_name}"/>`;
        }
        if (ringGroup.caller_id_number) {
            xml += `
      <action application="set" data="effective_caller_id_number=${ringGroup.caller_id_number}"/>`;
        }
        // Add music on hold if specified
        if (ringGroup.moh_sound) {
            xml += `
      <action application="set" data="moh_sound=${ringGroup.moh_sound}"/>`;
        }
        // Generate ring strategy based on configuration
        switch (ringGroup.strategy) {
            case 'ringall':
                xml += this.generateRingAllXML(ringGroup);
                break;
            case 'hunt':
                xml += this.generateHuntXML(ringGroup);
                break;
            case 'random':
                xml += this.generateRandomXML(ringGroup);
                break;
            case 'simultaneous':
                xml += this.generateSimultaneousXML(ringGroup);
                break;
        }
        // Add timeout action
        xml += this.generateTimeoutActionXML(ringGroup);
        xml += `
    </condition>
  </extension>`;
        return xml;
    }
    // Generate ring-all strategy XML
    generateRingAllXML(ringGroup) {
        const members = ringGroup.members.filter(m => m.enabled);
        if (members.length === 0) {
            return `
      <action application="log" data="ERROR No active members in ring group ${ringGroup.name}"/>
      <action application="hangup" data="NO_ANSWER"/>`;
        }
        const bridgeTargets = members
            .map(m => `user/${m.extension}@\${domain_name}`)
            .join(' ');
        return `
      <action application="bridge" data="${bridgeTargets}"/>`;
    }
    // Generate hunt strategy XML (sequential ringing)
    generateHuntXML(ringGroup) {
        const members = ringGroup.members.filter(m => m.enabled).sort((a, b) => a.priority - b.priority);
        if (members.length === 0) {
            return `
      <action application="log" data="ERROR No active members in ring group ${ringGroup.name}"/>
      <action application="hangup" data="NO_ANSWER"/>`;
        }
        let xml = '';
        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            const isLast = i === members.length - 1;
            xml += `
      <action application="bridge" data="user/${member.extension}@\${domain_name}"/>`;
            if (!isLast) {
                xml += `
      <action application="hangup" data="NORMAL_CLEARING"/>
      <condition field="hangup_cause" expression="NO_ANSWER|USER_BUSY|UNALLOCATED_NUMBER">
        <action application="log" data="INFO Trying next member in hunt sequence"/>`;
            }
        }
        // Close conditions
        for (let i = 0; i < members.length - 1; i++) {
            xml += `
      </condition>`;
        }
        return xml;
    }
    // Generate random strategy XML
    generateRandomXML(ringGroup) {
        const members = ringGroup.members.filter(m => m.enabled);
        if (members.length === 0) {
            return `
      <action application="log" data="ERROR No active members in ring group ${ringGroup.name}"/>
      <action application="hangup" data="NO_ANSWER"/>`;
        }
        // For random strategy, we'll use ringall but shuffle the order
        // In a real implementation, you might want to implement proper randomization
        return this.generateRingAllXML(ringGroup);
    }
    // Generate simultaneous strategy XML
    generateSimultaneousXML(ringGroup) {
        return this.generateRingAllXML(ringGroup);
    }
    // Generate timeout action XML
    generateTimeoutActionXML(ringGroup) {
        switch (ringGroup.call_timeout_action) {
            case 'voicemail':
                if (ringGroup.voicemail_enabled && ringGroup.voicemail_extension) {
                    return `
      <condition field="hangup_cause" expression="NO_ANSWER|TIMEOUT">
        <action application="voicemail" data="default \${domain_name} ${ringGroup.voicemail_extension}"/>
        <action application="hangup" data="NORMAL_CLEARING"/>
      </condition>`;
                }
                break;
            case 'forward':
                if (ringGroup.call_timeout_destination) {
                    return `
      <condition field="hangup_cause" expression="NO_ANSWER|TIMEOUT">
        <action application="bridge" data="user/${ringGroup.call_timeout_destination}@\${domain_name}"/>
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
    mapRowToRingGroup(row) {
        return {
            id: row.id,
            tenant_id: row.tenant_id,
            store_id: row.store_id,
            name: row.name,
            description: row.description,
            extension: row.extension,
            strategy: row.strategy,
            ring_time: row.ring_time,
            members: typeof row.members === 'string' ? JSON.parse(row.members) : row.members,
            member_settings: typeof row.member_settings === 'string' ? JSON.parse(row.member_settings) : row.member_settings,
            moh_sound: row.moh_sound,
            voicemail_enabled: row.voicemail_enabled,
            voicemail_extension: row.voicemail_extension,
            voicemail_password: row.voicemail_password,
            voicemail_email: row.voicemail_email,
            call_timeout: row.call_timeout,
            call_timeout_action: row.call_timeout_action,
            call_timeout_destination: row.call_timeout_destination,
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
    mapRowToRingGroupMember(row) {
        return {
            id: row.id,
            ring_group_id: row.ring_group_id,
            extension_id: row.extension_id,
            priority: row.priority,
            ring_delay: row.ring_delay,
            ring_timeout: row.ring_timeout,
            enabled: row.enabled,
            settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }
    mapRowToRingGroupCallLog(row) {
        return {
            id: row.id,
            ring_group_id: row.ring_group_id,
            call_uuid: row.call_uuid,
            caller_id_name: row.caller_id_name,
            caller_id_number: row.caller_id_number,
            destination_number: row.destination_number,
            start_time: row.start_time,
            end_time: row.end_time,
            duration: row.duration,
            hangup_cause: row.hangup_cause,
            answered_by_extension: row.answered_by_extension,
            answered_by_name: row.answered_by_name,
            recording_path: row.recording_path,
            settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
            created_at: row.created_at
        };
    }
}
exports.RingGroupService = RingGroupService;
// Export singleton instance
exports.ringGroupService = new RingGroupService();
//# sourceMappingURL=ring-group.service.js.map