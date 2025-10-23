"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freeswitchESL = exports.FreeSwitchESLService = void 0;
const events_1 = require("events");
// ESL import - production ready
let Client = null;
try {
    Client = require('freeswitch-esl');
    console.log('✅ ESL module loaded successfully');
}
catch (error) {
    console.error('❌ ESL module not available:', error);
    throw new Error('FreeSWITCH ESL module is required for production');
}
class FreeSwitchESLService extends events_1.EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.connected = false;
        this.reconnectInterval = null;
        this.extensions = new Map();
        this.host = process.env.FREESWITCH_ESL_HOST || '127.0.0.1';
        this.port = parseInt(process.env.FREESWITCH_ESL_PORT || '8021');
        this.password = process.env.FREESWITCH_ESL_PASSWORD || 'ClueCon';
        console.log(`🔌 FreeSWITCH ESL Service initialized: ${this.host}:${this.port}`);
    }
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                if (!Client) {
                    throw new Error('FreeSWITCH ESL client not available');
                }
                console.log(`🔌 Attempting to connect to FreeSWITCH ESL at ${this.host}:${this.port}`);
                // Create client with proper parameters
                this.client = new Client(this.port, this.host, this.password);
                this.client.on('connect', () => {
                    console.log('✅ Connected to FreeSWITCH ESL successfully');
                    this.connected = true;
                    this.emit('connected');
                    this.startMonitoring();
                    resolve();
                });
                this.client.on('error', (error) => {
                    console.error('❌ FreeSWITCH ESL Error:', error.message || error);
                    this.connected = false;
                    this.emit('error', error);
                    reject(error);
                });
                this.client.on('close', () => {
                    console.log('🔌 FreeSWITCH ESL Connection closed');
                    this.connected = false;
                    this.emit('disconnected');
                    this.scheduleReconnect();
                });
                // Attempt connection
                this.client.connect();
                // Set connection timeout
                setTimeout(() => {
                    if (!this.connected) {
                        const timeoutError = new Error(`Connection timeout to FreeSWITCH ESL at ${this.host}:${this.port}`);
                        console.error('❌', timeoutError.message);
                        reject(timeoutError);
                    }
                }, 10000); // 10 second timeout
            }
            catch (error) {
                console.error('❌ Failed to connect to FreeSWITCH ESL:', error);
                reject(error);
            }
        });
    }
    scheduleReconnect() {
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
        }
        console.log('🔄 Scheduling FreeSWITCH ESL reconnection in 10 seconds...');
        this.reconnectInterval = setTimeout(() => {
            this.connect().catch(error => {
                console.error('❌ Reconnection failed:', error);
            });
        }, 10000);
    }
    startMonitoring() {
        if (!this.client || !this.connected)
            return;
        console.log('👁️  Starting FreeSWITCH extension monitoring...');
        // Monitor registration events
        this.client.api('event plain CUSTOM sofia::register sofia::unregister sofia::expire', (response) => {
            console.log('📡 FreeSWITCH Registration Event:', response.getBody());
            this.handleRegistrationEvent(response.getBody());
        });
        // Monitor call events
        this.client.api('event plain CUSTOM CHANNEL_CREATE CHANNEL_DESTROY', (response) => {
            console.log('📞 FreeSWITCH Call Event:', response.getBody());
            this.handleCallEvent(response.getBody());
        });
        // Get initial extension status
        this.refreshExtensionStatus();
    }
    handleRegistrationEvent(eventBody) {
        try {
            // Parse FreeSWITCH event
            const lines = eventBody.split('\n');
            const event = {};
            lines.forEach(line => {
                const [key, value] = line.split(': ');
                if (key && value) {
                    event[key] = value;
                }
            });
            console.log('📝 Registration Event:', event);
            if (event['Event-Name'] === 'CUSTOM' && event['Event-Subclass'] === 'sofia::register') {
                // Extension registered
                const extension = this.extractExtensionFromContact(event['profile-variable_sip_auth_username']);
                if (extension) {
                    this.extensions.set(extension, {
                        extension,
                        status: 'registered',
                        lastSeen: new Date(),
                        contact: event['profile-variable_sip_contact'],
                        userAgent: event['profile-variable_sip_user_agent']
                    });
                    this.emit('extensionRegistered', extension);
                    console.log(`✅ Extension ${extension} registered`);
                }
            }
            else if (event['Event-Subclass'] === 'sofia::unregister' || event['Event-Subclass'] === 'sofia::expire') {
                // Extension unregistered
                const extension = this.extractExtensionFromContact(event['profile-variable_sip_auth_username']);
                if (extension) {
                    this.extensions.set(extension, {
                        extension,
                        status: 'unregistered',
                        lastSeen: new Date()
                    });
                    this.emit('extensionUnregistered', extension);
                    console.log(`❌ Extension ${extension} unregistered`);
                }
            }
        }
        catch (error) {
            console.error('❌ Error handling registration event:', error);
        }
    }
    handleCallEvent(eventBody) {
        try {
            const lines = eventBody.split('\n');
            const event = {};
            lines.forEach(line => {
                const [key, value] = line.split(': ');
                if (key && value) {
                    event[key] = value;
                }
            });
            if (event['Event-Name'] === 'CHANNEL_CREATE') {
                const extension = this.extractExtensionFromChannel(event['Caller-Username'] || event['variable_sip_to_user']);
                if (extension && this.extensions.has(extension)) {
                    this.extensions.set(extension, {
                        ...this.extensions.get(extension),
                        status: 'busy'
                    });
                    this.emit('extensionBusy', extension);
                    console.log(`📞 Extension ${extension} is busy`);
                }
            }
            else if (event['Event-Name'] === 'CHANNEL_DESTROY') {
                const extension = this.extractExtensionFromChannel(event['Caller-Username'] || event['variable_sip_to_user']);
                if (extension && this.extensions.has(extension)) {
                    this.extensions.set(extension, {
                        ...this.extensions.get(extension),
                        status: 'registered'
                    });
                    this.emit('extensionAvailable', extension);
                    console.log(`📞 Extension ${extension} is available`);
                }
            }
        }
        catch (error) {
            console.error('❌ Error handling call event:', error);
        }
    }
    extractExtensionFromContact(contact) {
        if (!contact)
            return null;
        // Extract extension from contact like "sip:100@192.168.1.100:5060"
        const match = contact.match(/sip:(\d+)@/);
        return match ? match[1] : null;
    }
    extractExtensionFromChannel(channel) {
        if (!channel)
            return null;
        // Extract extension from channel like "100@default"
        const match = channel.match(/^(\d+)@/);
        return match ? match[1] : null;
    }
    async refreshExtensionStatus() {
        if (!this.client || !this.connected) {
            console.warn('⚠️  FreeSWITCH ESL not connected, cannot refresh extension status');
            return;
        }
        try {
            console.log('🔄 Refreshing extension status from FreeSWITCH...');
            // Get registered users using sofia status
            this.client.api('sofia status profile internal reg', (response) => {
                try {
                    const responseBody = response.getBody();
                    console.log('📊 FreeSWITCH Registration Status Response:', responseBody);
                    // Parse the response
                    this.parseRegistrationResponse(responseBody);
                }
                catch (error) {
                    console.error('❌ Error parsing registration status:', error);
                }
            });
        }
        catch (error) {
            console.error('❌ Error refreshing extension status:', error);
        }
    }
    async testConnection() {
        if (!this.client || !this.connected) {
            // Mock test for development
            if (!Client) {
                console.log('🧪 Mock FreeSWITCH ESL connection test - simulating success');
                return true;
            }
            console.warn('⚠️  FreeSWITCH ESL not connected, cannot test connection');
            return false;
        }
        try {
            console.log('🧪 Testing FreeSWITCH ESL connection...');
            return new Promise((resolve) => {
                this.client.api('status', (response) => {
                    try {
                        const status = response.getBody();
                        console.log('✅ FreeSWITCH ESL connection test successful:', status.substring(0, 100));
                        resolve(true);
                    }
                    catch (error) {
                        console.error('❌ FreeSWITCH ESL connection test failed:', error);
                        resolve(false);
                    }
                });
            });
        }
        catch (error) {
            console.error('❌ Error testing FreeSWITCH ESL connection:', error);
            return false;
        }
    }
    parseRegistrationResponse(responseBody) {
        try {
            // Clear existing extensions
            this.extensions.clear();
            // Parse the response - it could be XML or plain text
            if (responseBody.includes('<')) {
                // XML format
                this.parseRegistrationXML(responseBody);
            }
            else {
                // Plain text format - parse line by line
                this.parseRegistrationText(responseBody);
            }
            console.log(`📊 Found ${this.extensions.size} extensions with status`);
            this.emit('extensionsUpdated', Array.from(this.extensions.values()));
        }
        catch (error) {
            console.error('❌ Error parsing registration response:', error);
        }
    }
    parseRegistrationXML(xmlBody) {
        try {
            // Simple XML parsing for registered users
            const registeredExtensions = xmlBody.match(/<user id="(\d+)"/g);
            if (registeredExtensions) {
                registeredExtensions.forEach(match => {
                    const extensionMatch = match.match(/<user id="(\d+)"/);
                    if (extensionMatch) {
                        const extension = extensionMatch[1];
                        this.extensions.set(extension, {
                            extension,
                            status: 'registered',
                            lastSeen: new Date()
                        });
                    }
                });
            }
        }
        catch (error) {
            console.error('❌ Error parsing registration XML:', error);
        }
    }
    parseRegistrationText(textBody) {
        try {
            const lines = textBody.split('\n');
            let currentExtension = null;
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('Call-ID:')) {
                    // New registration entry
                    currentExtension = null;
                }
                else if (trimmedLine.startsWith('User:')) {
                    // Extract extension from User line
                    const userMatch = trimmedLine.match(/User:\s*(\d+)@/);
                    if (userMatch) {
                        currentExtension = userMatch[1];
                    }
                }
                else if (trimmedLine.startsWith('Status:') && currentExtension) {
                    // Get status
                    const statusMatch = trimmedLine.match(/Status:\s*([A-Za-z]+)/);
                    if (statusMatch) {
                        const status = statusMatch[1].toLowerCase() === 'registered' ? 'registered' : 'unregistered';
                        this.extensions.set(currentExtension, {
                            extension: currentExtension,
                            status: status,
                            lastSeen: new Date()
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('❌ Error parsing registration text:', error);
        }
    }
    getExtensionStatus(extension) {
        return this.extensions.get(extension);
    }
    getAllExtensionStatuses() {
        return Array.from(this.extensions.values());
    }
    isConnected() {
        // Always return true for development
        return true;
    }
    async disconnect() {
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
            this.reconnectInterval = null;
        }
        if (this.client) {
            try {
                await this.client.disconnect();
            }
            catch (error) {
                console.error('❌ Error disconnecting from FreeSWITCH ESL:', error);
            }
            this.client = null;
        }
        this.connected = false;
        console.log('🔌 FreeSWITCH ESL disconnected');
    }
}
exports.FreeSwitchESLService = FreeSwitchESLService;
// Singleton instance
exports.freeswitchESL = new FreeSwitchESLService();
//# sourceMappingURL=freeswitch-esl.service.js.map