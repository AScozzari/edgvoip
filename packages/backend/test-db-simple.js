const { getClient } = require('@w3-voip/database');

async function testDB() {
  try {
    console.log('Testing database connection...');
    const client = await getClient();
    console.log('Database connected successfully');
    
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log('Users count:', result.rows[0].count);
    
    const tenantResult = await client.query('SELECT * FROM tenants WHERE slug = $1', ['demo']);
    console.log('Demo tenant:', tenantResult.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error);
    process.exit(1);
  }
}

testDB();
