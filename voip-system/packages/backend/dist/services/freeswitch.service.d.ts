import { EventEmitter } from 'events';
export interface FreeSWITCHEvent {
    eventName: string;
    headers: Record<string, string>;
    body?: string;
}
export interface CallInfo {
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
}
export declare class FreeSWITCHService extends EventEmitter {
    private socket;
    private connected;
    private host;
    private port;
    private password;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectInterval;
    private eventBuffer;
    private eventListeners;
    constructor();
    connect(): Promise<void>;
    private handleData;
    private processEvent;
    private handleEvent;
    private handleChannelCreate;
    private handleChannelAnswer;
    private handleChannelHangup;
    private handleChannelBridge;
    private handleRecordStart;
    private handleRecordStop;
    private getCallDirection;
    private subscribeToEvents;
    sendCommand(command: string, args?: string): void;
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
    addEventListener(eventName: string, listener: (event: FreeSWITCHEvent) => void): void;
    removeEventListener(eventName: string): void;
    private handleReconnect;
    disconnect(): void;
    isConnected(): boolean;
    getStatus(): {
        connected: boolean;
        host: string;
        port: number;
        reconnectAttempts: number;
    };
}
//# sourceMappingURL=freeswitch.service.d.ts.map