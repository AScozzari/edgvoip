import { FreeSwitchClient } from 'esl';
import { EventEmitter } from 'events';
import { getClient } from '@w3-voip/database';

/**
 * FreeSWITCH Event Socket Layer (ESL) Service
 * Manages connection to FreeSWITCH Event Socket for real-time events and call control
 */
export class ESLService extends EventEmitter {
  private connection: FreeSwitchClient | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000; // Start with 1 second
  private maxReconnectDelay: number = 60000; // Max 60 seconds
  private isConnecting: boolean = false;
  private isShuttingDown: boolean = false;

  private host: string;
  private port: number;
  private password: string;

  constructor() {
    super();
    
    // Get ESL configuration from environment variables
    this.host = process.env.FREESWITCH_ESL_HOST || '127.0.0.1';
    this.port = parseInt(process.env.FREESWITCH_ESL_PORT || '8021', 10);
    this.password = process.env.FREESWITCH_ESL_PASSWORD || 'ClueCon';

    console.log(`📞 ESL Service initialized - ${this.host}:${this.port}`);
  }

  /**
   * Connect to FreeSWITCH Event Socket
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.connection) {
      console.log('⏳ ESL already connecting or connected');
      return;
    }

    this.isConnecting = true;

    try {
      console.log(`🔌 Connecting to FreeSWITCH ESL at ${this.host}:${this.port}...`);
      
      this.connection = new FreeSwitchClient({ 
        host: this.host, 
        port: this.port, 
        password: this.password 
      });
      
      // Setup event handlers BEFORE connecting
      this.setupEventHandlers();
      
      // Actually connect to FreeSWITCH (CRITICAL - was missing!)
      await this.connection.connect();
      
      console.log('✅ ESL socket authenticated');
      
      // Connection is now ready (ready event already handled in setupEventHandlers)

      // Subscribe to all events
      await this.subscribeToEvents();

      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.isConnecting = false;

      console.log('✅ ESL connected successfully');
      this.emit('connected');

    } catch (error) {
      this.isConnecting = false;
      this.connection = null;
      
      console.error('❌ ESL connection failed:', error);
      this.emit('error', error);
      
      // Attempt reconnection
      if (!this.isShuttingDown) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Setup event handlers for ESL connection
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // @ts-ignore - FreeSwitchClient types are incomplete
    this.connection.on('ready', () => {
      console.log('✅ ESL connection ready');
    });

    // @ts-ignore - FreeSwitchClient types are incomplete
    this.connection.on('end', () => {
      console.warn('⚠️ ESL connection ended');
      this.connection = null;
      
      if (!this.isShuttingDown) {
        this.scheduleReconnect();
      }
    });

    // @ts-ignore - FreeSwitchClient types are incomplete
    this.connection.on('error', (error: Error) => {
      console.error('❌ ESL connection error:', error);
      this.emit('error', error);
    });

    // @ts-ignore - FreeSwitchClient types are incomplete
    this.connection.on('esl::event::*', (event: any) => {
      this.handleFreeSWITCHEvent(event);
    });
  }

  /**
   * Subscribe to FreeSWITCH events
   */
  private async subscribeToEvents(): Promise<void> {
    if (!this.connection) return;

    try {
      // Subscribe to important events for CDR and call tracking
      await this.sendCommand('event plain CHANNEL_CREATE CHANNEL_ANSWER CHANNEL_BRIDGE CHANNEL_UNBRIDGE CHANNEL_HANGUP CHANNEL_HANGUP_COMPLETE');
      console.log('✅ Subscribed to FreeSWITCH events');
    } catch (error) {
      console.error('❌ Failed to subscribe to events:', error);
      throw error;
    }
  }

