"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const pg_1 = require("pg");
const fs_1 = require("fs");
const path_1 = require("path");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/edgvoip',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
async function runMigrations() {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting database migrations...');
        // Create migrations table if it doesn't exist
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
        // Get list of migration files
        const migrationFiles = [
            '001_create_tenants_table.sql',
            '002_create_rls_policies.sql',
            '003_create_call_events_table.sql',
            '004_enhance_sip_trunks.sql',
            '005_dialplan_routes.sql',
            '006_ring_groups.sql',
            '007_call_queues.sql',
            '008_time_conditions.sql',
            '009_ivr_menus.sql',
            '010_conference_rooms.sql',
            '011_voicemail_boxes.sql',
            '012_cdr_enhanced.sql',
            '013_add_tenant_slug_and_companies.sql',
            '014_create_users_table.sql',
            '015_enhance_auth_system.sql',
            '016_update_master_slug.sql'
        ];
        for (const filename of migrationFiles) {
            // Check if migration already executed
            const result = await client.query('SELECT id FROM migrations WHERE filename = $1', [filename]);
            if (result.rows.length > 0) {
                console.log(`⏭️  Skipping ${filename} (already executed)`);
                continue;
            }
            console.log(`📝 Executing ${filename}...`);
            // Read and execute migration file
            const migrationPath = (0, path_1.join)(__dirname, 'migrations', filename);
            const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
            await client.query(migrationSQL);
            // Record migration as executed
            await client.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
            console.log(`✅ ${filename} executed successfully`);
        }
        console.log('🎉 All migrations completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
async function main() {
    try {
        await runMigrations();
        process.exit(0);
    }
    catch (error) {
        console.error('Migration process failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=migrate.js.map