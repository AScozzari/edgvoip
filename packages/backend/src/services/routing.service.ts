import { getClient } from '@w3-voip/database';
import { v4 as uuidv4 } from 'uuid';

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

export class RoutingService {
  // ==================== INBOUND ROUTES ====================

  async createInboundRoute(route: Partial<InboundRoute>): Promise<InboundRoute> {
    const client = await getClient();
    try {
      const id = route.id || uuidv4();
      const result = await client.query(
        `INSERT INTO inbound_routes (
          id, tenant_id, store_id, name, description, did_number, caller_id_pattern,
          destination_type, destination_value, time_condition_id, enabled,
          caller_id_override, caller_id_name_override, caller_id_number_override,
          record_calls, recording_path, failover_enabled, failover_destination_type, failover_destination_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          id, route.tenant_id, route.store_id || null, route.name, route.description || null,
          route.did_number || null, route.caller_id_pattern || null, route.destination_type,
          route.destination_value, route.time_condition_id || null, route.enabled !== false,
          route.caller_id_override || false, route.caller_id_name_override || null,
          route.caller_id_number_override || null, route.record_calls || false,
          route.recording_path || null, route.failover_enabled || false,
          route.failover_destination_type || null, route.failover_destination_value || null
        ]
      );
      return result.rows[0];
    } finally {
      await client.release();
    }
  }

  async getInboundRoutes(tenantId: string): Promise<InboundRoute[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        'SELECT * FROM inbound_routes WHERE tenant_id = $1 ORDER BY name',
        [tenantId]
      );
      return result.rows;
    } finally {
      await client.release();
    }
  }

  async getInboundRouteById(id: string): Promise<InboundRoute | null> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM inbound_routes WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      await client.release();
    }
  }

  async updateInboundRoute(id: string, updates: Partial<InboundRoute>): Promise<InboundRoute> {
    const client = await getClient();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) {
          fields.push(`${key} = $${paramCount++}`);
          values.push(value);
        }
      });

      if (fields.length === 0) throw new Error('No fields to update');

      values.push(id);
      const result = await client.query(
        `UPDATE inbound_routes SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) throw new Error('Inbound route not found');
      return result.rows[0];
    } finally {
      await client.release();
    }
  }

