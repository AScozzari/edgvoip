const { ExtensionService } = require('./dist/services/extension.service');

async function testExtensionService() {
  console.log('Testing ExtensionService...');
  try {
    const service = new ExtensionService();
    console.log('ExtensionService created successfully');
    
    // Test listExtensions
    const result = await service.listExtensions('32af8555-5511-40d6-be35-443dcebafefb', null, 1, 10);
    console.log('listExtensions result:', result);
    
  } catch (error) {
    console.error('Error testing ExtensionService:', error);
  }
}

testExtensionService();
