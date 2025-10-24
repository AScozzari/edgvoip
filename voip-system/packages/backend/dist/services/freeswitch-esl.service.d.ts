import { EventEmitter } from 'events';
export interface ExtensionStatus {
    extension: string;
    status: 'registered' | 'unregistered' | 'busy';
    lastSeen?: Date;
    contact?: string;
    userAgent?: string;
}
export declare class FreeSwitchESLService extends EventEmitter {
    private client;
    private connected;
    private reconnectInterval;
    private host;
    private port;
    private password;
    private extensions;
    constructor();
    connect(): Promise<void>;
    private scheduleReconnect;
    private startMonitoring;
    private handleRegistrationEvent;
    private handleCallEvent;
    private extractExtensionFromContact;
    private extractExtensionFromChannel;
    refreshExtensionStatus(): Promise<void>;
    testConnection(): Promise<boolean>;
    private parseRegistrationResponse;
    private parseRegistrationXML;
    private parseRegistrationText;
    getExtensionStatus(extension: string): ExtensionStatus | undefined;
    getAllExtensionStatuses(): ExtensionStatus[];
    isConnected(): boolean;
    disconnect(): Promise<void>;
}
export declare const freeswitchESL: FreeSwitchESLService;
//# sourceMappingURL=freeswitch-esl.service.d.ts.map