  /**
   * Handle FreeSWITCH events
   */
  private async handleFreeSWITCHEvent(event: any): Promise<void> {
    try {
      const eventName = event.getHeader('Event-Name');
      const callUuid = event.getHeader('Unique-ID');
      
      if (!eventName || !callUuid) return;

      console.log(`📡 ESL Event: ${eventName} - UUID: ${callUuid}`);

      // Emit specific event types
      this.emit('event', { eventName, event });
      this.emit(`event:${eventName}`, event);

      // Handle specific events for CDR
      switch (eventName) {
        case 'CHANNEL_CREATE':
          await this.handleChannelCreate(event);
          break;
        
        case 'CHANNEL_ANSWER':
          await this.handleChannelAnswer(event);
          break;
        
        case 'CHANNEL_BRIDGE':
          await this.handleChannelBridge(event);
          break;
        
        case 'CHANNEL_HANGUP':
        case 'CHANNEL_HANGUP_COMPLETE':
          await this.handleChannelHangup(event);
          break;
      }
    } catch (error) {
      console.error('❌ Error handling FreeSWITCH event:', error);
    }
  }

  /**
   * Handle CHANNEL_CREATE event - Call initiated
   */
  private async handleChannelCreate(event: any): Promise<void> {
    const client = await getClient();
    
    try {
      const callUuid = event.getHeader('Unique-ID');
      const callerIdName = event.getHeader('Caller-Caller-ID-Name');
      const callerIdNumber = event.getHeader('Caller-Caller-ID-Number');
      const destinationNumber = event.getHeader('Caller-Destination-Number');
      const callDirection = event.getHeader('Call-Direction');
      const context = event.getHeader('Caller-Context');

      // Find tenant from context
      const tenantResult = await client.query(
        'SELECT id FROM tenants WHERE slug = $1 LIMIT 1',
        [context]
      );

      if (tenantResult.rows.length === 0) {
        console.warn(`⚠️ Tenant not found for context: ${context}`);
        return;
      }

      const tenantId = tenantResult.rows[0].id;

      // Insert into call_status table for real-time tracking
      await client.query(`
        INSERT INTO call_status (
          tenant_id, call_uuid, caller_id_name, caller_id_number, 
          destination_number, call_direction, call_state, start_time
        ) VALUES ($1, $2, $3, $4, $5, $6, 'RINGING', CURRENT_TIMESTAMP)
        ON CONFLICT (call_uuid) DO UPDATE 
        SET call_state = 'RINGING', last_updated = CURRENT_TIMESTAMP
      `, [tenantId, callUuid, callerIdName, callerIdNumber, destinationNumber, callDirection]);

      console.log(`📞 Call Created: ${callerIdNumber} → ${destinationNumber} (${callUuid})`);

    } finally {
      await client.release();
    }
  }

  /**
   * Handle CHANNEL_ANSWER event - Call answered
   */
  private async handleChannelAnswer(event: any): Promise<void> {
    const client = await getClient();
    
    try {
      const callUuid = event.getHeader('Unique-ID');

      await client.query(`
        UPDATE call_status 
        SET call_state = 'ANSWERED', 
            answer_time = CURRENT_TIMESTAMP,
            last_updated = CURRENT_TIMESTAMP
        WHERE call_uuid = $1
      `, [callUuid]);

      console.log(`✅ Call Answered: ${callUuid}`);

    } finally {
      await client.release();
    }
  }

  /**
   * Handle CHANNEL_BRIDGE event - Calls bridged
   */
  private async handleChannelBridge(event: any): Promise<void> {
    const client = await getClient();
    
    try {
      const callUuid = event.getHeader('Unique-ID');

      await client.query(`
        UPDATE call_status 
        SET call_state = 'BRIDGED',
            last_updated = CURRENT_TIMESTAMP
        WHERE call_uuid = $1
      `, [callUuid]);

      console.log(`🔗 Call Bridged: ${callUuid}`);

    } finally {
      await client.release();
    }
  }

  /**
   * Handle CHANNEL_HANGUP event - Call ended
   */
  private async handleChannelHangup(event: any): Promise<void> {
    const client = await getClient();
    
    try {
      const callUuid = event.getHeader('Unique-ID');
      const hangupCause = event.getHeader('Hangup-Cause');
      const duration = parseInt(event.getHeader('variable_duration') || '0', 10);
      const billSec = parseInt(event.getHeader('variable_billsec') || '0', 10);

      // Move from call_status to cdr_enhanced
      await client.query(`
        UPDATE call_status 
        SET call_state = 'HANGUP',
            last_updated = CURRENT_TIMESTAMP
        WHERE call_uuid = $1
      `, [callUuid]);

      console.log(`📴 Call Hangup: ${callUuid} - ${hangupCause} (Duration: ${duration}s)`);

      // Note: The database trigger will automatically move this to cdr_enhanced

    } finally {
      await client.release();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.isShuttingDown) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      this.emit('max_reconnect_attempts');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);

