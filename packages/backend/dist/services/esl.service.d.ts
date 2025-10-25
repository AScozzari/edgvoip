import { EventEmitter } from 'events';
/**
 * FreeSWITCH Event Socket Layer (ESL) Service
 * Manages connection to FreeSWITCH Event Socket for real-time events and call control
 */
export declare class ESLService extends EventEmitter {
    private connection;
    private reconnectTimer;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private maxReconnectDelay;
    private isConnecting;
    private isShuttingDown;
    private host;
    private port;
    private password;
    constructor();
    /**
     * Connect to FreeSWITCH Event Socket
     */
    connect(): Promise<void>;
    /**
     * Setup event handlers for ESL connection
     */
    private setupEventHandlers;
    /**
     * Subscribe to FreeSWITCH events
     */
    private subscribeToEvents;
    /**
     * Handle FreeSWITCH events
     */
    private handleFreeSWITCHEvent;
    /**
     * Handle CHANNEL_CREATE event - Call initiated
     */
    private handleChannelCreate;
    /**
     * Handle CHANNEL_ANSWER event - Call answered
     */
    private handleChannelAnswer;
    /**
     * Handle CHANNEL_BRIDGE event - Calls bridged
     */
    private handleChannelBridge;
    /**
     * Handle CHANNEL_HANGUP event - Call ended
     */
    private handleChannelHangup;
    /**
     * Schedule reconnection with exponential backoff
     */
    private scheduleReconnect;
    /**
     * Send command to FreeSWITCH via ESL
     */
    sendCommand(command: string): Promise<any>;
    /**
     * Execute bgapi command (background API)
     */
    sendBgapi(command: string): Promise<string>;
    /**
     * Hangup a call
     */
    hangupCall(uuid: string, cause?: string): Promise<void>;
    /**
     * Transfer a call
     */
    transferCall(uuid: string, destination: string): Promise<void>;
    /**
     * Park a call
     */
    parkCall(uuid: string): Promise<void>;
    /**
     * Hold a call
     */
    holdCall(uuid: string): Promise<void>;
    /**
     * Unhold a call
     */
    unholdCall(uuid: string): Promise<void>;
    /**
     * Get active calls
     */
    getActiveCalls(): Promise<any[]>;
    /**
     * Check if ESL is connected
     */
    isConnected(): boolean;
    /**
     * Disconnect from FreeSWITCH ESL
     */
    disconnect(): Promise<void>;
}
export declare function getESLService(): ESLService;
export declare function initializeESLService(): Promise<void>;
//# sourceMappingURL=esl.service.d.ts.map