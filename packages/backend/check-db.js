const { pool } = require('@w3-voip/database');
(async () => {
  const client = await pool.connect();
  try {
    console.log('=== TENANTS ===');
    const t = await client.query('SELECT slug, name, sip_domain, status FROM tenants ORDER BY created_at');
    t.rows.forEach(r => console.log(r.slug + ' | ' + r.name + ' | ' + (r.sip_domain || 'NO SIP') + ' | ' + r.status));
    
    console.log('\n=== EXTENSIONS ===');
    const e = await client.query('SELECT e.extension, e.display_name, e.password, t.slug FROM extensions e JOIN tenants t ON e.tenant_id = t.id ORDER BY t.slug, e.extension');
    e.rows.forEach(r => console.log(r.slug + ' | ' + r.extension + ' | ' + r.display_name + ' | pwd: test123456'));
    
    console.log('\n=== TRUNKS ===');
    const tr = await client.query('SELECT s.name, s.provider, s.sip_config, t.slug FROM sip_trunks s JOIN tenants t ON s.tenant_id = t.id ORDER BY t.slug');
    tr.rows.forEach(r => console.log(r.slug + ' | ' + r.name + ' | ' + r.provider));
    
    console.log('\n=== NEW COLUMNS CHECK ===');
    const cols = await client.query(" SELECT column_name FROM information_schema.columns WHERE table_name = tenants AND column_name IN context_prefix is_master ORDER BY column_name\);
 console.log('Migrations applied:', cols.rows.length > 0 ? 'YES' : 'NO');
 } finally {
 client.release();
 await pool.end();
 }
})();
