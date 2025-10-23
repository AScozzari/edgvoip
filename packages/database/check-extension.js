const { getClient } = require('./dist/index.js');

async function checkExtension() {
  try {
    const client = await getClient();
    
    // Verifica extension 100
    const result = await client.query('SELECT * FROM extensions WHERE extension = $1', ['100']);
    
    console.log('🔍 Verifica Extension 100:');
    console.log('Trovata:', result.rows.length > 0 ? '✅ SI' : '❌ NO');
    
    if (result.rows.length > 0) {
      const ext = result.rows[0];
      console.log('Dettagli:');
      console.log('- ID:', ext.id);
      console.log('- Extension:', ext.extension);
      console.log('- Password:', ext.password);
      console.log('- Display Name:', ext.display_name);
      console.log('- Tenant ID:', ext.tenant_id);
      console.log('- Enabled:', ext.enabled);
    }
    
    // Verifica SIP trunks
    const trunksResult = await client.query('SELECT * FROM sip_trunks WHERE name ILIKE $1', ['%messagenet%']);
    
    console.log('\n🔍 Verifica SIP Trunk Messagenet:');
    console.log('Trovato:', trunksResult.rows.length > 0 ? '✅ SI' : '❌ NO');
    
    if (trunksResult.rows.length > 0) {
      const trunk = trunksResult.rows[0];
      console.log('Dettagli:');
      console.log('- ID:', trunk.id);
      console.log('- Name:', trunk.name);
      console.log('- Provider:', trunk.provider);
      console.log('- Status:', trunk.status);
      console.log('- Enabled:', trunk.enabled);
    }
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

checkExtension();