  async deleteInboundRoute(id: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('DELETE FROM inbound_routes WHERE id = $1', [id]);
    } finally {
      await client.release();
    }
  }

  // ==================== OUTBOUND ROUTES ====================

  async createOutboundRoute(route: Partial<OutboundRoute>): Promise<OutboundRoute> {
    const client = await getClient();
    try {
      const id = route.id || uuidv4();
      const result = await client.query(
        `INSERT INTO outbound_routes (
          id, tenant_id, store_id, name, description, dial_pattern, caller_id_name, caller_id_number,
          trunk_id, prefix, strip_digits, add_digits, priority, enabled, caller_id_override,
          caller_id_name_override, caller_id_number_override, record_calls, recording_path, failover_trunk_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          id, route.tenant_id, route.store_id || null, route.name, route.description || null,
          route.dial_pattern, route.caller_id_name || null, route.caller_id_number || null,
          route.trunk_id, route.prefix || null, route.strip_digits || 0, route.add_digits || null,
          route.priority || 100, route.enabled !== false, route.caller_id_override || false,
          route.caller_id_name_override || null, route.caller_id_number_override || null,
          route.record_calls || false, route.recording_path || null, route.failover_trunk_id || null
        ]
      );
      return result.rows[0];
    } finally {
      await client.release();
    }
  }

  async getOutboundRoutes(tenantId: string): Promise<OutboundRoute[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        'SELECT * FROM outbound_routes WHERE tenant_id = $1 ORDER BY priority ASC',
        [tenantId]
      );
      return result.rows;
    } finally {
      await client.release();
    }
  }

  async updateOutboundRoute(id: string, updates: Partial<OutboundRoute>): Promise<OutboundRoute> {
    const client = await getClient();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) {
          fields.push(`${key} = $${paramCount++}`);
          values.push(value);
        }
      });

      if (fields.length === 0) throw new Error('No fields to update');

      values.push(id);
      const result = await client.query(
        `UPDATE outbound_routes SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) throw new Error('Outbound route not found');
      return result.rows[0];
    } finally {
      await client.release();
    }
  }

  async deleteOutboundRoute(id: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('DELETE FROM outbound_routes WHERE id = $1', [id]);
    } finally {
      await client.release();
    }
  }

  // ==================== TIME CONDITIONS ====================

  async createTimeCondition(condition: Partial<TimeCondition>): Promise<TimeCondition> {
    const client = await getClient();
    try {
      const id = condition.id || uuidv4();
      const result = await client.query(
        `INSERT INTO time_conditions (
          id, tenant_id, store_id, name, description, timezone, business_hours, holidays,
          business_hours_action, business_hours_destination, after_hours_action, after_hours_destination,
          holiday_action, holiday_destination, enabled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          id, condition.tenant_id, condition.store_id || null, condition.name, condition.description || null,
          condition.timezone || 'UTC', JSON.stringify(condition.business_hours || {}),
          JSON.stringify(condition.holidays || []), condition.business_hours_action || 'continue',
          condition.business_hours_destination || null, condition.after_hours_action || 'voicemail',
          condition.after_hours_destination || null, condition.holiday_action || 'voicemail',
          condition.holiday_destination || null, condition.enabled !== false
        ]
      );
      return result.rows[0];
    } finally {
      await client.release();
    }
  }

  async getTimeConditions(tenantId: string): Promise<TimeCondition[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        'SELECT * FROM time_conditions WHERE tenant_id = $1 ORDER BY name',
        [tenantId]
      );
      return result.rows;
    } finally {
      await client.release();
    }
  }

  async updateTimeCondition(id: string, updates: Partial<TimeCondition>): Promise<TimeCondition> {
    const client = await getClient();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) {
          if (key === 'business_hours' || key === 'holidays') {
            fields.push(`${key} = $${paramCount++}`);
            values.push(JSON.stringify(value));
          } else {
            fields.push(`${key} = $${paramCount++}`);
            values.push(value);
          }
        }
      });

      if (fields.length === 0) throw new Error('No fields to update');

      values.push(id);
      const result = await client.query(
        `UPDATE time_conditions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) throw new Error('Time condition not found');
      return result.rows[0];
    } finally {
      await client.release();
    }
  }

  async deleteTimeCondition(id: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('DELETE FROM time_conditions WHERE id = $1', [id]);
    } finally {
      await client.release();
    }
  }

  // ==================== UTILITY ====================

  /**
   * Normalize phone number (remove +39, add prefixes, etc.)
   */
  normalizeCallerNumber(number: string, countryCode: string = '39'): string {
    // Remove all non-digits
    let normalized = number.replace(/\D/g, '');

    // Remove leading +
    if (normalized.startsWith('+')) {
      normalized = normalized.substring(1);
    }

    // Remove country code if present
    if (normalized.startsWith(countryCode)) {
      normalized = normalized.substring(countryCode.length);
    }

    // Remove leading 0 for Italian numbers
    if (normalized.startsWith('0')) {
      normalized = normalized.substring(1);
    }

    return normalized;
  }

  /**
   * Check if current time matches business hours
   */
  checkTimeMatch(condition: TimeCondition, date: Date = new Date()): 'business' | 'after_hours' | 'holiday' {
    // Check holidays first
    if (condition.holidays && Array.isArray(condition.holidays)) {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const holiday = condition.holidays.find(
        (h: any) => h.enabled && h.date === dateStr
      );
      if (holiday) return 'holiday';
    }

    // Check business hours
    if (condition.business_hours) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      const daySchedule = (condition.business_hours as any)[dayName];

      if (daySchedule && daySchedule.enabled) {
        const currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        if (currentTime >= daySchedule.start_time && currentTime <= daySchedule.end_time) {
          return 'business';
        }
      }
    }

    return 'after_hours';
  }
}

