import { getClient, withTransaction } from '@w3-voip/database';
import { v4 as uuidv4 } from 'uuid';

export interface ConferenceRoom {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  extension: string;
  pin?: string;
  moderator_pin?: string;
  max_members: number;
  record: boolean;
  record_path?: string;
  moh_sound?: string;
  announce_sound?: string;
  settings: any;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ConferenceMember {
  id: string;
  conference_id: string;
  extension: string;
  caller_id_name?: string;
  caller_id_number?: string;
  join_time: Date;
  leave_time?: Date;
  is_moderator: boolean;
  is_muted: boolean;
  is_deaf: boolean;
  member_flags?: string;
  created_at: Date;
}

export class ConferenceService {
  private mapRowToConferenceRoom(row: any): ConferenceRoom {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      name: row.name,
      description: row.description,
      extension: row.extension,
      pin: row.pin,
      moderator_pin: row.moderator_pin,
      max_members: row.max_members,
      record: row.record,
      record_path: row.record_path,
      moh_sound: row.moh_sound,
      announce_sound: row.announce_sound,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
      enabled: row.enabled,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapRowToConferenceMember(row: any): ConferenceMember {
    return {
      id: row.id,
      conference_id: row.conference_id,
      extension: row.extension,
      caller_id_name: row.caller_id_name,
      caller_id_number: row.caller_id_number,
      join_time: row.join_time,
      leave_time: row.leave_time,
      is_moderator: row.is_moderator,
      is_muted: row.is_muted,
      is_deaf: row.is_deaf,
      member_flags: row.member_flags,
      created_at: row.created_at,
    };
  }

  async createConferenceRoom(conferenceRoomData: Omit<ConferenceRoom, 'id' | 'created_at' | 'updated_at'>): Promise<ConferenceRoom> {
    return withTransaction(async (client) => {
      // Check if extension is already taken
      const existingRoom = await client.query(
        `SELECT id FROM conference_rooms WHERE extension = $1 AND tenant_id = $2`,
        [conferenceRoomData.extension, conferenceRoomData.tenant_id]
      );
      
      if (existingRoom.rows.length > 0) {
        throw new Error(`Extension ${conferenceRoomData.extension} is already in use`);
      }

      const result = await client.query(
        `INSERT INTO conference_rooms (tenant_id, name, description, extension, pin, moderator_pin, max_members, record, record_path, moh_sound, announce_sound, settings, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          conferenceRoomData.tenant_id,
          conferenceRoomData.name,
          conferenceRoomData.description,
          conferenceRoomData.extension,
          conferenceRoomData.pin,
          conferenceRoomData.moderator_pin,
          conferenceRoomData.max_members,
          conferenceRoomData.record,
          conferenceRoomData.record_path,
          conferenceRoomData.moh_sound,
          conferenceRoomData.announce_sound,
          JSON.stringify(conferenceRoomData.settings),
          conferenceRoomData.enabled,
        ]
      );
      return this.mapRowToConferenceRoom(result.rows[0]);
    });
  }

  async getConferenceRoomById(id: string, tenantId: string): Promise<ConferenceRoom | undefined> {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT * FROM conference_rooms WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      return result.rows.length > 0 ? this.mapRowToConferenceRoom(result.rows[0]) : undefined;
    } finally {
      client.release();
    }
  }

  async getConferenceRoomByExtension(extension: string, tenantId: string): Promise<ConferenceRoom | undefined> {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT * FROM conference_rooms WHERE extension = $1 AND tenant_id = $2 AND enabled = true`,
        [extension, tenantId]
      );
      return result.rows.length > 0 ? this.mapRowToConferenceRoom(result.rows[0]) : undefined;
    } finally {
      client.release();
    }
  }

  async listConferenceRooms(tenantId: string): Promise<ConferenceRoom[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT * FROM conference_rooms WHERE tenant_id = $1 ORDER BY name ASC`,
        [tenantId]
      );
      return result.rows.map((row: any) => this.mapRowToConferenceRoom(row));
    } finally {
      client.release();
    }
  }

  async updateConferenceRoom(id: string, tenantId: string, updateData: Partial<Omit<ConferenceRoom, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>): Promise<ConferenceRoom | undefined> {
    return withTransaction(async (client) => {
      // Check if extension is already taken by another room
      if (updateData.extension) {
        const existingRoom = await client.query(
          `SELECT id FROM conference_rooms WHERE extension = $1 AND tenant_id = $2 AND id != $3`,
          [updateData.extension, tenantId, id]
        );
        
        if (existingRoom.rows.length > 0) {
          throw new Error(`Extension ${updateData.extension} is already in use`);
        }
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      if (updateData.name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        updateValues.push(updateData.name);
      }
      if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        updateValues.push(updateData.description);
      }
      if (updateData.extension !== undefined) {
        updateFields.push(`extension = $${paramCount++}`);
        updateValues.push(updateData.extension);
      }
      if (updateData.pin !== undefined) {
        updateFields.push(`pin = $${paramCount++}`);
        updateValues.push(updateData.pin);
      }
      if (updateData.moderator_pin !== undefined) {
        updateFields.push(`moderator_pin = $${paramCount++}`);
        updateValues.push(updateData.moderator_pin);
      }
      if (updateData.max_members !== undefined) {
        updateFields.push(`max_members = $${paramCount++}`);
        updateValues.push(updateData.max_members);
      }
      if (updateData.record !== undefined) {
        updateFields.push(`record = $${paramCount++}`);
        updateValues.push(updateData.record);
      }
      if (updateData.record_path !== undefined) {
        updateFields.push(`record_path = $${paramCount++}`);
        updateValues.push(updateData.record_path);
      }
      if (updateData.moh_sound !== undefined) {
        updateFields.push(`moh_sound = $${paramCount++}`);
        updateValues.push(updateData.moh_sound);
      }
      if (updateData.announce_sound !== undefined) {
        updateFields.push(`announce_sound = $${paramCount++}`);
        updateValues.push(updateData.announce_sound);
      }
      if (updateData.settings !== undefined) {
        updateFields.push(`settings = $${paramCount++}`);
        updateValues.push(JSON.stringify(updateData.settings));
      }
      if (updateData.enabled !== undefined) {
        updateFields.push(`enabled = $${paramCount++}`);
        updateValues.push(updateData.enabled);
      }

      if (updateFields.length === 0) {
        return this.getConferenceRoomById(id, tenantId);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id, tenantId);

      const query = `
        UPDATE conference_rooms 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
        RETURNING *
      `;

      const result = await client.query(query, updateValues);
      return result.rows.length > 0 ? this.mapRowToConferenceRoom(result.rows[0]) : undefined;
    });
  }

  async deleteConferenceRoom(id: string, tenantId: string): Promise<boolean> {
    return withTransaction(async (client) => {
      const result = await client.query(
        `DELETE FROM conference_rooms WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      return result.rowCount > 0;
    });
  }

