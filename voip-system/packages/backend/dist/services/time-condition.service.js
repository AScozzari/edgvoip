"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeConditionService = void 0;
const database_1 = require("@w3-voip/database");
class TimeConditionService {
    mapRowToTimeCondition(row) {
        return {
            id: row.id,
            tenant_id: row.tenant_id,
            name: row.name,
            description: row.description,
            timezone: row.timezone,
            conditions: typeof row.conditions === 'string' ? JSON.parse(row.conditions) : row.conditions,
            action_true: typeof row.action_true === 'string' ? JSON.parse(row.action_true) : row.action_true,
            action_false: typeof row.action_false === 'string' ? JSON.parse(row.action_false) : row.action_false,
            enabled: row.enabled,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
    async createTimeCondition(timeConditionData) {
        return (0, database_1.withTransaction)(async (client) => {
            const result = await client.query(`INSERT INTO time_conditions (tenant_id, name, description, timezone, conditions, action_true, action_false, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`, [
                timeConditionData.tenant_id,
                timeConditionData.name,
                timeConditionData.description,
                timeConditionData.timezone,
                JSON.stringify(timeConditionData.conditions),
                JSON.stringify(timeConditionData.action_true),
                JSON.stringify(timeConditionData.action_false),
                timeConditionData.enabled,
            ]);
            return this.mapRowToTimeCondition(result.rows[0]);
        });
    }
    async getTimeConditionById(id, tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`SELECT * FROM time_conditions WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
            return result.rows.length > 0 ? this.mapRowToTimeCondition(result.rows[0]) : undefined;
        }
        finally {
            client.release();
        }
    }
    async listTimeConditions(tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`SELECT * FROM time_conditions WHERE tenant_id = $1 ORDER BY name ASC`, [tenantId]);
            return result.rows.map((row) => this.mapRowToTimeCondition(row));
        }
        finally {
            client.release();
        }
    }
    async updateTimeCondition(id, tenantId, updateData) {
        return (0, database_1.withTransaction)(async (client) => {
            const updateFields = [];
            const updateValues = [];
            let paramCount = 1;
            if (updateData.name !== undefined) {
                updateFields.push(`name = $${paramCount++}`);
                updateValues.push(updateData.name);
            }
            if (updateData.description !== undefined) {
                updateFields.push(`description = $${paramCount++}`);
                updateValues.push(updateData.description);
            }
            if (updateData.timezone !== undefined) {
                updateFields.push(`timezone = $${paramCount++}`);
                updateValues.push(updateData.timezone);
            }
            if (updateData.conditions !== undefined) {
                updateFields.push(`conditions = $${paramCount++}`);
                updateValues.push(JSON.stringify(updateData.conditions));
            }
            if (updateData.action_true !== undefined) {
                updateFields.push(`action_true = $${paramCount++}`);
                updateValues.push(JSON.stringify(updateData.action_true));
            }
            if (updateData.action_false !== undefined) {
                updateFields.push(`action_false = $${paramCount++}`);
                updateValues.push(JSON.stringify(updateData.action_false));
            }
            if (updateData.enabled !== undefined) {
                updateFields.push(`enabled = $${paramCount++}`);
                updateValues.push(updateData.enabled);
            }
            if (updateFields.length === 0) {
                return this.getTimeConditionById(id, tenantId);
            }
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(id, tenantId);
            const query = `
        UPDATE time_conditions 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
        RETURNING *
      `;
            const result = await client.query(query, updateValues);
            return result.rows.length > 0 ? this.mapRowToTimeCondition(result.rows[0]) : undefined;
        });
    }
    async deleteTimeCondition(id, tenantId) {
        return (0, database_1.withTransaction)(async (client) => {
            const result = await client.query(`DELETE FROM time_conditions WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
            return result.rowCount > 0;
        });
    }
    async evaluateTimeCondition(id, tenantId) {
        const timeCondition = await this.getTimeConditionById(id, tenantId);
        if (!timeCondition || !timeCondition.enabled) {
            return { condition: false, action: null };
        }
        const now = new Date();
        const currentDay = now.getDay(); // 0-6 (Sunday-Saturday)
        const currentTime = now.toLocaleTimeString('en-US', {
            hour12: false,
            timeZone: timeCondition.timezone
        }).substring(0, 5); // HH:MM format
        // Check if any condition matches
        for (const condition of timeCondition.conditions) {
            if (!condition.is_active)
                continue;
            // Check day of week
            if (condition.day_of_week !== currentDay)
                continue;
            // Check time range
            if (currentTime >= condition.start_time && currentTime <= condition.end_time) {
                return { condition: true, action: timeCondition.action_true };
            }
        }
        return { condition: false, action: timeCondition.action_false };
    }
    async validateTimeCondition(timeCondition) {
        const errors = [];
        if (!timeCondition.name || timeCondition.name.trim().length === 0) {
            errors.push('Name is required');
        }
        if (!timeCondition.timezone) {
            errors.push('Timezone is required');
        }
        if (!timeCondition.conditions || timeCondition.conditions.length === 0) {
            errors.push('At least one time condition is required');
        }
        else {
            timeCondition.conditions.forEach((condition, index) => {
                if (condition.day_of_week < 0 || condition.day_of_week > 6) {
                    errors.push(`Condition ${index + 1}: Day of week must be between 0-6`);
                }
                if (!condition.start_time || !condition.end_time) {
                    errors.push(`Condition ${index + 1}: Start time and end time are required`);
                }
                else {
                    const startTime = condition.start_time;
                    const endTime = condition.end_time;
                    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
                        errors.push(`Condition ${index + 1}: Invalid start time format (use HH:MM)`);
                    }
                    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
                        errors.push(`Condition ${index + 1}: Invalid end time format (use HH:MM)`);
                    }
                    if (startTime >= endTime) {
                        errors.push(`Condition ${index + 1}: Start time must be before end time`);
                    }
                }
            });
        }
        if (!timeCondition.action_true || !timeCondition.action_true.type) {
            errors.push('True action is required');
        }
        if (!timeCondition.action_false || !timeCondition.action_false.type) {
            errors.push('False action is required');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    async getActiveTimeConditions(tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`SELECT * FROM time_conditions WHERE tenant_id = $1 AND enabled = true ORDER BY name ASC`, [tenantId]);
            return result.rows.map((row) => this.mapRowToTimeCondition(row));
        }
        finally {
            client.release();
        }
    }
}
exports.TimeConditionService = TimeConditionService;
//# sourceMappingURL=time-condition.service.js.map