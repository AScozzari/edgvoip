// Check current database status and tenant information
// Note: This script uses a direct Pool connection to avoid DATABASE_URL validation issues
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000
});

async function checkStatus() {
  const client = await pool.connect();
  
  try {
    console.log('=== TENANTS ===');
    const tenants = await client.query('SELECT slug, name, sip_domain, status FROM tenants ORDER BY created_at');
    tenants.rows.forEach(t => {
      console.log(`${t.slug} | ${t.name} | ${t.sip_domain || 'NO SIP DOMAIN'} | ${t.status}`);
    });

    console.log('');
    console.log('=== EXTENSIONS ===');
    const extensions = await client.query(`
      SELECT e.extension, e.display_name, t.slug 
      FROM extensions e 
      JOIN tenants t ON e.tenant_id = t.id 
      ORDER BY t.slug, e.extension
    `);
    extensions.rows.forEach(e => {
      console.log(`${e.slug} | ${e.extension} | ${e.display_name} | Password: test123456`);
    });

    console.log('');
    console.log('=== SIP TRUNKS ===');
    const trunks = await client.query(`
      SELECT s.name, s.provider, s.sip_config, t.slug 
      FROM sip_trunks s 
      JOIN tenants t ON s.tenant_id = t.id 
      ORDER BY t.slug
    `);
    trunks.rows.forEach(tr => {
      const config = tr.sip_config || {};
      console.log(`${tr.slug} | ${tr.name} | ${tr.provider} | Host: ${config.host || 'N/A'} | User: ${config.username || 'N/A'}`);
    });

    console.log('');
    console.log('=== MIGRATION STATUS ===');
    
    // Check if new columns exist
    const colsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name IN ('context_prefix', 'is_master', 'parent_tenant_id')
    `);
    
    console.log(`New tenant columns: ${colsCheck.rows.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    // Check if new tables exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('dialplan_rules', 'inbound_routes', 'outbound_routes')
    `);
    
    console.log(`New routing tables: ${tablesCheck.rows.length > 0 ? '✅ EXISTS (' + tablesCheck.rows.length + ' tables)' : '❌ NOT FOUND'}`);

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStatus();

