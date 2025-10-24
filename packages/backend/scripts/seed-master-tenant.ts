import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedMasterTenant() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('👑 Seeding master tenant edgvoip...');

    // 1. Create or update edgvoip master tenant
    const tenantResult = await client.query(`
      INSERT INTO tenants (id, name, slug, domain, sip_domain, status)
      VALUES (
        gen_random_uuid(),
        'EdgeVoIP Master',
        'edgvoip',
        'edgvoip.edgvoip.it',
        'edgvoip.edgvoip.it',
        'active'
      )
      ON CONFLICT (slug) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        domain = EXCLUDED.domain,
        sip_domain = EXCLUDED.sip_domain,
        status = EXCLUDED.status
      RETURNING id
    `);

    const tenantId = tenantResult.rows[0].id;
    console.log(`✅ Master tenant edgvoip created/updated: ${tenantId}`);

    // 2. Create super admin user
    console.log('👤 Creating super admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO users (
        id, tenant_id, email, password_hash, first_name, last_name, role, status
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'admin@edgvoip.it',
        $2,
        'Super',
        'Administrator',
        'super_admin',
        'active'
      )
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'super_admin',
        status = EXCLUDED.status
    `, [tenantId, hashedPassword]);

    console.log('✅ Super admin user created/updated');

    // 3. Create master tenant extensions for testing
    console.log('📞 Creating master tenant extensions...');
    
    await client.query(`
      INSERT INTO extensions (id, tenant_id, extension, password, display_name, status)
      VALUES 
        (gen_random_uuid(), $1, '1000', 'master123', 'Master Extension 1000', 'active'),
        (gen_random_uuid(), $1, '1001', 'master123', 'Master Extension 1001', 'active')
      ON CONFLICT (extension, tenant_id) 
      DO UPDATE SET 
        password = EXCLUDED.password,
        display_name = EXCLUDED.display_name,
        status = EXCLUDED.status
    `, [tenantId]);

    console.log('✅ Master tenant extensions created/updated');

    await client.query('COMMIT');
    
    console.log('');
    console.log('🎉 Master tenant edgvoip seeded successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   Tenant: edgvoip (edgvoip.edgvoip.it)`);
    console.log(`   Super Admin: admin@edgvoip.it (password: admin123)`);
    console.log(`   Extensions: 1000, 1001 (password: master123)`);
    console.log('');
    console.log('⚠️  SECURITY WARNING:');
    console.log('   Please change the super admin password after first login!');
    console.log('');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding master tenant:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding
seedMasterTenant()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
