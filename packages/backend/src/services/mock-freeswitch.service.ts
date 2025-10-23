import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logFreeSWITCHEvent } from '../utils/logger';

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

export class MockFreeSWITCHService extends EventEmitter {
  private connected: boolean = false;
  private host: string;
  private port: number;
  private password: string;
  private activeCalls: Map<string, MockCallInfo> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    super();
    this.host = process.env.FREESWITCH_HOST || '192.168.172.234';
    this.port = parseInt(process.env.FREESWITCH_PORT || '8021');
    this.password = process.env.FREESWITCH_PASSWORD || 'ClueCon';

    console.log('🎭 MockFreeSWITCH Service initialized (for testing without FreeSWITCH)');
  }

  // Connect to FreeSWITCH (Mock)
  async connect(): Promise<void> {
    return new Promise((resolve) => {
      // Simula connessione dopo 1 secondo
      setTimeout(() => {
        this.connected = true;
        this.reconnectAttempts = 0;
        logFreeSWITCHEvent('mock_connection', { 
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
  async originateCall(
    callerExtension: string,
    calleeNumber: string,
    domain: string,
    options: {
      timeout?: number;
      callerId?: string;
      context?: string;
      recording?: boolean;
    } = {}
  ): Promise<string> {
    const callUuid = uuidv4();
    const timeout = options.timeout || 30;
    const callerId = options.callerId || callerExtension;
    const context = options.context || 'default';

    const callInfo: MockCallInfo = {
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

    logFreeSWITCHEvent('mock_originate', { 
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
        logFreeSWITCHEvent('mock_answer', { uuid: callUuid, mode: 'MOCK' });
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
  async transferCall(
    callUuid: string,
    destination: string,
    type: 'attended' | 'blind' = 'blind'
  ): Promise<void> {
    const call = this.activeCalls.get(callUuid);
    if (!call) {
      throw new Error(`Call ${callUuid} not found`);
    }

    logFreeSWITCHEvent('mock_transfer', { 
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
  async hangupCall(callUuid: string, cause: string = 'NORMAL_CLEARING'): Promise<void> {
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

    logFreeSWITCHEvent('mock_hangup', { 
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
  async holdCall(callUuid: string, hold: boolean = true): Promise<void> {
    const call = this.activeCalls.get(callUuid);
    if (!call) {
      throw new Error(`Call ${callUuid} not found`);
    }

    logFreeSWITCHEvent('mock_hold', { 
      uuid: callUuid, 
      hold,
      mode: 'MOCK' 
    });

    this.emit('call_hold', { uuid: callUuid, hold });
  }

  // Mute/Unmute a call (Mock)
  async muteCall(callUuid: string, mute: boolean = true): Promise<void> {
    const call = this.activeCalls.get(callUuid);
    if (!call) {
      throw new Error(`Call ${callUuid} not found`);
    }

    logFreeSWITCHEvent('mock_mute', { 
      uuid: callUuid, 
      mute,
      mode: 'MOCK' 
    });

    this.emit('call_mute', { uuid: callUuid, mute });
  }

  // Start/Stop recording (Mock)
  async recordCall(callUuid: string, record: boolean = true, path?: string): Promise<void> {
    const call = this.activeCalls.get(callUuid);
    if (!call) {
      throw new Error(`Call ${callUuid} not found`);
    }

    if (record) {
      const recordPath = path || `/var/recordings/${callUuid}.wav`;
      call.recording_path = recordPath;
      this.activeCalls.set(callUuid, call);

      logFreeSWITCHEvent('mock_record_start', { 
        uuid: callUuid, 
        path: recordPath,
        mode: 'MOCK' 
      });

      this.emit('recording_started', call);
    } else {
      logFreeSWITCHEvent('mock_record_stop', { 
        uuid: callUuid,
        mode: 'MOCK' 
      });

      this.emit('recording_stopped', call);
    }
  }

  // Get call information (Mock)
  async getCallInfo(callUuid: string): Promise<Record<string, string>> {
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
  sendCommand(command: string, args?: string): void {
    logFreeSWITCHEvent('mock_command', { 
      command, 
      args,
      mode: 'MOCK' 
    });
    // Mock: non fa nulla ma logga il comando
  }

  // Add event listener
  addEventListener(eventName: string, listener: (event: any) => void): void {
    this.on(eventName, listener);
  }

  // Remove event listener
  removeEventListener(eventName: string): void {
    this.removeAllListeners(eventName);
  }

  // Disconnect from FreeSWITCH (Mock)
  disconnect(): void {
    this.connected = false;
    this.activeCalls.clear();
    logFreeSWITCHEvent('mock_disconnect', { mode: 'MOCK' });
    this.emit('disconnected');
    console.log('🎭 MockFreeSWITCH: Disconnected');
  }

  // Check if connected
  isConnected(): boolean {
    return this.connected;
  }

  // Get connection status
  getStatus(): { connected: boolean; host: string; port: number; reconnectAttempts: number; mode: string } {
    return {
      connected: this.connected,
      host: this.host,
      port: this.port,
      reconnectAttempts: this.reconnectAttempts,
      mode: 'MOCK (Testing without FreeSWITCH)'
    };
  }

  // Get active calls
  getActiveCalls(): MockCallInfo[] {
    return Array.from(this.activeCalls.values());
  }

  // Get call count
  getCallCount(): number {
    return this.activeCalls.size;
  }
}

