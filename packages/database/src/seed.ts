import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/edgvoip',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if data already exists
    const tenantCount = await client.query('SELECT COUNT(*) FROM tenants');
    if (parseInt(tenantCount.rows[0].count) > 0) {
      console.log('⏭️  Database already seeded, skipping...');
      // Print existing tenant IDs
      const existingTenants = await client.query('SELECT id, name, slug, is_master FROM tenants');
      console.log('📋 Existing tenants:');
      existingTenants.rows.forEach(t => console.log(`  - ${t.name} (${t.slug}): ${t.id} ${t.is_master ? '[MASTER]' : ''}`));
      
      // Print existing extensions
      const existingExtensions = await client.query('SELECT extension, display_name, tenant_id FROM extensions');
      console.log('📋 Existing extensions:', existingExtensions.rows.length);
      existingExtensions.rows.forEach(e => console.log(`  - ${e.extension} (${e.display_name}) - tenant: ${e.tenant_id}`));
      return;
    }
    
    console.log('');
    console.log('👑 Creating MASTER tenant (edgvoip)...');
    
    // Create MASTER tenant (edgvoip)
    const masterTenantId = uuidv4();
    await client.query(`
      INSERT INTO tenants (
        id, name, domain, sip_domain, slug, context_prefix, 
        parent_tenant_id, is_master, timezone, language, status, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      masterTenantId,
      'EDG VoIP Master',
      'edgvoip',
      null, // Master tenant non ha SIP domain
      'edgvoip',
      'tenant-edgvoip',
      null, // No parent
      true, // is_master
      'Europe/Rome',
      'it',
      'active',
      JSON.stringify({
        max_concurrent_calls: 1000,
        max_extensions: 10000,
        max_trunks: 1000,
        recording_enabled: true,
        gdpr_compliant: true,
        voicemail_directory: '/var/lib/freeswitch/storage/edgvoip/voicemail'
      })
    ]);
    
    console.log(`✅ Master tenant created: ${masterTenantId}`);
    console.log('');
    
    console.log('🏢 Creating DEMO tenant (child of edgvoip)...');
    
    // Create DEMO tenant (child of master)
    const tenantId = uuidv4();
    await client.query(`
      INSERT INTO tenants (
        id, name, domain, sip_domain, slug, context_prefix,
        parent_tenant_id, is_master, timezone, language, status, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      tenantId,
      'Demo Tenant',
      'demo',
      'demo.edgvoip.it',
      'demo',
      'tenant-demo',
      masterTenantId, // Parent is master tenant
      false, // Not a master
      'Europe/Rome',
      'it',
      'active',
      JSON.stringify({
        max_concurrent_calls: 20,
        max_extensions: 100,
        max_trunks: 10,
        recording_enabled: true,
        gdpr_compliant: true,
        voicemail_directory: '/var/lib/freeswitch/storage/demo/voicemail'
      })
    ]);
    
    console.log(`✅ Demo tenant created: ${tenantId}`);
    
    // Create demo store
    const storeId = uuidv4();
    await client.query(`
      INSERT INTO stores (id, tenant_id, name, store_id, status, settings)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      storeId,
      tenantId,
      'Demo Store Roma',
      'store-roma-001',
      'active',
      JSON.stringify({
        business_hours: {
          enabled: true,
          timezone: 'Europe/Rome',
          schedule: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: '10:00', close: '16:00' },
            sunday: { open: '10:00', close: '14:00' }
          }
        },
        outbound_caller_id: '+393331234567',
        recording_consent_required: true
      })
    ]);
    
    // Create demo extensions
    const extensions = [
      { extension: '1001', display_name: 'Mario Rossi', type: 'user' },
      { extension: '1002', display_name: 'Giulia Bianchi', type: 'user' },
      { extension: '1003', display_name: 'Alessandro Verdi', type: 'user' },
      { extension: '2000', display_name: 'Coda Vendite', type: 'queue' },
      { extension: '3000', display_name: 'Conferenza', type: 'conference' }
    ];
    
    for (const ext of extensions) {
      const extensionId = uuidv4();
      const password = await bcrypt.hash('password123', 10);
      
      await client.query(`
        INSERT INTO extensions (
          id, tenant_id, store_id, extension, password, display_name, type,
          context, caller_id_number, voicemail_pin, pickup_group, limit_max, settings
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        extensionId,
        tenantId,
        storeId,
        ext.extension,
        password,
        ext.display_name,
        ext.type,
        'tenant-demo-internal', // context
        ext.extension, // caller_id_number = extension
        ext.extension, // voicemail_pin = extension (initial)
        ext.type === 'user' ? 'sales' : null, // pickup_group
        3, // limit_max
        JSON.stringify({
          voicemail_enabled: true,
          call_forwarding: { enabled: false, destination: null },
          dnd_enabled: false,
          recording_enabled: true
        })
      ]);
    }
    
    // Create demo SIP trunk
    const trunkId = uuidv4();
    await client.query(`
      INSERT INTO sip_trunks (id, tenant_id, store_id, name, provider, status, sip_config, did_config, security, gdpr)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      trunkId,
      tenantId,
      storeId,
      'Demo Trunk Roma',
      'Demo Provider',
      'testing',
      JSON.stringify({
        host: 'sip.demo-provider.com',
        port: 5060,
        transport: 'udp',
        username: 'demo_user',
        password: 'demo_password',
        realm: 'sip.demo-provider.com',
        register: true,
        retry_seconds: 60,
        caller_id_in_from: false,
        ping: true,
        ping_time: 60
      }),
      JSON.stringify({
        number: '+393331234567',
        country_code: 'IT',
        area_code: '333',
        local_number: '1234567',
        provider_did: 'IT_333_1234567',
        inbound_route: 'demo-route'
      }),
      JSON.stringify({
        encryption: 'tls',
        authentication: 'digest',
        acl: ['192.168.1.0/24', '10.0.0.0/8'],
        rate_limit: {
          enabled: true,
          calls_per_minute: 60,
          calls_per_hour: 1000
        }
      }),
      JSON.stringify({
        data_retention_days: 365,
        recording_consent_required: true,
        data_processing_purpose: 'Business communications',
        lawful_basis: 'legitimate_interest',
        data_controller: 'Demo Company SRL',
        dpo_contact: 'dpo@demo-company.it'
      })
    ]);
    
    // Create some demo CDR records
    const demoCDRs = [
      {
        call_uuid: uuidv4(),
        call_direction: 'inbound',
        caller_id_number: '+393339876543',
        caller_id_name: 'Cliente Demo',
        callee_extension: '1001',
        start_time: new Date(Date.now() - 3600000), // 1 hour ago
        answer_time: new Date(Date.now() - 3595000), // 5 seconds later
        end_time: new Date(Date.now() - 3000000), // 10 minutes call
        duration: 600,
        bill_seconds: 600,
        hangup_cause: 'NORMAL_CLEARING',
        hangup_disposition: 'answered',
        audio_codec: 'PCMU',
        recording_enabled: true,
        recording_consent: true,
        fs_uuid: uuidv4(),
        fs_domain: 'demo-tenant.pbx.w3suite.it'
      },
      {
        call_uuid: uuidv4(),
        call_direction: 'outbound',
        caller_extension: '1002',
        callee_id_number: '+393339876544',
        callee_id_name: 'Fornitore Demo',
        start_time: new Date(Date.now() - 1800000), // 30 minutes ago
        answer_time: new Date(Date.now() - 1795000), // 5 seconds later
        end_time: new Date(Date.now() - 1200000), // 10 minutes call
        duration: 600,
        bill_seconds: 600,
        hangup_cause: 'NORMAL_CLEARING',
        hangup_disposition: 'answered',
        audio_codec: 'PCMU',
        recording_enabled: true,
        recording_consent: true,
        fs_uuid: uuidv4(),
        fs_domain: 'demo-tenant.pbx.w3suite.it'
      }
    ];
    
    for (const cdr of demoCDRs) {
      await client.query(`
        INSERT INTO cdr (
          tenant_id, store_id, extension_id, trunk_id, call_uuid, call_direction,
          caller_id_number, caller_id_name, caller_extension, callee_id_number,
          callee_id_name, callee_extension, start_time, answer_time, end_time,
          duration, bill_seconds, hangup_cause, hangup_disposition, audio_codec,
          recording_enabled, recording_consent, fs_uuid, fs_domain
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      `, [
        tenantId, storeId, null, trunkId, cdr.call_uuid, cdr.call_direction,
        cdr.caller_id_number, cdr.caller_id_name, cdr.caller_extension, cdr.callee_id_number,
        cdr.callee_id_name, cdr.callee_extension, cdr.start_time, cdr.answer_time, cdr.end_time,
        cdr.duration, cdr.bill_seconds, cdr.hangup_cause, cdr.hangup_disposition, cdr.audio_codec,
        cdr.recording_enabled, cdr.recording_consent, cdr.fs_uuid, cdr.fs_domain
      ]);
    }
    
    console.log('');
    console.log('📞 Creating Dialplan Rules for demo tenant...');
    
    // Create dialplan rules for demo tenant (6 contexts)
    const dialplanRules = [
      {
        context: 'tenant-demo-internal',
        name: 'Internal Calls',
        priority: 100,
        match_pattern: '^(1\\d{3})$',
        actions: [
          { type: 'set', data: 'hangup_after_bridge=true' },
          { type: 'bridge', target: 'user/$1@demo.edgvoip.it' }
        ]
      },
      {
        context: 'tenant-demo-features',
        name: 'Voicemail Check',
        priority: 20,
        match_pattern: '^\\*98$',
        actions: [
          { type: 'answer' },
          { type: 'voicemail', data: 'check default demo.edgvoip.it ${caller_id_number}' }
        ]
      }
    ];
    
    for (const rule of dialplanRules) {
      await client.query(`
        INSERT INTO dialplan_rules (tenant_id, context, name, priority, match_pattern, actions, enabled)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        tenantId,
        rule.context,
        rule.name,
        rule.priority,
        rule.match_pattern,
        JSON.stringify(rule.actions),
        true
      ]);
    }
    
    console.log(`✅ Created ${dialplanRules.length} dialplan rules`);
    
    console.log('');
    console.log('📥 Creating Inbound Route for demo tenant...');
    
    // Create inbound route (DID → Extension 1001)
    await client.query(`
      INSERT INTO inbound_routes (
        tenant_id, store_id, name, did_number, destination_type, destination_value, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      tenantId,
      storeId,
      'Main Number to Reception',
      '0591234567',
      'extension',
      '1001',
      true
    ]);
    
    console.log('✅ Created 1 inbound route');
    
    console.log('');
    console.log('📤 Creating Outbound Route for demo tenant...');
    
    // Create outbound route (Mobile numbers → Trunk)
    await client.query(`
      INSERT INTO outbound_routes (
        tenant_id, store_id, name, dial_pattern, trunk_id, strip_digits, priority, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      tenantId,
      storeId,
      'Italian Mobile Numbers',
      '^3[0-9]{9}$',
      trunkId,
      0,
      100,
      true
    ]);
    
    console.log('✅ Created 1 outbound route');
    
    console.log('');
    console.log('⏰ Creating Time Condition for demo tenant...');
    
    // Create time condition
    await client.query(`
      INSERT INTO time_conditions (
        tenant_id, store_id, name, timezone, business_hours, 
        business_hours_action, after_hours_action, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      tenantId,
      storeId,
      'Office Hours',
      'Europe/Rome',
      JSON.stringify({
        monday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        tuesday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        wednesday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        thursday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        friday: { enabled: true, start_time: '09:00', end_time: '18:00' }
      }),
      'continue',
      'voicemail',
      true
    ]);
    
    console.log('✅ Created 1 time condition');
    
    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('📊 Created:');
    console.log('  - 1 Master Tenant (edgvoip)');
    console.log('  - 1 Demo Tenant (child)');
    console.log('  - 1 Demo Store');
    console.log('  - 5 Demo Extensions');
    console.log('  - 1 Demo SIP Trunk');
    console.log('  - 2 Dialplan Rules');
    console.log('  - 1 Inbound Route');
    console.log('  - 1 Outbound Route');
    console.log('  - 1 Time Condition');
    console.log('  - 2 Demo CDR Records');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { seedDatabase };

