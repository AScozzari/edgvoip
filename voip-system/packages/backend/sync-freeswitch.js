const { FreeSWITCHConfigService } = require('./dist/services/freeswitch-config.service');

async function syncConfigs() {
  console.log('Starting FreeSWITCH configuration sync...');
  try {
    const service = new FreeSWITCHConfigService();
    await service.syncAllTenantConfigs();
    console.log('✅ Sync completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

syncConfigs();
