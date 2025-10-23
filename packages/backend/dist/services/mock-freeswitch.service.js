"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockFreeSWITCHService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
class MockFreeSWITCHService extends events_1.EventEmitter {
    constructor() {
        super();
        this.connected = false;
        this.activeCalls = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.host = process.env.FREESWITCH_HOST || '192.168.172.234';
        this.port = parseInt(process.env.FREESWITCH_PORT || '8021');
        this.password = process.env.FREESWITCH_PASSWORD || 'ClueCon';
        console.log('🎭 MockFreeSWITCH Service initialized (for testing without FreeSWITCH)');
    }
    // Connect to FreeSWITCH (Mock)
    async connect() {
        return new Promise((resolve) => {
            // Simula connessione dopo 1 secondo
            setTimeout(() => {
                this.connected = true;
                this.reconnectAttempts = 0;
                (0, logger_1.logFreeSWITCHEvent)('mock_connection', {
                    status: 'connected',
                    host: this.host,
                    port: this.port,
                    mode: 'MOCK'
                });
                console.log('✅ MockFreeSWITCH: Simulated connection successful');
                this.emit('connected');
                resolve();
            }, 1000);
        });
    }
    // Originate a call (Mock)
    async originateCall(callerExtension, calleeNumber, domain, options = {}) {
        const callUuid = (0, uuid_1.v4)();
        const timeout = options.timeout || 30;
        const callerId = options.callerId || callerExtension;
        const context = options.context || 'default';
        const callInfo = {
            uuid: callUuid,
            direction: 'outbound',
            caller_id_number: callerExtension,
            caller_id_name: callerId,
            callee_id_number: calleeNumber,
            callee_id_name: calleeNumber,
            domain: domain,
            context: context,
            start_time: new Date(),
            status: 'ringing'
        };
        this.activeCalls.set(callUuid, callInfo);
        (0, logger_1.logFreeSWITCHEvent)('mock_originate', {
            uuid: callUuid,
            from: callerExtension,
            to: calleeNumber,
            mode: 'MOCK'
        });
        // Simula CHANNEL_CREATE event
        this.emit('call_started', callInfo);
        // Simula answer dopo 2 secondi
        setTimeout(() => {
            const call = this.activeCalls.get(callUuid);
            if (call) {
                call.answer_time = new Date();
                call.status = 'answered';
                this.activeCalls.set(callUuid, call);
                this.emit('call_answered', call);
                (0, logger_1.logFreeSWITCHEvent)('mock_answer', { uuid: callUuid, mode: 'MOCK' });
            }
        }, 2000);
        // Simula hangup dopo timeout (se non chiusa manualmente)
        setTimeout(() => {
            const call = this.activeCalls.get(callUuid);
            if (call && call.status !== 'hangup') {
                this.hangupCall(callUuid, 'NORMAL_CLEARING');
            }
        }, timeout * 1000);
        return callUuid;
    }
    // Transfer a call (Mock)
    async transferCall(callUuid, destination, type = 'blind') {
        const call = this.activeCalls.get(callUuid);
        if (!call) {
            throw new Error(`Call ${callUuid} not found`);
        }
        (0, logger_1.logFreeSWITCHEvent)('mock_transfer', {
            uuid: callUuid,
            destination,
            type,
            mode: 'MOCK'
        });
        // Simula trasferimento
        call.callee_id_number = destination;
        this.activeCalls.set(callUuid, call);
        this.emit('call_transferred', call);
    }
    // Hangup a call (Mock)
    async hangupCall(callUuid, cause = 'NORMAL_CLEARING') {
        const call = this.activeCalls.get(callUuid);
        if (!call) {
            throw new Error(`Call ${callUuid} not found`);
        }
        call.end_time = new Date();
        call.status = 'hangup';
        call.hangup_cause = cause;
        if (call.answer_time && call.start_time) {
            call.duration = Math.floor((call.end_time.getTime() - call.answer_time.getTime()) / 1000);
        }
        this.activeCalls.set(callUuid, call);
        (0, logger_1.logFreeSWITCHEvent)('mock_hangup', {
            uuid: callUuid,
            cause,
            duration: call.duration,
            mode: 'MOCK'
        });
        this.emit('call_ended', call);
        // Rimuovi la chiamata dopo 5 secondi
        setTimeout(() => {
            this.activeCalls.delete(callUuid);
        }, 5000);
    }
    // Hold/Unhold a call (Mock)
    async holdCall(callUuid, hold = true) {
        const call = this.activeCalls.get(callUuid);
        if (!call) {
            throw new Error(`Call ${callUuid} not found`);
        }
        (0, logger_1.logFreeSWITCHEvent)('mock_hold', {
            uuid: callUuid,
            hold,
            mode: 'MOCK'
        });
        this.emit('call_hold', { uuid: callUuid, hold });
    }
    // Mute/Unmute a call (Mock)
    async muteCall(callUuid, mute = true) {
        const call = this.activeCalls.get(callUuid);
        if (!call) {
            throw new Error(`Call ${callUuid} not found`);
        }
        (0, logger_1.logFreeSWITCHEvent)('mock_mute', {
            uuid: callUuid,
            mute,
            mode: 'MOCK'
        });
        this.emit('call_mute', { uuid: callUuid, mute });
    }
    // Start/Stop recording (Mock)
    async recordCall(callUuid, record = true, path) {
        const call = this.activeCalls.get(callUuid);
        if (!call) {
            throw new Error(`Call ${callUuid} not found`);
        }
        if (record) {
            const recordPath = path || `/var/recordings/${callUuid}.wav`;
            call.recording_path = recordPath;
            this.activeCalls.set(callUuid, call);
            (0, logger_1.logFreeSWITCHEvent)('mock_record_start', {
                uuid: callUuid,
                path: recordPath,
                mode: 'MOCK'
            });
            this.emit('recording_started', call);
        }
        else {
            (0, logger_1.logFreeSWITCHEvent)('mock_record_stop', {
                uuid: callUuid,
                mode: 'MOCK'
            });
            this.emit('recording_stopped', call);
        }
    }
    // Get call information (Mock)
    async getCallInfo(callUuid) {
        const call = this.activeCalls.get(callUuid);
        if (!call) {
            throw new Error(`Call ${callUuid} not found`);
        }
        return {
            'Call-UUID': call.uuid,
            'Caller-Caller-ID-Number': call.caller_id_number,
            'Caller-Caller-ID-Name': call.caller_id_name,
            'Caller-Destination-Number': call.callee_id_number,
            'Caller-Domain': call.domain,
            'Caller-Context': call.context,
            'Call-Direction': call.direction,
            'Channel-State': call.status,
            'Answer-Time': call.answer_time?.toISOString() || '',
            'Start-Time': call.start_time.toISOString(),
            'Duration': call.duration?.toString() || '0',
            'Recording-Path': call.recording_path || '',
            'Mock-Mode': 'true'
        };
    }
    // Send command to FreeSWITCH (Mock)
    sendCommand(command, args) {
        (0, logger_1.logFreeSWITCHEvent)('mock_command', {
            command,
            args,
            mode: 'MOCK'
        });
        // Mock: non fa nulla ma logga il comando
    }
    // Add event listener
    addEventListener(eventName, listener) {
        this.on(eventName, listener);
    }
    // Remove event listener
    removeEventListener(eventName) {
        this.removeAllListeners(eventName);
    }
    // Disconnect from FreeSWITCH (Mock)
    disconnect() {
        this.connected = false;
        this.activeCalls.clear();
        (0, logger_1.logFreeSWITCHEvent)('mock_disconnect', { mode: 'MOCK' });
        this.emit('disconnected');
        console.log('🎭 MockFreeSWITCH: Disconnected');
    }
    // Check if connected
    isConnected() {
        return this.connected;
    }
    // Get connection status
    getStatus() {
        return {
            connected: this.connected,
            host: this.host,
            port: this.port,
            reconnectAttempts: this.reconnectAttempts,
            mode: 'MOCK (Testing without FreeSWITCH)'
        };
    }
    // Get active calls
    getActiveCalls() {
        return Array.from(this.activeCalls.values());
    }
    // Get call count
    getCallCount() {
        return this.activeCalls.size;
    }
}
exports.MockFreeSWITCHService = MockFreeSWITCHService;
//# sourceMappingURL=mock-freeswitch.service.js.map