  async getConferenceMembers(conferenceId: string, tenantId: string): Promise<ConferenceMember[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT cm.* FROM conference_members cm
         JOIN conference_rooms cr ON cm.conference_id = cr.id
         WHERE cm.conference_id = $1 AND cr.tenant_id = $2 AND cm.leave_time IS NULL
         ORDER BY cm.join_time ASC`,
        [conferenceId, tenantId]
      );
      return result.rows.map((row: any) => this.mapRowToConferenceMember(row));
    } finally {
      client.release();
    }
  }

  async addConferenceMember(conferenceId: string, tenantId: string, memberData: {
    extension: string;
    caller_id_name?: string;
    caller_id_number?: string;
    is_moderator?: boolean;
  }): Promise<ConferenceMember> {
    return withTransaction(async (client) => {
      // Verify conference exists and belongs to tenant
      const conference = await client.query(
        `SELECT id FROM conference_rooms WHERE id = $1 AND tenant_id = $2`,
        [conferenceId, tenantId]
      );
      
      if (conference.rows.length === 0) {
        throw new Error('Conference room not found');
      }

      const result = await client.query(
        `INSERT INTO conference_members (conference_id, extension, caller_id_name, caller_id_number, is_moderator)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          conferenceId,
          memberData.extension,
          memberData.caller_id_name,
          memberData.caller_id_number,
          memberData.is_moderator || false,
        ]
      );
      return this.mapRowToConferenceMember(result.rows[0]);
    });
  }

  async removeConferenceMember(conferenceId: string, tenantId: string, memberId: string): Promise<boolean> {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE conference_members 
         SET leave_time = CURRENT_TIMESTAMP
         WHERE id = $1 AND conference_id = $2 AND conference_id IN (
           SELECT id FROM conference_rooms WHERE tenant_id = $3
         )`,
        [memberId, conferenceId, tenantId]
      );
      return result.rowCount > 0;
    });
  }

  async updateMemberStatus(conferenceId: string, tenantId: string, memberId: string, updates: {
    is_muted?: boolean;
    is_deaf?: boolean;
    is_moderator?: boolean;
  }): Promise<boolean> {
    return withTransaction(async (client) => {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      if (updates.is_muted !== undefined) {
        updateFields.push(`is_muted = $${paramCount++}`);
        updateValues.push(updates.is_muted);
      }
      if (updates.is_deaf !== undefined) {
        updateFields.push(`is_deaf = $${paramCount++}`);
        updateValues.push(updates.is_deaf);
      }
      if (updates.is_moderator !== undefined) {
        updateFields.push(`is_moderator = $${paramCount++}`);
        updateValues.push(updates.is_moderator);
      }

      if (updateFields.length === 0) {
        return true;
      }

      updateValues.push(memberId, conferenceId, tenantId);

      const query = `
        UPDATE conference_members 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount++} AND conference_id = $${paramCount++} AND conference_id IN (
          SELECT id FROM conference_rooms WHERE tenant_id = $${paramCount++}
        )
      `;

      const result = await client.query(query, updateValues);
      return result.rowCount > 0;
    });
  }

  async validateConferenceRoom(conferenceRoom: Partial<ConferenceRoom>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!conferenceRoom.name || conferenceRoom.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!conferenceRoom.extension || conferenceRoom.extension.trim().length === 0) {
      errors.push('Extension is required');
    } else if (!/^\d{3,4}$/.test(conferenceRoom.extension)) {
      errors.push('Extension must be 3-4 digits');
    }

    if (conferenceRoom.max_members !== undefined && (conferenceRoom.max_members < 2 || conferenceRoom.max_members > 1000)) {
      errors.push('Max members must be between 2-1000');
    }

    if (conferenceRoom.pin && !/^\d{4,8}$/.test(conferenceRoom.pin)) {
      errors.push('PIN must be 4-8 digits');
    }

    if (conferenceRoom.moderator_pin && !/^\d{4,8}$/.test(conferenceRoom.moderator_pin)) {
      errors.push('Moderator PIN must be 4-8 digits');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async getActiveConferenceRooms(tenantId: string): Promise<ConferenceRoom[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT * FROM conference_rooms WHERE tenant_id = $1 AND enabled = true ORDER BY extension ASC`,
        [tenantId]
      );
      return result.rows.map((row: any) => this.mapRowToConferenceRoom(row));
    } finally {
      client.release();
    }
  }

  async generateFreeSwitchXml(conferenceRoom: ConferenceRoom): Promise<string> {
    const settings = conferenceRoom.settings || {};
    
    return `<?xml version="1.0" encoding="utf-8"?>
<include>
  <extension name="conference_${conferenceRoom.extension}">
    <condition field="destination_number" expression="^${conferenceRoom.extension}$">
      <action application="answer"/>
      <action application="sleep" data="1000"/>
      <action application="conference" data="${conferenceRoom.extension}@default+flags{
        ${conferenceRoom.pin ? `pin=${conferenceRoom.pin}` : ''}
        ${conferenceRoom.moderator_pin ? `moderator-pin=${conferenceRoom.moderator_pin}` : ''}
        ${conferenceRoom.record ? `record=${conferenceRoom.record_path || `/recordings/conference_${conferenceRoom.extension}_${new Date().toISOString().split('T')[0]}.wav`}` : ''}
        ${conferenceRoom.moh_sound ? `moh-sound=${conferenceRoom.moh_sound}` : ''}
        ${conferenceRoom.announce_sound ? `announce-sound=${conferenceRoom.announce_sound}` : ''}
        max-members=${conferenceRoom.max_members}
        ${settings.auto_record ? 'auto-record' : ''}
        ${settings.auto_mute ? 'auto-mute' : ''}
        ${settings.wait_for_moderator ? 'wait-for-moderator' : ''}
      }"/>
    </condition>
  </extension>
</include>`;
  }

  async getConferenceStatistics(conferenceId: string, tenantId: string): Promise<{
    total_members: number;
    active_members: number;
    moderators: number;
    average_duration: number;
    total_calls: number;
  }> {
    const client = await getClient();
    try {
      const result = await client.query(
        `SELECT 
          COUNT(*) as total_members,
          COUNT(CASE WHEN leave_time IS NULL THEN 1 END) as active_members,
          COUNT(CASE WHEN is_moderator = true AND leave_time IS NULL THEN 1 END) as moderators,
          AVG(EXTRACT(EPOCH FROM (COALESCE(leave_time, CURRENT_TIMESTAMP) - join_time))) as average_duration
         FROM conference_members cm
         JOIN conference_rooms cr ON cm.conference_id = cr.id
         WHERE cm.conference_id = $1 AND cr.tenant_id = $2`,
        [conferenceId, tenantId]
      );

      const stats = result.rows[0];
      return {
        total_members: parseInt(stats.total_members),
        active_members: parseInt(stats.active_members),
        moderators: parseInt(stats.moderators),
        average_duration: parseFloat(stats.average_duration) || 0,
        total_calls: parseInt(stats.total_members), // Same as total members for now
      };
    } finally {
      client.release();
    }
  }
}
