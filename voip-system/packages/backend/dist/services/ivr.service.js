"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IvrService = void 0;
const database_1 = require("@w3-voip/database");
class IvrService {
    mapRowToIvrMenu(row) {
        return {
            id: row.id,
            tenant_id: row.tenant_id,
            name: row.name,
            description: row.description,
            extension: row.extension,
            greeting_sound: row.greeting_sound,
            invalid_sound: row.invalid_sound,
            exit_sound: row.exit_sound,
            timeout: row.timeout,
            max_failures: row.max_failures,
            timeout_action: typeof row.timeout_action === 'string' ? JSON.parse(row.timeout_action) : row.timeout_action,
            invalid_action: typeof row.invalid_action === 'string' ? JSON.parse(row.invalid_action) : row.invalid_action,
            options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
            enabled: row.enabled,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
    async createIvrMenu(ivrMenuData) {
        return (0, database_1.withTransaction)(async (client) => {
            // Check if extension is already taken
            const existingMenu = await client.query(`SELECT id FROM ivr_menus WHERE extension = $1 AND tenant_id = $2`, [ivrMenuData.extension, ivrMenuData.tenant_id]);
            if (existingMenu.rows.length > 0) {
                throw new Error(`Extension ${ivrMenuData.extension} is already in use`);
            }
            const result = await client.query(`INSERT INTO ivr_menus (tenant_id, name, description, extension, greeting_sound, invalid_sound, exit_sound, timeout, max_failures, timeout_action, invalid_action, options, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`, [
                ivrMenuData.tenant_id,
                ivrMenuData.name,
                ivrMenuData.description,
                ivrMenuData.extension,
                ivrMenuData.greeting_sound,
                ivrMenuData.invalid_sound,
                ivrMenuData.exit_sound,
                ivrMenuData.timeout,
                ivrMenuData.max_failures,
                JSON.stringify(ivrMenuData.timeout_action),
                JSON.stringify(ivrMenuData.invalid_action),
                JSON.stringify(ivrMenuData.options),
                ivrMenuData.enabled,
            ]);
            return this.mapRowToIvrMenu(result.rows[0]);
        });
    }
    async getIvrMenuById(id, tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`SELECT * FROM ivr_menus WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
            return result.rows.length > 0 ? this.mapRowToIvrMenu(result.rows[0]) : undefined;
        }
        finally {
            client.release();
        }
    }
    async getIvrMenuByExtension(extension, tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`SELECT * FROM ivr_menus WHERE extension = $1 AND tenant_id = $2 AND enabled = true`, [extension, tenantId]);
            return result.rows.length > 0 ? this.mapRowToIvrMenu(result.rows[0]) : undefined;
        }
        finally {
            client.release();
        }
    }
    async listIvrMenus(tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`SELECT * FROM ivr_menus WHERE tenant_id = $1 ORDER BY name ASC`, [tenantId]);
            return result.rows.map((row) => this.mapRowToIvrMenu(row));
        }
        finally {
            client.release();
        }
    }
    async updateIvrMenu(id, tenantId, updateData) {
        return (0, database_1.withTransaction)(async (client) => {
            // Check if extension is already taken by another menu
            if (updateData.extension) {
                const existingMenu = await client.query(`SELECT id FROM ivr_menus WHERE extension = $1 AND tenant_id = $2 AND id != $3`, [updateData.extension, tenantId, id]);
                if (existingMenu.rows.length > 0) {
                    throw new Error(`Extension ${updateData.extension} is already in use`);
                }
            }
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
            if (updateData.extension !== undefined) {
                updateFields.push(`extension = $${paramCount++}`);
                updateValues.push(updateData.extension);
            }
            if (updateData.greeting_sound !== undefined) {
                updateFields.push(`greeting_sound = $${paramCount++}`);
                updateValues.push(updateData.greeting_sound);
            }
            if (updateData.invalid_sound !== undefined) {
                updateFields.push(`invalid_sound = $${paramCount++}`);
                updateValues.push(updateData.invalid_sound);
            }
            if (updateData.exit_sound !== undefined) {
                updateFields.push(`exit_sound = $${paramCount++}`);
                updateValues.push(updateData.exit_sound);
            }
            if (updateData.timeout !== undefined) {
                updateFields.push(`timeout = $${paramCount++}`);
                updateValues.push(updateData.timeout);
            }
            if (updateData.max_failures !== undefined) {
                updateFields.push(`max_failures = $${paramCount++}`);
                updateValues.push(updateData.max_failures);
            }
            if (updateData.timeout_action !== undefined) {
                updateFields.push(`timeout_action = $${paramCount++}`);
                updateValues.push(JSON.stringify(updateData.timeout_action));
            }
            if (updateData.invalid_action !== undefined) {
                updateFields.push(`invalid_action = $${paramCount++}`);
                updateValues.push(JSON.stringify(updateData.invalid_action));
            }
            if (updateData.options !== undefined) {
                updateFields.push(`options = $${paramCount++}`);
                updateValues.push(JSON.stringify(updateData.options));
            }
            if (updateData.enabled !== undefined) {
                updateFields.push(`enabled = $${paramCount++}`);
                updateValues.push(updateData.enabled);
            }
            if (updateFields.length === 0) {
                return this.getIvrMenuById(id, tenantId);
            }
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(id, tenantId);
            const query = `
        UPDATE ivr_menus 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
        RETURNING *
      `;
            const result = await client.query(query, updateValues);
            return result.rows.length > 0 ? this.mapRowToIvrMenu(result.rows[0]) : undefined;
        });
    }
    async deleteIvrMenu(id, tenantId) {
        return (0, database_1.withTransaction)(async (client) => {
            const result = await client.query(`DELETE FROM ivr_menus WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
            return result.rowCount > 0;
        });
    }
    async validateIvrMenu(ivrMenu) {
        const errors = [];
        if (!ivrMenu.name || ivrMenu.name.trim().length === 0) {
            errors.push('Name is required');
        }
        if (!ivrMenu.extension || ivrMenu.extension.trim().length === 0) {
            errors.push('Extension is required');
        }
        else if (!/^\d{3,4}$/.test(ivrMenu.extension)) {
            errors.push('Extension must be 3-4 digits');
        }
        if (ivrMenu.timeout !== undefined && (ivrMenu.timeout < 1 || ivrMenu.timeout > 60)) {
            errors.push('Timeout must be between 1-60 seconds');
        }
        if (ivrMenu.max_failures !== undefined && (ivrMenu.max_failures < 1 || ivrMenu.max_failures > 10)) {
            errors.push('Max failures must be between 1-10');
        }
        if (ivrMenu.timeout_action) {
            if (!ivrMenu.timeout_action.type) {
                errors.push('Timeout action type is required');
            }
            if (!ivrMenu.timeout_action.destination) {
                errors.push('Timeout action destination is required');
            }
        }
        if (ivrMenu.invalid_action) {
            if (!ivrMenu.invalid_action.type) {
                errors.push('Invalid action type is required');
            }
            if (!ivrMenu.invalid_action.destination) {
                errors.push('Invalid action destination is required');
            }
        }
        if (ivrMenu.options) {
            // Validate DTMF options
            const validKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'];
            for (const [key, option] of Object.entries(ivrMenu.options)) {
                if (!validKeys.includes(key)) {
                    errors.push(`Invalid DTMF key: ${key}. Valid keys are: 0-9, *, #`);
                }
                if (!option.action) {
                    errors.push(`Action is required for option ${key}`);
                }
                if (!option.destination) {
                    errors.push(`Destination is required for option ${key}`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    async getActiveIvrMenus(tenantId) {
        const client = await (0, database_1.getClient)();
        try {
            const result = await client.query(`SELECT * FROM ivr_menus WHERE tenant_id = $1 AND enabled = true ORDER BY extension ASC`, [tenantId]);
            return result.rows.map((row) => this.mapRowToIvrMenu(row));
        }
        finally {
            client.release();
        }
    }
    async processDtmfInput(ivrMenuId, tenantId, dtmf) {
        const ivrMenu = await this.getIvrMenuById(ivrMenuId, tenantId);
        if (!ivrMenu || !ivrMenu.enabled) {
            return { action: null };
        }
        const option = ivrMenu.options[dtmf];
        if (!option) {
            return { action: ivrMenu.invalid_action };
        }
        if (option.action === 'submenu') {
            // Find the submenu
            const submenu = await this.getIvrMenuByExtension(option.destination, tenantId);
            if (submenu) {
                return { action: null, nextMenu: submenu };
            }
        }
        return { action: option };
    }
    async generateFreeSwitchXml(ivrMenu) {
        const optionsXml = Object.entries(ivrMenu.options)
            .map(([dtmf, option]) => {
            let destination = option.destination;
            // Convert action types to FreeSWITCH destinations
            switch (option.action) {
                case 'extension':
                    destination = `user/${option.destination}`;
                    break;
                case 'queue':
                    destination = `queue/${option.destination}`;
                    break;
                case 'conference':
                    destination = `conference/${option.destination}`;
                    break;
                case 'voicemail':
                    destination = `voicemail default ${option.destination}`;
                    break;
                case 'submenu':
                    destination = `ivr_${option.destination}`;
                    break;
                case 'hangup':
                    destination = 'hangup';
                    break;
            }
            return `
        <menu name="ivr_${ivrMenu.extension}">
          <entry action="menu-exec-app" digits="${dtmf}" param="bridge ${destination}"/>
        </menu>`;
        })
            .join('\n');
        const timeoutDestination = this.getActionDestination(ivrMenu.timeout_action);
        const invalidDestination = this.getActionDestination(ivrMenu.invalid_action);
        return `<?xml version="1.0" encoding="utf-8"?>
<include>
  <menu name="ivr_${ivrMenu.extension}"
        greeting="${ivrMenu.greeting_sound || 'ivr/ivr-welcome_to_freeswitch.wav'}"
        invalid_sound="${ivrMenu.invalid_sound || 'ivr/ivr-that_was_an_invalid_entry.wav'}"
        exit_sound="${ivrMenu.exit_sound || 'voicemail/vm-goodbye.wav'}"
        timeout="${ivrMenu.timeout}"
        max_failures="${ivrMenu.max_failures}"
        timeout_action="menu-exec-app bridge ${timeoutDestination}"
        invalid_action="menu-exec-app bridge ${invalidDestination}">
    ${optionsXml}
  </menu>
</include>`;
    }
    getActionDestination(action) {
        switch (action.type) {
            case 'extension':
                return `user/${action.destination}`;
            case 'queue':
                return `queue/${action.destination}`;
            case 'conference':
                return `conference/${action.destination}`;
            case 'voicemail':
                return `voicemail default ${action.destination}`;
            case 'hangup':
                return 'hangup';
            case 'repeat':
                return `ivr_${action.destination}`;
            default:
                return 'hangup';
        }
    }
}
exports.IvrService = IvrService;
//# sourceMappingURL=ivr.service.js.map