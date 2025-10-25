const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkStatus() {
  const client = await pool.connect();
  try {
    console.log('=== TENANTS ===');
    const tenants = await client.query('SELECT id, name, slug, sip_domain, status FROM tenants ORDER BY created_at');
    tenants.rows.forEach(t => {
      console.log(`${t.slug} | ${t.name} | ${t.sip_domain || 'NO SIP DOMAIN'} | ${t.status}`);
    });

    console.log('\n=== EXTENSIONS ===');
    const extensions = await client.query(`
      SELECT e.extension, e.display_name, e.password, t.slug 
      FROM extensions e 
      JOIN tenants t ON e.tenant_id = t.id 
      ORDER BY t.slug, e.extension
    `);
    extensions.rows.forEach(e => {
      console.log(`${e.slug} | ${e.extension} | ${e.display_name} | pwd: ${e.password.substring(0, 15)}...`);
    });

    console.log('\n=== SIP TRUNKS ===');
    const trunks = await client.query(`
      SELECT s.name, s.provider, s.sip_config, t.slug 
      FROM sip_trunks s 
      JOIN tenants t ON s.tenant_id = t.id 
      ORDER BY t.slug
    `);
    trunks.rows.forEach(tr => {
      const config = tr.sip_config || {};
      console.log(`${tr.slug} | ${tr.name} | ${tr.provider} | ${config.host || 'N/A'}`);
    });

    console.log('\n=== CHECK NEW COLUMNS ===');
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'tenants' AND column_name IN ('context_prefix', 'is_master', 'parent_tenant_id')
      ORDER BY column_name
    `);
    if (cols.rows.length > 0) {
      console.log('✅ New columns exist:');
      cols.rows.forEach(c => console.log(`  - ${c.column_name}`));
    } else {
      console.log('❌ New columns NOT found - migrations not applied yet');
    }

    console.log('\n=== CHECK NEW TABLES ===');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('dialplan_rules', 'inbound_routes', 'outbound_routes')
      ORDER BY table_name
    `);
    if (tables.rows.length > 0) {
      console.log('✅ New tables exist:');
      tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
    } else {
      console.log('❌ New tables NOT found - migrations not applied yet');
    }

  } finally {
    client.release();
    await pool.end();
  }
}

checkStatus().catch(console.error);

