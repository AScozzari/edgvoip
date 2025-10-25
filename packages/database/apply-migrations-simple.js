const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000
});

async function apply() {
  const client = await pool.connect();
  try {
    console.log('Applying migrations...');
    const sql = fs.readFileSync('src/migrations/apply-all-multi-tenant.sql', 'utf8');
    await client.query(sql);
    console.log('SUCCESS');
    const r = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('dialplan_rules','inbound_routes','outbound_routes') ORDER BY table_name");
    r.rows.forEach(t => console.log(t.table_name));
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

apply();

