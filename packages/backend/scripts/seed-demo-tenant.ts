import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedDemoTenant() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('🌱 Seeding demo tenant...');

    // 1. Create or update demo tenant
    const tenantResult = await client.query(`
      INSERT INTO tenants (id, name, slug, domain, sip_domain, status)
      VALUES (
        gen_random_uuid(),
        'Demo Tenant',
        'demo',
        'demo.edgvoip.it',
        'demo.edgvoip.it',
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
    console.log(`✅ Demo tenant created/updated: ${tenantId}`);

    // 2. Create demo admin user for web login
    console.log('👤 Creating demo admin user...');
    
    const hashedPassword = await bcrypt.hash('tenantadmin123', 10);
    
    await client.query(`
      INSERT INTO users (
        id, tenant_id, email, password_hash, first_name, last_name, role, status
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'admin@demo.local',
        $2,
        'Demo',
        'Admin',
        'tenant_admin',
        'active'
      )
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        status = EXCLUDED.status
    `, [tenantId, hashedPassword]);

    console.log('✅ Demo admin user created/updated');

    // 3. Create extensions 100 and 102
    console.log('📞 Creating extensions 100 and 102...');
    
    await client.query(`
      INSERT INTO extensions (id, tenant_id, extension, password, display_name, status)
      VALUES 
        (gen_random_uuid(), $1, '100', 'test123456', 'Extension 100', 'active'),
        (gen_random_uuid(), $1, '102', 'test123456', 'Extension 102', 'active')
      ON CONFLICT (extension, tenant_id) 
      DO UPDATE SET 
        password = EXCLUDED.password,
        display_name = EXCLUDED.display_name,
        status = EXCLUDED.status
    `, [tenantId]);

    console.log('✅ Extensions 100 and 102 created/updated');

    // 3. Create MessageNet SIP Trunk
    console.log('🔗 Creating MessageNet SIP trunk...');
    
    // Skip trunk creation for now - can be configured via UI later
    console.log('⏩ Skipping SIP trunk creation (can be configured via UI)');

    // 4. Create voicemail boxes for extensions
    console.log('📫 Creating voicemail boxes...');
    
    await client.query(`
      INSERT INTO voicemail_boxes (id, tenant_id, mailbox_id, password, full_name, enabled)
      VALUES 
        (gen_random_uuid(), $1, '100', '100', 'Extension 100', true),
        (gen_random_uuid(), $1, '102', '102', 'Extension 102', true)
      ON CONFLICT (mailbox_id) 
      DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        enabled = EXCLUDED.enabled
    `, [tenantId]);

    console.log('✅ Voicemail boxes created/updated');

    // 5. Create a demo IVR menu
    console.log('🎤 Creating demo IVR menu...');
    
    await client.query(`
      INSERT INTO ivr_menus (
        id, tenant_id, name, description, extension,
        greeting_sound, timeout, max_failures,
        timeout_action, invalid_action, options, enabled
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'Main Menu',
        'Main IVR menu for demo tenant',
        '1000',
        '/sounds/greeting.wav',
        10,
        3,
        '{"type": "hangup", "destination": ""}'::jsonb,
        '{"type": "hangup", "destination": ""}'::jsonb,
        '{
          "1": {"action": "extension", "destination": "100"},
          "2": {"action": "extension", "destination": "102"},
          "3": {"action": "queue", "destination": "3000"}
        }'::jsonb,
        true
      )
      ON CONFLICT (extension) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        enabled = EXCLUDED.enabled
    `, [tenantId]);

    console.log('✅ Demo IVR menu created/updated');

    // 6. Create a demo call queue
    console.log('📋 Creating demo call queue...');
    
    const queueResult = await client.query(`
      INSERT INTO call_queues (
        id, tenant_id, name, description, extension,
        strategy, max_wait_time, enabled
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'Support Queue',
        'Main support queue',
        '3000',
        'longest-idle',
        300,
        true
      )
      ON CONFLICT (extension)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        enabled = EXCLUDED.enabled
      RETURNING id
    `, [tenantId]);

    const queueId = queueResult.rows[0].id;
    console.log(`✅ Demo call queue created/updated: ${queueId}`);

    // 7. Add agents to queue
    console.log('👤 Adding agents to queue...');
    
    const extensionsResult = await client.query(`
      SELECT id, extension FROM extensions WHERE tenant_id = $1 AND extension IN ('100', '102')
    `, [tenantId]);

    for (const ext of extensionsResult.rows) {
      await client.query(`
        INSERT INTO queue_agents (
          id, queue_id, extension_id, agent_name, agent_type,
          contact, tier_level, tier_position, enabled
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          'callback',
          'user/${ext.extension}@demo.edgvoip.it',
          1,
          1,
          true
        )
        ON CONFLICT (queue_id, extension_id)
        DO UPDATE SET
          enabled = EXCLUDED.enabled
      `, [queueId, ext.id, `Agent ${ext.extension}`]);
    }

    console.log('✅ Agents added to queue');

    await client.query('COMMIT');
    
    console.log('');
    console.log('🎉 Demo tenant seeded successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   Tenant: demo (demo.edgvoip.it)`);
    console.log(`   Extensions: 100, 102 (password: test123456)`);
    console.log(`   Trunk: MessageNet (sip.messagenet.it)`);
    console.log(`   IVR Menu: 1000`);
    console.log(`   Queue: 3000`);
    console.log('');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding demo tenant:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding
seedDemoTenant()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