    console.log(`⏳ Reconnecting to ESL in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send command to FreeSWITCH via ESL
   */
  async sendCommand(command: string): Promise<any> {
    if (!this.connection) {
      throw new Error('ESL not connected');
    }

    return new Promise((resolve, reject) => {
      // @ts-ignore - FreeSwitchClient types are incomplete
      this.connection!.api(command, (response: any) => {
        if (response.getHeader('Content-Type') === 'api/response' && 
            response.getBody() === '-ERR') {
          reject(new Error(`ESL command failed: ${command}`));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Execute bgapi command (background API)
   */
  async sendBgapi(command: string): Promise<string> {
    if (!this.connection) {
      throw new Error('ESL not connected');
    }

    return new Promise((resolve, reject) => {
      // @ts-ignore - FreeSwitchClient types are incomplete
      this.connection!.bgapi(command, (response: any) => {
        const jobUuid = response.getHeader('Job-UUID');
        if (jobUuid) {
          resolve(jobUuid);
        } else {
          reject(new Error('Failed to get Job-UUID from bgapi command'));
        }
      });
    });
  }

  /**
   * Hangup a call
   */
  async hangupCall(uuid: string, cause: string = 'NORMAL_CLEARING'): Promise<void> {
    await this.sendCommand(`uuid_kill ${uuid} ${cause}`);
    console.log(`📴 Hangup call: ${uuid} with cause ${cause}`);
  }

  /**
   * Transfer a call
   */
  async transferCall(uuid: string, destination: string): Promise<void> {
    await this.sendCommand(`uuid_transfer ${uuid} ${destination}`);
    console.log(`📞 Transfer call: ${uuid} to ${destination}`);
  }

  /**
   * Park a call
   */
  async parkCall(uuid: string): Promise<void> {
    await this.sendCommand(`uuid_park ${uuid}`);
    console.log(`🅿️ Park call: ${uuid}`);
  }

  /**
   * Hold a call
   */
  async holdCall(uuid: string): Promise<void> {
    await this.sendCommand(`uuid_hold ${uuid}`);
    console.log(`⏸️ Hold call: ${uuid}`);
  }

  /**
   * Unhold a call
   */
  async unholdCall(uuid: string): Promise<void> {
    await this.sendCommand(`uuid_hold off ${uuid}`);
    console.log(`▶️ Unhold call: ${uuid}`);
  }

  /**
   * Get active calls
   */
  async getActiveCalls(): Promise<any[]> {
    const client = await getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM call_status 
        WHERE call_state != 'HANGUP'
        ORDER BY start_time DESC
      `);
      
      return result.rows;
    } finally {
      await client.release();
    }
  }

  /**
   * Check if ESL is connected
   */
  isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Disconnect from FreeSWITCH ESL
   */
  async disconnect(): Promise<void> {
    this.isShuttingDown = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connection) {
      // @ts-ignore - FreeSwitchClient types are incomplete
      this.connection.disconnect();
      this.connection = null;
      console.log('🔌 ESL disconnected');
    }

    this.emit('disconnected');
  }
}

// Singleton instance
let eslServiceInstance: ESLService | null = null;

export function getESLService(): ESLService {
  if (!eslServiceInstance) {
    eslServiceInstance = new ESLService();
  }
  return eslServiceInstance;
}

export async function initializeESLService(): Promise<void> {
  const eslService = getESLService();
  
  // Only attempt connection if ESL is configured
  if (process.env.FREESWITCH_ESL_HOST) {
    try {
      await eslService.connect();
    } catch (error) {
      console.error('❌ Failed to initialize ESL service:', error);
      console.warn('⚠️ ESL service will retry connection in background');
    }
  } else {
    console.warn('⚠️ FREESWITCH_ESL_HOST not configured, ESL service will not connect');
  }
}
