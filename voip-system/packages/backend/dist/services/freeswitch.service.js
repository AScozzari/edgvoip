"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreeSWITCHService = void 0;
const events_1 = require("events");
const net_1 = require("net");
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
class FreeSWITCHService extends events_1.EventEmitter {
    constructor() {
        super();
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000;
        this.eventBuffer = '';
        this.eventListeners = new Map();
        this.host = process.env.FREESWITCH_HOST || '192.168.172.234';
        this.port = parseInt(process.env.FREESWITCH_PORT || '8021');
        this.password = process.env.FREESWITCH_PASSWORD || 'ClueCon';
    }
    // Connect to FreeSWITCH Event Socket
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new net_1.Socket();
                this.socket.on('connect', () => {
                    this.connected = true;
                    this.reconnectAttempts = 0;
                    (0, logger_1.logFreeSWITCHEvent)('connection', { status: 'connected', host: this.host, port: this.port });
                    this.emit('connected');
                });
                this.socket.on('data', (data) => {
                    this.handleData(data.toString());
                });
                this.socket.on('error', (error) => {
                    (0, logger_1.logFreeSWITCHEvent)('connection_error', { error: error.message });
                    this.emit('error', error);
                    this.handleReconnect();
                });
                this.socket.on('close', () => {
                    this.connected = false;
                    (0, logger_1.logFreeSWITCHEvent)('connection', { status: 'disconnected' });
                    this.emit('disconnected');
                    this.handleReconnect();
                });
                this.socket.connect(this.port, this.host, () => {
                    // Send authentication
                    this.sendCommand('auth', this.password);
                });
                // Set up authentication response handler
                this.once('auth_success', () => {
                    this.subscribeToEvents();
                    resolve();
                });
                this.once('auth_failure', (error) => {
                    reject(new Error(`FreeSWITCH authentication failed: ${error}`));
                });
                // Timeout for connection
                setTimeout(() => {
                    if (!this.connected) {
                        reject(new Error('FreeSWITCH connection timeout'));
                    }
                }, 10000);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    // Handle incoming data from FreeSWITCH
    handleData(data) {
        this.eventBuffer += data;
        // Process complete events
        while (this.eventBuffer.includes('\n\n')) {
            const eventEnd = this.eventBuffer.indexOf('\n\n');
            const eventData = this.eventBuffer.substring(0, eventEnd);
            this.eventBuffer = this.eventBuffer.substring(eventEnd + 2);
            this.processEvent(eventData);
        }
    }
    // Process a complete event
    processEvent(eventData) {
        const lines = eventData.split('\n');
        const event = {
            eventName: '',
            headers: {},
            body: ''
        };
        let inBody = false;
        let bodyLines = [];
        for (const line of lines) {
            if (line.trim() === '') {
                inBody = true;
                continue;
            }
            if (inBody) {
                bodyLines.push(line);
            }
            else {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim();
                    if (key === 'Event-Name') {
                        event.eventName = value;
                    }
                    else {
                        event.headers[key] = value;
                    }
                }
            }
        }
        if (bodyLines.length > 0) {
            event.body = bodyLines.join('\n');
        }
        this.handleEvent(event);
    }
    // Handle specific events
    handleEvent(event) {
        (0, logger_1.logFreeSWITCHEvent)('event_received', {
            eventName: event.eventName,
            uuid: event.headers['Unique-ID']
        });
        // Handle authentication response
        if (event.eventName === 'auth/request') {
            this.emit('auth_success');
            return;
        }
        if (event.eventName === 'auth/request') {
            this.emit('auth_failure', 'Authentication failed');
            return;
        }
        // Handle call events
        switch (event.eventName) {
            case 'CHANNEL_CREATE':
                this.handleChannelCreate(event);
                break;
            case 'CHANNEL_ANSWER':
                this.handleChannelAnswer(event);
                break;
            case 'CHANNEL_HANGUP':
                this.handleChannelHangup(event);
                break;
            case 'CHANNEL_BRIDGE':
                this.handleChannelBridge(event);
                break;
            case 'RECORD_START':
                this.handleRecordStart(event);
                break;
            case 'RECORD_STOP':
                this.handleRecordStop(event);
                break;
            default:
                // Emit generic event
                this.emit('event', event);
        }
        // Call specific event listeners
        const listener = this.eventListeners.get(event.eventName);
        if (listener) {
            listener(event);
        }
    }
    // Handle channel creation
    handleChannelCreate(event) {
        const callInfo = {
            uuid: event.headers['Unique-ID'],
            direction: this.getCallDirection(event),
            caller_id_number: event.headers['Caller-Caller-ID-Number'] || '',
            caller_id_name: event.headers['Caller-Caller-ID-Name'] || '',
            callee_id_number: event.headers['Caller-Destination-Number'] || '',
            callee_id_name: event.headers['Caller-Destination-Name'] || '',
            domain: event.headers['Caller-Domain'] || '',
            context: event.headers['Caller-Context'] || '',
            start_time: new Date()
        };
        this.emit('call_started', callInfo);
    }
    // Handle channel answer
    handleChannelAnswer(event) {
        const callInfo = {
            uuid: event.headers['Unique-ID'],
            answer_time: new Date()
        };
        this.emit('call_answered', callInfo);
    }
    // Handle channel hangup
    handleChannelHangup(event) {
        const callInfo = {
            uuid: event.headers['Unique-ID'],
            end_time: new Date(),
            duration: parseInt(event.headers['variable_duration'] || '0'),
            hangup_cause: event.headers['Hangup-Cause']
        };
        this.emit('call_ended', callInfo);
    }
    // Handle channel bridge
    handleChannelBridge(event) {
        const callInfo = {
            uuid: event.headers['Unique-ID']
        };
        this.emit('call_bridged', callInfo);
    }
    // Handle recording start
    handleRecordStart(event) {
        const callInfo = {
            uuid: event.headers['Unique-ID'],
            recording_path: event.headers['variable_record_sample_rate']
        };
        this.emit('recording_started', callInfo);
    }
    // Handle recording stop
    handleRecordStop(event) {
        const callInfo = {
            uuid: event.headers['Unique-ID']
        };
        this.emit('recording_stopped', callInfo);
    }
    // Determine call direction
    getCallDirection(event) {
        const context = event.headers['Caller-Context'];
        const direction = event.headers['Call-Direction'];
        if (direction === 'inbound')
            return 'inbound';
        if (direction === 'outbound')
            return 'outbound';
        if (context === 'internal')
            return 'internal';
        // Fallback logic
        const callerNumber = event.headers['Caller-Caller-ID-Number'];
        const calleeNumber = event.headers['Caller-Destination-Number'];
        if (callerNumber && callerNumber.startsWith('+'))
            return 'outbound';
        if (calleeNumber && calleeNumber.startsWith('+'))
            return 'inbound';
        return 'internal';
    }
    // Subscribe to events
    subscribeToEvents() {
        const events = [
            'CHANNEL_CREATE',
            'CHANNEL_ANSWER',
            'CHANNEL_HANGUP',
            'CHANNEL_BRIDGE',
            'RECORD_START',
            'RECORD_STOP',
            'CUSTOM',
            'BACKGROUND_JOB'
        ];
        this.sendCommand('event', `plain ${events.join(' ')}`);
    }
    // Send command to FreeSWITCH
    sendCommand(command, args) {
        if (!this.connected || !this.socket) {
            throw new Error('FreeSWITCH not connected');
        }
        const fullCommand = args ? `${command} ${args}` : command;
        const message = `${fullCommand}\n\n`;
        this.socket.write(message);
        (0, logger_1.logFreeSWITCHEvent)('command_sent', { command, args });
    }
    // Originate a call
    async originateCall(callerExtension, calleeNumber, domain, options = {}) {
        const callUuid = (0, uuid_1.v4)();
        const timeout = options.timeout || 30;
        const callerId = options.callerId || callerExtension;
        const context = options.context || 'default';
        const recording = options.recording ? 'true' : 'false';
        const originateString = `{origination_uuid=${callUuid},origination_caller_id_number=${callerId},origination_caller_id_name=${callerId},record=${recording}}${callerExtension}@${domain} &bridge({origination_uuid=${callUuid}}${calleeNumber})`;
        this.sendCommand('originate', originateString);
        return callUuid;
    }
    // Transfer a call
    async transferCall(callUuid, destination, type = 'blind') {
        if (type === 'attended') {
            this.sendCommand('uuid_transfer', `${callUuid} ${destination} XML default`);
        }
        else {
            this.sendCommand('uuid_bridge', `${callUuid} ${destination}`);
        }
    }
    // Hangup a call
    async hangupCall(callUuid, cause = 'NORMAL_CLEARING') {
        this.sendCommand('uuid_kill', `${callUuid} ${cause}`);
    }
    // Hold/Unhold a call
    async holdCall(callUuid, hold = true) {
        const action = hold ? 'hold' : 'unhold';
        this.sendCommand('uuid_hold', `${callUuid} ${action}`);
    }
    // Mute/Unmute a call
    async muteCall(callUuid, mute = true) {
        const action = mute ? 'mute' : 'unmute';
        this.sendCommand('uuid_audio', `${callUuid} ${action}`);
    }
    // Start/Stop recording
    async recordCall(callUuid, record = true, path) {
        if (record) {
            const recordPath = path || `/var/recordings/${callUuid}.wav`;
            this.sendCommand('uuid_record', `${callUuid} start ${recordPath}`);
        }
        else {
            this.sendCommand('uuid_record', `${callUuid} stop`);
        }
    }
    // Get call information
    async getCallInfo(callUuid) {
        return new Promise((resolve, reject) => {
            const jobUuid = (0, uuid_1.v4)();
            const listener = (event) => {
                if (event.eventName === 'BACKGROUND_JOB' && event.headers['Job-UUID'] === jobUuid) {
                    this.eventListeners.delete('BACKGROUND_JOB');
                    if (event.headers['Job-Command-Arg']?.includes('uuid_dump')) {
                        const info = {};
                        const lines = event.body?.split('\n') || [];
                        for (const line of lines) {
                            const colonIndex = line.indexOf(':');
                            if (colonIndex > 0) {
                                const key = line.substring(0, colonIndex).trim();
                                const value = line.substring(colonIndex + 1).trim();
                                info[key] = value;
                            }
                        }
                        resolve(info);
                    }
                    else {
                        reject(new Error('Failed to get call info'));
                    }
                }
            };
            this.eventListeners.set('BACKGROUND_JOB', listener);
            this.sendCommand('bgapi', `uuid_dump ${callUuid}`);
            // Timeout after 5 seconds
            setTimeout(() => {
                this.eventListeners.delete('BACKGROUND_JOB');
                reject(new Error('Timeout getting call info'));
            }, 5000);
        });
    }
    // Add event listener
    addEventListener(eventName, listener) {
        this.eventListeners.set(eventName, listener);
    }
    // Remove event listener
    removeEventListener(eventName) {
        this.eventListeners.delete(eventName);
    }
    // Handle reconnection
    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            (0, logger_1.logFreeSWITCHEvent)('reconnect_failed', {
                attempts: this.reconnectAttempts,
                maxAttempts: this.maxReconnectAttempts
            });
            return;
        }
        this.reconnectAttempts++;
        (0, logger_1.logFreeSWITCHEvent)('reconnect_attempt', {
            attempt: this.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts
        });
        setTimeout(() => {
            this.connect().catch((error) => {
                (0, logger_1.logFreeSWITCHEvent)('reconnect_error', { error: error.message });
            });
        }, this.reconnectInterval);
    }
    // Disconnect from FreeSWITCH
    disconnect() {
        if (this.socket) {
            this.socket.end();
            this.socket = null;
        }
        this.connected = false;
        this.eventListeners.clear();
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
            reconnectAttempts: this.reconnectAttempts
        };
    }
}
exports.FreeSWITCHService = FreeSWITCHService;
//# sourceMappingURL=freeswitch.service.js.map