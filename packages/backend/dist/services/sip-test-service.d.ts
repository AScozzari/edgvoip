import { EventEmitter } from 'events';
export interface SipTestConfig {
    provider: string;
    proxy: string;
    port: number;
    transport: 'udp' | 'tcp' | 'tls';
    auth_username: string;
    auth_password: string;
    from_domain?: string;
}
export interface SipTestResult {
    success: boolean;
    status: 'REG_OK' | 'FAIL' | 'TIMEOUT' | 'AUTH_FAILED' | 'NETWORK_ERROR';
    message: string;
    response_time_ms?: number;
    error_details?: string;
    registration_details?: {
        expires?: number;
        contact?: string;
        user_agent?: string;
    };
}
export declare class SipTestService extends EventEmitter {
    private testTimeout;
    /**
     * Test SIP registration with provider
     */
    testSipRegistration(config: SipTestConfig): Promise<SipTestResult>;
    /**
     * Test SIP trunk connectivity (ping/OPTIONS)
     */
    testSipTrunkConnectivity(config: SipTestConfig): Promise<SipTestResult>;
    /**
     * Test specific Messagenet configuration
     */
    testMessagenetConnection(): Promise<SipTestResult>;
    /**
     * Simulate SIP registration (mock implementation)
     * In production, this would use a real SIP library
     */
    private simulateSipRegistration;
    /**
     * Simulate SIP OPTIONS ping (mock implementation)
     */
    private simulateSipOptions;
    /**
     * Test multiple configurations
     */
    testMultipleConfigurations(configs: SipTestConfig[]): Promise<SipTestResult[]>;
}
//# sourceMappingURL=sip-test-service.d.ts.map