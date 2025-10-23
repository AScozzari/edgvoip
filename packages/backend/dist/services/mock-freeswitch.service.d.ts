import { EventEmitter } from 'events';
/**
 * Mock FreeSWITCH Service per testing senza FreeSWITCH installato
 * Simula tutte le funzionalità di FreeSWITCH per testing locale
 */
export interface MockCallInfo {
    uuid: string;
    direction: 'inbound' | 'outbound' | 'internal';
    caller_id_number: string;
    caller_id_name: string;
    callee_id_number: string;
    callee_id_name: string;
    domain: string;
    context: string;
    start_time: Date;
    answer_time?: Date;
    end_time?: Date;
    duration?: number;
    hangup_cause?: string;
    recording_path?: string;
    status: 'ringing' | 'answered' | 'hangup';
}
export declare class MockFreeSWITCHService extends EventEmitter {
    private connected;
    private host;
    private port;
    private password;
    private activeCalls;
    private reconnectAttempts;
    private maxReconnectAttempts;
    constructor();
    connect(): Promise<void>;
    originateCall(callerExtension: string, calleeNumber: string, domain: string, options?: {
        timeout?: number;
        callerId?: string;
        context?: string;
        recording?: boolean;
    }): Promise<string>;
    transferCall(callUuid: string, destination: string, type?: 'attended' | 'blind'): Promise<void>;
    hangupCall(callUuid: string, cause?: string): Promise<void>;
    holdCall(callUuid: string, hold?: boolean): Promise<void>;
    muteCall(callUuid: string, mute?: boolean): Promise<void>;
    recordCall(callUuid: string, record?: boolean, path?: string): Promise<void>;
    getCallInfo(callUuid: string): Promise<Record<string, string>>;
    sendCommand(command: string, args?: string): void;
    addEventListener(eventName: string, listener: (event: any) => void): void;
    removeEventListener(eventName: string): void;
    disconnect(): void;
    isConnected(): boolean;
    getStatus(): {
        connected: boolean;
        host: string;
        port: number;
        reconnectAttempts: number;
        mode: string;
    };
    getActiveCalls(): MockCallInfo[];
    getCallCount(): number;
}
//# sourceMappingURL=mock-freeswitch.service.d.ts.map