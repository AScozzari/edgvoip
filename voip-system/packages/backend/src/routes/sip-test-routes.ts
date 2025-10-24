import { Router } from 'express';
import { SipTestService, SipTestConfig } from '../services/sip-test-service';

const router = Router();
const sipTestService = new SipTestService();

// Test SIP registration
router.post('/test-registration', async (req, res) => {
  try {
    const config: SipTestConfig = req.body;
    
    // Validate required fields
    if (!config.provider || !config.proxy || !config.auth_username || !config.auth_password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: provider, proxy, auth_username, auth_password'
      });
    }

    const result = await sipTestService.testSipRegistration(config);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error testing SIP registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test SIP registration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test SIP trunk connectivity
router.post('/test-connectivity', async (req, res) => {
  try {
    const config: SipTestConfig = req.body;
    
    // Validate required fields
    if (!config.proxy || !config.port) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: proxy, port'
      });
    }

    const result = await sipTestService.testSipTrunkConnectivity(config);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error testing SIP connectivity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test SIP connectivity',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test Messagenet connection specifically
router.post('/test-messagenet', async (req, res) => {
  try {
    const result = await sipTestService.testMessagenetConnection();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error testing Messagenet connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Messagenet connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test multiple configurations
router.post('/test-multiple', async (req, res) => {
  try {
    const configs: SipTestConfig[] = req.body.configs;
    
    if (!Array.isArray(configs) || configs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'configs must be a non-empty array'
      });
    }

    const results = await sipTestService.testMultipleConfigurations(configs);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error testing multiple SIP configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test SIP configurations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
