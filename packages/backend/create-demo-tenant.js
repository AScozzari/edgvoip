// Create demo tenant if not exists
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createDemoTenant() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking if demo tenant exists...');
    
    const checkResult = await client.query(
      "SELECT * FROM tenants WHERE slug = 'demo'"
    );
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Demo tenant already exists:');
      console.log(checkResult.rows[0]);
    } else {
      console.log('📝 Creating demo tenant...');
      
      const insertResult = await client.query(`
        INSERT INTO tenants (slug, name, domain, sip_domain, status)
        VALUES ('demo', 'Demo Tenant', 'demo.edgvoip.it', 'demo.edgvoip.it', 'active')
        RETURNING *
      `);
      
      console.log('✅ Demo tenant created:');
      console.log(insertResult.rows[0]);
    }
    
    // Check edgvoip tenant too
    const edgvoipResult = await client.query(
      "SELECT * FROM tenants WHERE slug = 'edgvoip'"
    );
    
    if (edgvoipResult.rows.length === 0) {
      console.log('📝 Creating edgvoip master tenant...');
      await client.query(`
        INSERT INTO tenants (slug, name, domain, sip_domain, status)
        VALUES ('edgvoip', 'EDG VoIP Master', 'edgvoip.it', 'edgvoip.it', 'active')
      `);
      console.log('✅ Master tenant created');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createDemoTenant();

