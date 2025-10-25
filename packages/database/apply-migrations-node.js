// Apply migrations using Node.js with pg library
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://voip_system_user:bnEJC8RNhtIh@dpg-d07rv4u8ii6s73e8p5t0-a.frankfurt-postgres.render.com:5432/voip_system',
  ssl: { rejectUnauthorized: false }
});

async function applyMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Applying Multi-Tenant Migrations...');
    console.log('');

    // Read consolidated migration file
    const migrationPath = path.join(__dirname, 'src/migrations/apply-all-multi-tenant.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing consolidated migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Migrations applied successfully!');
    console.log('');

    // Verify tables
    console.log('🔍 Verifying tables created:');
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('dialplan_rules', 'inbound_routes', 'outbound_routes', 'time_conditions', 'ring_groups', 'queues', 'ivr_menus')
      ORDER BY table_name
    `);
    
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('');
    console.log('🏢 Checking tenant structure:');
    const tenantsResult = await client.query(`
      SELECT id, slug, is_master, context_prefix, sip_domain 
      FROM tenants 
      ORDER BY is_master DESC, slug
    `);
    
    tenantsResult.rows.forEach(row => {
      console.log(`  ${row.is_master ? '👑' : '🏢'} ${row.slug} | ${row.context_prefix} | ${row.sip_domain || 'NO SIP DOMAIN'}`);
    });

    console.log('');
    console.log('🎉 Multi-Tenant System Ready!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigrations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

