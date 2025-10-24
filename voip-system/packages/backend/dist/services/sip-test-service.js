"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SipTestService = void 0;
const events_1 = require("events");
class SipTestService extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.testTimeout = 10000; // 10 seconds timeout
    }
    /**
     * Test SIP registration with provider
     */
    async testSipRegistration(config) {
        const startTime = Date.now();
        try {
            console.log(`Testing SIP registration with ${config.provider}...`);
            console.log(`Proxy: ${config.proxy}:${config.port} (${config.transport})`);
            console.log(`Username: ${config.auth_username}`);
            // Simulate SIP registration test
            // In a real implementation, this would use a SIP library like node-sip
            const result = await this.simulateSipRegistration(config);
            const responseTime = Date.now() - startTime;
            return {
                success: result.success,
                status: result.status,
                message: result.message,
                response_time_ms: responseTime,
                registration_details: result.registration_details
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            console.error('SIP test error:', error);
            return {
                success: false,
                status: 'NETWORK_ERROR',
                message: 'Network or connection error',
                response_time_ms: responseTime,
                error_details: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Test SIP trunk connectivity (ping/OPTIONS)
     */
    async testSipTrunkConnectivity(config) {
        const startTime = Date.now();
        try {
            console.log(`Testing SIP trunk connectivity to ${config.proxy}:${config.port}...`);
            // Simulate SIP OPTIONS ping
            const result = await this.simulateSipOptions(config);
            const responseTime = Date.now() - startTime;
            return {
                success: result.success,
                status: result.status,
                message: result.message,
                response_time_ms: responseTime
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            console.error('SIP trunk test error:', error);
            return {
                success: false,
                status: 'NETWORK_ERROR',
                message: 'Network or connection error',
                response_time_ms: responseTime,
                error_details: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Test specific Messagenet configuration
     */
    async testMessagenetConnection() {
        const messagenetConfig = {
            provider: 'Messagenet',
            proxy: 'sip.messagenet.it', // Standard Messagenet SIP proxy
            port: 5060,
            transport: 'udp',
            auth_username: '5406594427',
            auth_password: 'UjcHYnZa',
            from_domain: 'messagenet.it'
        };
        console.log('Testing Messagenet SIP connection...');
        return await this.testSipRegistration(messagenetConfig);
    }
    /**
     * Simulate SIP registration (mock implementation)
     * In production, this would use a real SIP library
     */
    async simulateSipRegistration(config) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        // Mock different scenarios based on provider
        if (config.provider === 'Messagenet') {
            // Simulate successful Messagenet registration
            return {
                success: true,
                status: 'REG_OK',
                message: 'Successfully registered with Messagenet',
                registration_details: {
                    expires: 3600,
                    contact: `sip:${config.auth_username}@${config.proxy}`,
                    user_agent: 'EDG-VoIP/1.0'
                }
            };
        }
        // Simulate other providers or random failures
        const random = Math.random();
        if (random > 0.8) {
            return {
                success: false,
                status: 'AUTH_FAILED',
                message: 'Authentication failed - invalid credentials'
            };
        }
        else if (random > 0.6) {
            return {
                success: false,
                status: 'TIMEOUT',
                message: 'Registration timeout - server not responding'
            };
        }
        else {
            return {
                success: true,
                status: 'REG_OK',
                message: 'Successfully registered',
                registration_details: {
                    expires: 300,
                    contact: `sip:${config.auth_username}@${config.proxy}`,
                    user_agent: 'EDG-VoIP/1.0'
                }
            };
        }
    }
    /**
     * Simulate SIP OPTIONS ping (mock implementation)
     */
    async simulateSipOptions(config) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        // Mock connectivity test
        const random = Math.random();
        if (random > 0.2) {
            return {
                success: true,
                status: 'REG_OK',
                message: 'SIP trunk is reachable and responding'
            };
        }
        else {
            return {
                success: false,
                status: 'FAIL',
                message: 'SIP trunk is not responding'
            };
        }
    }
    /**
     * Test multiple configurations
     */
    async testMultipleConfigurations(configs) {
        const results = [];
        for (const config of configs) {
            try {
                const result = await this.testSipRegistration(config);
                results.push(result);
            }
            catch (error) {
                results.push({
                    success: false,
                    status: 'NETWORK_ERROR',
                    message: 'Test failed',
                    error_details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return results;
    }
}
exports.SipTestService = SipTestService;
//# sourceMappingURL=sip-test-service.js.map