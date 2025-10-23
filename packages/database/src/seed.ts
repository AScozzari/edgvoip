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
      const existingTenants = await client.query('SELECT id, name FROM tenants');
      console.log('📋 Existing tenants:');
      existingTenants.rows.forEach(t => console.log(`  - ${t.name}: ${t.id}`));
      
      // Print existing extensions
      const existingExtensions = await client.query('SELECT extension, display_name, tenant_id FROM extensions');
      console.log('📋 Existing extensions:', existingExtensions.rows.length);
      existingExtensions.rows.forEach(e => console.log(`  - ${e.extension} (${e.display_name}) - tenant: ${e.tenant_id}`));
      return;
    }
    
    // Create demo tenant
    const tenantId = uuidv4();
    await client.query(`
      INSERT INTO tenants (id, name, domain, sip_domain, status, settings)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      tenantId,
      'Demo Tenant',
      'demo-tenant',
      'demo-tenant.pbx.w3suite.it',
      'active',
      JSON.stringify({
        max_concurrent_calls: 20,
        recording_enabled: true,
        gdpr_compliant: true,
        timezone: 'Europe/Rome',
        language: 'it'
      })
    ]);
    
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
        INSERT INTO extensions (id, tenant_id, store_id, extension, password, display_name, type, settings)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        extensionId,
        tenantId,
        storeId,
        ext.extension,
        password,
        ext.display_name,
        ext.type,
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
    
    console.log('✅ Database seeded successfully!');
    console.log('📊 Created:');
    console.log('  - 1 Demo Tenant');
    console.log('  - 1 Demo Store');
    console.log('  - 5 Demo Extensions');
    console.log('  - 1 Demo SIP Trunk');
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

