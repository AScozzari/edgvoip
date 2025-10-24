import bcrypt from 'bcrypt';
import { Client } from 'pg';

async function updatePassword() {
  const password = 'password';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Generated hash for password "password":', hash);
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://voip_user:VoipSecure2025!@localhost:5432/voip_production'
  });
  
  await client.connect();
  console.log('Connected to database');
  
  // Update super admin password
  const result = await client.query(
    'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email, role',
    [hash, 'admin@edgvoip.local']
  );
  
  console.log('Updated users:', result.rows);
  
  // Update demo admin password
  const result2 = await client.query(
    'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email, role',
    [hash, 'admin@demo.local']
  );
  
  console.log('Updated demo users:', result2.rows);
  
  // Verify the hash works
  const testResult = await bcrypt.compare(password, hash);
  console.log('Hash verification test:', testResult ? '✅ PASS' : '❌ FAIL');
  
  await client.end();
  console.log('Done!');
}

updatePassword().catch(console.error);

