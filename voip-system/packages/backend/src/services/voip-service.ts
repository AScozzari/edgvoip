// @ts-nocheck
// import { 
//   InboundRoute, 
//   OutboundRoute, 
//   TimeCondition, 
//   IvrMenu, 
//   RingGroup, 
//   Queue, 
//   ConferenceRoom, 
//   VoicemailBox,
//   DialplanContext,
//   OpenSipsRoute,
//   SipExtensionConfig,
//   SipTrunkConfig
// } from '@w3-voip/shared';
import { TenantContext } from '../middleware/tenant-context';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Define types locally
export interface InboundRoute {
  id: string;
  tenant_id: string;
  name: string;
  pattern: string;
  destination: string;
  priority: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OutboundRoute {
  id: string;
  tenant_id: string;
  name: string;
  pattern: string;
  trunk_id: string;
  priority: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TimeCondition {
  id: string;
  tenant_id: string;
  name: string;
  time_ranges: string[];
  timezone: string;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IvrMenu {
  id: string;
  tenant_id: string;
  name: string;
  prompt: string;
  options: any[];
  timeout: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RingGroup {
  id: string;
  tenant_id: string;
  name: string;
  extensions: string[];
  strategy: 'simultaneous' | 'sequential';
  timeout: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Queue {
  id: string;
  tenant_id: string;
  name: string;
  strategy: 'fifo' | 'priority';
  timeout: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ConferenceRoom {
  id: string;
  tenant_id: string;
  name: string;
  pin: string;
  max_participants: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface VoicemailBox {
  id: string;
  tenant_id: string;
  extension_id: string;
  password: string;
  email_notification: boolean;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DialplanContext {
  id: string;
  tenant_id: string;
  name: string;
  extensions: any[];
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OpenSipsRoute {
  id: string;
  tenant_id: string;
  name: string;
  pattern: string;
  destination: string;
  priority: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SipExtensionConfig {
  id: string;
  tenant_id: string;
  extension: string;
  password: string;
  display_name: string;
  status: 'active' | 'inactive';
  type: 'user' | 'queue' | 'conference';
  created_at: Date;
  updated_at: Date;
}

export interface SipTrunkConfig {
  id: string;
  tenant_id: string;
  name: string;
  provider: string;
  host: string;
  port: number;
  transport: 'udp' | 'tcp' | 'tls';
  username: string;
  password: string;
  status: 'active' | 'inactive' | 'testing';
  created_at: Date;
  updated_at: Date;
}

// Load environment variables
dotenv.config();

export interface FreeSwitchConfig {
  host: string;
  port: number;
  password: string;
  context: string;
}

export interface OpenSipsConfig {
  host: string;
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
}

export interface FusionPBXConfig {
  host: string;
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
}

export class VoipService {
  private freeSwitchConfig: FreeSwitchConfig;
  private openSipsConfig: OpenSipsConfig;
  private fusionPBXConfig: FusionPBXConfig;
  private pool: Pool;

  constructor(
    freeSwitchConfig: FreeSwitchConfig,
    openSipsConfig: OpenSipsConfig,
    fusionPBXConfig: FusionPBXConfig
  ) {
    this.freeSwitchConfig = freeSwitchConfig;
    this.openSipsConfig = openSipsConfig;
    this.fusionPBXConfig = fusionPBXConfig;
    
    // Initialize PostgreSQL connection pool
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  // ===== INBOUND ROUTES =====
  async getInboundRoutes(tenantId: string): Promise<InboundRoute[]> {
    // In production, this would query the database
    // For now, return mock data
    return [
      {
        id: 'route-1',
        tenant_id: tenantId,
        name: 'Main DID Route',
        description: 'Route for main DID number',
        did_number: '+1234567890',
        destination_type: 'extension',
        destination_value: '1001',
        enabled: true,
        caller_id_override: false
      }
    ];
  }

  async getInboundRouteById(routeId: string): Promise<InboundRoute | null> {
    // In production, this would query the database
    return null;
  }

  async createInboundRoute(tenantContext: TenantContext, route: Partial<InboundRoute>): Promise<InboundRoute> {
    // Auto-populate tenant context fields
    const fullRoute: InboundRoute = {
      ...route,
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id
    } as InboundRoute;

    // 1. Create FreeSWITCH dialplan extension
    const dialplanExtension = this.generateInboundDialplan(fullRoute);
    await this.createFreeSwitchDialplan(dialplanExtension);

    // 2. Create FusionPBX inbound route record
    await this.createFusionPBXInboundRoute(fullRoute);

    // 3. If time condition exists, link it
    if (fullRoute.time_condition_id) {
      await this.linkTimeCondition(fullRoute.id!, fullRoute.time_condition_id);
    }

    return fullRoute;
  }

  async updateInboundRoute(routeId: string, route: Partial<InboundRoute>): Promise<InboundRoute> {
    // 1. Update FreeSWITCH dialplan
    const dialplanExtension = this.generateInboundDialplan(route as InboundRoute);
    await this.updateFreeSwitchDialplan(routeId, dialplanExtension);

    // 2. Update FusionPBX record
    await this.updateFusionPBXInboundRoute(routeId, route);

    return route as InboundRoute;
  }

  async deleteInboundRoute(routeId: string): Promise<void> {
    // 1. Delete FreeSWITCH dialplan
    await this.deleteFreeSwitchDialplan(routeId);

    // 2. Delete FusionPBX record
    await this.deleteFusionPBXInboundRoute(routeId);
  }

  // ===== OUTBOUND ROUTES =====
  async getOutboundRoutes(tenantId: string): Promise<OutboundRoute[]> {
    // In production, this would query the database
    return [
      {
        id: 'outbound-1',
        tenant_id: tenantId,
        name: 'Local Calls',
        description: 'Route for local calls',
        dial_pattern: '^\\+1[0-9]{10}$',
        trunk_id: 'trunk-1',
        enabled: true,
        strip_digits: 0,
        prefix: ''
      }
    ];
  }

  async getOutboundRouteById(routeId: string): Promise<OutboundRoute | null> {
    return null;
  }

  async createOutboundRoute(tenantContext: TenantContext, route: Partial<OutboundRoute>): Promise<OutboundRoute> {
    // Auto-populate tenant context fields
    const fullRoute: OutboundRoute = {
      ...route,
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id
    } as OutboundRoute;

    // 1. Create FreeSWITCH dialplan extension for outbound routing
    const dialplanExtension = this.generateOutboundDialplan(fullRoute);
    await this.createFreeSwitchDialplan(dialplanExtension);

    // 2. Create FusionPBX outbound route record
    await this.createFusionPBXOutboundRoute(fullRoute);

    return fullRoute;
  }

  async updateOutboundRoute(routeId: string, route: Partial<OutboundRoute>): Promise<OutboundRoute> {
    // 1. Update FreeSWITCH dialplan
    const dialplanExtension = this.generateOutboundDialplan(route as OutboundRoute);
    await this.updateFreeSwitchDialplan(routeId, dialplanExtension);

    // 2. Update FusionPBX record
    await this.updateFusionPBXOutboundRoute(routeId, route);

    return route as OutboundRoute;
  }

  async deleteOutboundRoute(routeId: string): Promise<void> {
    // 1. Delete FreeSWITCH dialplan
    await this.deleteFreeSwitchDialplan(routeId);

    // 2. Delete FusionPBX record
    await this.deleteFusionPBXOutboundRoute(routeId);
  }

  // ===== TIME CONDITIONS =====
  async getTimeConditions(tenantId: string): Promise<TimeCondition[]> {
    return [
      {
        id: 'time-1',
        tenant_id: tenantId,
        name: 'Business Hours',
        description: 'Monday to Friday 9AM-5PM',
        timezone: 'UTC',
        business_hours: {
          monday: { enabled: true, start_time: '09:00', end_time: '17:00' },
          tuesday: { enabled: true, start_time: '09:00', end_time: '17:00' },
          wednesday: { enabled: true, start_time: '09:00', end_time: '17:00' },
          thursday: { enabled: true, start_time: '09:00', end_time: '17:00' },
          friday: { enabled: true, start_time: '09:00', end_time: '17:00' },
          saturday: { enabled: false, start_time: '00:00', end_time: '00:00' },
          sunday: { enabled: false, start_time: '00:00', end_time: '00:00' }
        },
        holidays: []
      }
    ];
  }

  async getTimeConditionById(conditionId: string): Promise<TimeCondition | null> {
    return null;
  }

  async createTimeCondition(tenantContext: TenantContext, condition: Partial<TimeCondition>): Promise<TimeCondition> {
    // Auto-populate tenant context fields
    const fullCondition: TimeCondition = {
      ...condition,
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id
    } as TimeCondition;

    // 1. Create FreeSWITCH time condition
    const timeCondition = this.generateTimeCondition(fullCondition);
    await this.createFreeSwitchTimeCondition(timeCondition);

    // 2. Create FusionPBX time condition record
    await this.createFusionPBXTimeCondition(fullCondition);

    return fullCondition;
  }

  async updateTimeCondition(conditionId: string, condition: Partial<TimeCondition>): Promise<TimeCondition> {
    // 1. Update FreeSWITCH time condition
    const timeCondition = this.generateTimeCondition(condition as TimeCondition);
    await this.updateFreeSwitchTimeCondition(conditionId, timeCondition);

    // 2. Update FusionPBX record
    await this.updateFusionPBXTimeCondition(conditionId, condition);

    return condition as TimeCondition;
  }

  async deleteTimeCondition(conditionId: string): Promise<void> {
    // 1. Delete FreeSWITCH time condition
    await this.deleteFreeSwitchTimeCondition(conditionId);

    // 2. Delete FusionPBX record
    await this.deleteFusionPBXTimeCondition(conditionId);
  }

  // ===== IVR MENUS =====
  async getIvrMenus(tenantId: string): Promise<IvrMenu[]> {
    return [
      {
        id: 'ivr-1',
        tenant_id: tenantId,
        name: 'Main Menu',
        description: 'Main IVR menu',
        greeting_message: 'Welcome to our company',
        timeout_seconds: 10,
        max_failures: 3,
        options: [
          { digit: '1', action: 'extension', value: '1001', description: 'Sales' },
          { digit: '2', action: 'extension', value: '1002', description: 'Support' },
          { digit: '0', action: 'extension', value: '1000', description: 'Operator' }
        ]
      }
    ];
  }

  async getIvrMenuById(menuId: string): Promise<IvrMenu | null> {
    return null;
  }

  async createIvrMenu(tenantContext: TenantContext, menu: Partial<IvrMenu>): Promise<IvrMenu> {
    // Auto-populate tenant context fields
    const fullMenu: IvrMenu = {
      ...menu,
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id
    } as IvrMenu;

    // 1. Create FreeSWITCH IVR application
    const ivrApplication = this.generateIvrApplication(fullMenu);
    await this.createFreeSwitchIvrApplication(ivrApplication);

    // 2. Create FusionPBX IVR menu record
    await this.createFusionPBXIvrMenu(fullMenu);

    // 3. Create dialplan extension for IVR
    const dialplanExtension = this.generateIvrDialplan(fullMenu);
    await this.createFreeSwitchDialplan(dialplanExtension);

    return fullMenu;
  }

  async updateIvrMenu(menuId: string, menu: Partial<IvrMenu>): Promise<IvrMenu> {
    // 1. Update FreeSWITCH IVR application
    const ivrApplication = this.generateIvrApplication(menu as IvrMenu);
    await this.updateFreeSwitchIvrApplication(menuId, ivrApplication);

    // 2. Update FusionPBX record
    await this.updateFusionPBXIvrMenu(menuId, menu);

    // 3. Update dialplan extension
    const dialplanExtension = this.generateIvrDialplan(menu as IvrMenu);
    await this.updateFreeSwitchDialplan(menuId, dialplanExtension);

    return menu as IvrMenu;
  }

  async deleteIvrMenu(menuId: string): Promise<void> {
    // 1. Delete FreeSWITCH IVR application
    await this.deleteFreeSwitchIvrApplication(menuId);

    // 2. Delete FusionPBX record
    await this.deleteFusionPBXIvrMenu(menuId);

    // 3. Delete dialplan extension
    await this.deleteFreeSwitchDialplan(menuId);
  }

  // ===== RING GROUPS =====
  async getRingGroups(tenantId: string): Promise<RingGroup[]> {
    return [
      {
        id: 'ring-1',
        tenant_id: tenantId,
        name: 'Sales Team',
        description: 'Sales team ring group',
        extension_number: '2001',
        strategy: 'simultaneous',
        timeout: 30,
        max_calls: 10,
        members: [
          { extension: '1001', priority: 1, enabled: true },
          { extension: '1002', priority: 2, enabled: true }
        ]
      }
    ];
  }

  async getRingGroupById(groupId: string): Promise<RingGroup | null> {
    return null;
  }

  async createRingGroup(tenantContext: TenantContext, group: Partial<RingGroup>): Promise<RingGroup> {
    // Auto-populate tenant context fields
    const fullGroup: RingGroup = {
      ...group,
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id
    } as RingGroup;

    // 1. Create FreeSWITCH ring group application
    const ringGroupApplication = this.generateRingGroupApplication(fullGroup);
    await this.createFreeSwitchRingGroupApplication(ringGroupApplication);

    // 2. Create FusionPBX ring group record
    await this.createFusionPBXRingGroup(fullGroup);

    // 3. Create dialplan extension for ring group
    const dialplanExtension = this.generateRingGroupDialplan(fullGroup);
    await this.createFreeSwitchDialplan(dialplanExtension);

    return fullGroup;
  }

  async updateRingGroup(groupId: string, group: Partial<RingGroup>): Promise<RingGroup> {
    // 1. Update FreeSWITCH ring group application
    const ringGroupApplication = this.generateRingGroupApplication(group as RingGroup);
    await this.updateFreeSwitchRingGroupApplication(groupId, ringGroupApplication);

    // 2. Update FusionPBX record
    await this.updateFusionPBXRingGroup(groupId, group);

    // 3. Update dialplan extension
    const dialplanExtension = this.generateRingGroupDialplan(group as RingGroup);
    await this.updateFreeSwitchDialplan(groupId, dialplanExtension);

    return group as RingGroup;
  }

  async deleteRingGroup(groupId: string): Promise<void> {
    // 1. Delete FreeSWITCH ring group application
    await this.deleteFreeSwitchRingGroupApplication(groupId);

    // 2. Delete FusionPBX record
    await this.deleteFusionPBXRingGroup(groupId);

    // 3. Delete dialplan extension
    await this.deleteFreeSwitchDialplan(groupId);
  }

  // ===== QUEUES =====
  async getQueues(tenantId: string): Promise<Queue[]> {
    return [
      {
        id: 'queue-1',
        tenant_id: tenantId,
        name: 'Support Queue',
        description: 'Customer support queue',
        extension_number: '3001',
        strategy: 'fifo',
        timeout: 30,
        max_calls: 100,
        agents: [
          { extension: '1001', penalty: 1, enabled: true },
          { extension: '1002', penalty: 2, enabled: true }
        ]
      }
    ];
  }

  async getQueueById(queueId: string): Promise<Queue | null> {
    return null;
  }

  async createQueue(tenantContext: TenantContext, queue: Partial<Queue>): Promise<Queue> {
    // Auto-populate tenant context fields
    const fullQueue: Queue = {
      ...queue,
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id
    } as Queue;

    // 1. Create FreeSWITCH queue application
    const queueApplication = this.generateQueueApplication(fullQueue);
    await this.createFreeSwitchQueueApplication(queueApplication);

    // 2. Create FusionPBX queue record
    await this.createFusionPBXQueue(fullQueue);

    // 3. Create dialplan extension for queue
    const dialplanExtension = this.generateQueueDialplan(fullQueue);
    await this.createFreeSwitchDialplan(dialplanExtension);

    return fullQueue;
  }

  async updateQueue(queueId: string, queue: Partial<Queue>): Promise<Queue> {
    // 1. Update FreeSWITCH queue application
    const queueApplication = this.generateQueueApplication(queue as Queue);
    await this.updateFreeSwitchQueueApplication(queueId, queueApplication);

    // 2. Update FusionPBX record
    await this.updateFusionPBXQueue(queueId, queue);

    // 3. Update dialplan extension
    const dialplanExtension = this.generateQueueDialplan(queue as Queue);
    await this.updateFreeSwitchDialplan(queueId, dialplanExtension);

    return queue as Queue;
  }

  async deleteQueue(queueId: string): Promise<void> {
    // 1. Delete FreeSWITCH queue application
    await this.deleteFreeSwitchQueueApplication(queueId);

    // 2. Delete FusionPBX record
    await this.deleteFusionPBXQueue(queueId);

    // 3. Delete dialplan extension
    await this.deleteFreeSwitchDialplan(queueId);
  }

  // ===== CONFERENCE ROOMS =====
  async getConferenceRooms(tenantId: string): Promise<ConferenceRoom[]> {
    return [
      {
        id: 'conf-1',
        tenant_id: tenantId,
        name: 'Meeting Room 1',
        description: 'Main meeting room',
        extension_number: '4001',
        max_members: 10,
        record_conference: false,
        pin: '1234',
        moderator_pin: '5678'
      }
    ];
  }

  async getConferenceRoomById(roomId: string): Promise<ConferenceRoom | null> {
    return null;
  }

  async createConferenceRoom(tenantContext: TenantContext, room: Partial<ConferenceRoom>): Promise<ConferenceRoom> {
    // Auto-populate tenant context fields
    const fullRoom: ConferenceRoom = {
      ...room,
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id
    } as ConferenceRoom;

    // 1. Create FreeSWITCH conference room
    const conferenceRoom = this.generateConferenceRoom(fullRoom);
    await this.createFreeSwitchConferenceRoom(conferenceRoom);

    // 2. Create FusionPBX conference room record
    await this.createFusionPBXConferenceRoom(fullRoom);

    // 3. Create dialplan extension for conference
    const dialplanExtension = this.generateConferenceDialplan(fullRoom);
    await this.createFreeSwitchDialplan(dialplanExtension);

    return fullRoom;
  }

  async updateConferenceRoom(roomId: string, room: Partial<ConferenceRoom>): Promise<ConferenceRoom> {
    // 1. Update FreeSWITCH conference room
    const conferenceRoom = this.generateConferenceRoom(room as ConferenceRoom);
    await this.updateFreeSwitchConferenceRoom(roomId, conferenceRoom);

    // 2. Update FusionPBX record
    await this.updateFusionPBXConferenceRoom(roomId, room);

    // 3. Update dialplan extension
    const dialplanExtension = this.generateConferenceDialplan(room as ConferenceRoom);
    await this.updateFreeSwitchDialplan(roomId, dialplanExtension);

    return room as ConferenceRoom;
  }

  async deleteConferenceRoom(roomId: string): Promise<void> {
    // 1. Delete FreeSWITCH conference room
    await this.deleteFreeSwitchConferenceRoom(roomId);

    // 2. Delete FusionPBX record
    await this.deleteFusionPBXConferenceRoom(roomId);

    // 3. Delete dialplan extension
    await this.deleteFreeSwitchDialplan(roomId);
  }

  // ===== VOICEMAIL BOXES =====
  async getVoicemailBoxes(tenantId: string): Promise<VoicemailBox[]> {
    return [
      {
        id: 'vm-1',
        tenant_id: tenantId,
        extension_number: '1001',
        password: '1234',
        display_name: 'John Doe',
        email_address: 'john@example.com',
        max_messages: 100,
        max_message_length: 300,
        email_notifications: true
      }
    ];
  }

  async getVoicemailBoxById(boxId: string): Promise<VoicemailBox | null> {
    return null;
  }

  async createVoicemailBox(tenantContext: TenantContext, box: Partial<VoicemailBox>): Promise<VoicemailBox> {
    // Auto-populate tenant context fields
    const fullBox: VoicemailBox = {
      ...box,
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id
    } as VoicemailBox;

    // 1. Create FreeSWITCH voicemail box
    const voicemailBox = this.generateVoicemailBox(fullBox);
    await this.createFreeSwitchVoicemailBox(voicemailBox);

    // 2. Create FusionPBX voicemail box record
    await this.createFusionPBXVoicemailBox(fullBox);

    return fullBox;
  }

  async updateVoicemailBox(boxId: string, box: Partial<VoicemailBox>): Promise<VoicemailBox> {
    // 1. Update FreeSWITCH voicemail box
    const voicemailBox = this.generateVoicemailBox(box as VoicemailBox);
    await this.updateFreeSwitchVoicemailBox(boxId, voicemailBox);

    // 2. Update FusionPBX record
    await this.updateFusionPBXVoicemailBox(boxId, box);

    return box as VoicemailBox;
  }

  async deleteVoicemailBox(boxId: string): Promise<void> {
    // 1. Delete FreeSWITCH voicemail box
    await this.deleteFreeSwitchVoicemailBox(boxId);

    // 2. Delete FusionPBX record
    await this.deleteFusionPBXVoicemailBox(boxId);
  }

  // ===== SIP EXTENSIONS =====
  async getSipExtensions(tenantId: string): Promise<SipExtensionConfig[]> {
    return [
      {
        extension: '1001',
        password: 'secure123',
        display_name: 'John Doe',
        tenant_id: tenantId,
        realm: 'demo-tenant.edgvoip.local',
        sip_settings: {
          context: 'default',
          host: 'dynamic',
          type: 'friend',
          nat: 'force_rport',
          qualify: true,
          qualify_freq: 60,
          canreinvite: false,
          dtmfmode: 'rfc2833',
          disallow: ['all'],
          allow: ['ulaw', 'alaw', 'g729', 'g722'],
          directmedia: false,
          trustrpid: false,
          sendrpid: false,
          musicclass: 'default',
          mohsuggest: 'default',
          hasvoicemail: true,
          mailbox: '1001',
          callingpres: 'allowed_not_screened',
          restrictcid: false
        },
        features: {
          call_forwarding: false,
          call_waiting: true,
          three_way_calling: true,
          call_parking: false,
          do_not_disturb: false
        },
        security: {
          allow_guest: false,
          allow_anonymous: false,
          max_calls: 5,
          call_timeout: 300
        }
      }
    ];
  }

  async getSipExtensionById(extensionId: string): Promise<SipExtensionConfig | null> {
    return null;
  }

  async createSipExtension(tenantContext: TenantContext, extension: Partial<SipExtensionConfig>): Promise<SipExtensionConfig> {
    // Auto-populate tenant context fields
    const fullExtension: SipExtensionConfig = {
      ...extension,
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id,
      realm: tenantContext.sip_domain
    } as SipExtensionConfig;

    // 1. Create FreeSWITCH SIP extension
    const sipExtension = this.generateSipExtension(fullExtension);
    await this.createFreeSwitchSipExtension(sipExtension);

    // 2. Create FusionPBX extension record
    await this.createFusionPBXExtension(fullExtension);

    return fullExtension;
  }

  async updateSipExtension(extensionId: string, extension: Partial<SipExtensionConfig>): Promise<SipExtensionConfig> {
    // 1. Update FreeSWITCH SIP extension
    const sipExtension = this.generateSipExtension(extension as SipExtensionConfig);
    await this.updateFreeSwitchSipExtension(extensionId, sipExtension);

    // 2. Update FusionPBX record
    await this.updateFusionPBXExtension(extensionId, extension);

    return extension as SipExtensionConfig;
  }

  async deleteSipExtension(extensionId: string): Promise<void> {
    // 1. Delete FreeSWITCH SIP extension
    await this.deleteFreeSwitchSipExtension(extensionId);

    // 2. Delete FusionPBX record
    await this.deleteFusionPBXExtension(extensionId);
  }

  // ===== SIP TRUNKS =====
  async getSipTrunks(tenantId: string): Promise<SipTrunkConfig[]> {
    try {
      const result = await this.pool.query(
        `SELECT 
          id,
          name,
          provider,
          status,
          sip_config,
          did_config,
          security,
          gdpr,
          created_at,
          updated_at
        FROM sip_trunks 
        WHERE tenant_id = $1
        ORDER BY created_at DESC`,
        [tenantId]
      );

      // Map database rows to SipTrunkConfig format
      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        provider: row.provider,
        status: row.status,
        host: row.sip_config?.host || '',
        port: row.sip_config?.port || 5060,
        username: row.sip_config?.username || '',
        password: row.sip_config?.password || '',
        from_user: row.sip_config?.from_user || '',
        from_domain: row.sip_config?.from_domain || '',
        tenant_id: tenantId,
        sip_config: row.sip_config,
        did_config: row.did_config,
        registration: row.sip_config?.registration || {
          enabled: false,
          status: 'unregistered'
        },
        sip_settings: {
          type: row.sip_config?.type || 'peer',
          context: row.sip_config?.context || 'from-trunk',
          nat: 'force_rport',
          qualify: row.sip_config?.qualify !== false,
          qualify_freq: 60,
          canreinvite: false,
          dtmfmode: row.sip_config?.dtmf_mode || 'rfc2833',
          disallow: ['all'],
          allow: ['ulaw', 'alaw', 'g729', 'g722'],
          directmedia: false,
          trustrpid: false,
          sendrpid: false
        },
        advanced: {
          max_calls: 100,
          call_timeout: 300,
          codec_preference: ['ulaw', 'alaw', 'g729'],
          failover_trunk: null
        }
      }));
    } catch (error) {
      console.error('Error fetching SIP trunks from database:', error);
      return [];
    }
  }

  async getSipTrunkById(trunkId: string): Promise<SipTrunkConfig | null> {
    return null;
  }

  async createSipTrunk(tenantContext: TenantContext, trunk: Partial<SipTrunkConfig>): Promise<SipTrunkConfig> {
    // Auto-populate tenant context fields
    const fullTrunk: SipTrunkConfig = {
      ...trunk,
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id,
      from_domain: tenantContext.sip_domain
    } as SipTrunkConfig;

    // 1. Create FreeSWITCH SIP trunk
    const sipTrunk = this.generateSipTrunk(fullTrunk);
    await this.createFreeSwitchSipTrunk(sipTrunk);

    // 2. Create FusionPBX trunk record
    await this.createFusionPBXTrunk(fullTrunk);

    return fullTrunk;
  }

  async updateSipTrunk(trunkId: string, trunk: Partial<SipTrunkConfig>): Promise<SipTrunkConfig> {
    // 1. Update FreeSWITCH SIP trunk
    const sipTrunk = this.generateSipTrunk(trunk as SipTrunkConfig);
    await this.updateFreeSwitchSipTrunk(trunkId, sipTrunk);

    // 2. Update FusionPBX record
    await this.updateFusionPBXTrunk(trunkId, trunk);

    return trunk as SipTrunkConfig;
  }

  async deleteSipTrunk(trunkId: string): Promise<void> {
    // 1. Delete FreeSWITCH SIP trunk
    await this.deleteFreeSwitchSipTrunk(trunkId);

    // 2. Delete FusionPBX record
    await this.deleteFusionPBXTrunk(trunkId);
  }

  // ===== OPENSIPS ROUTES =====
  async createOpenSipsRoute(route: OpenSipsRoute): Promise<OpenSipsRoute> {
    // 1. Create OpenSIPS routing rule
    const openSipsRule = this.generateOpenSipsRule(route);
    await this.createOpenSipsRule(openSipsRule);

    // 2. Create database record
    await this.createOpenSipsRouteRecord(route);

    return route;
  }

  async updateOpenSipsRoute(routeId: string, route: Partial<OpenSipsRoute>): Promise<OpenSipsRoute> {
    // 1. Update OpenSIPS routing rule
    const openSipsRule = this.generateOpenSipsRule(route as OpenSipsRoute);
    await this.updateOpenSipsRule(routeId, openSipsRule);

    // 2. Update database record
    await this.updateOpenSipsRouteRecord(routeId, route);

    return route as OpenSipsRoute;
  }

  async deleteOpenSipsRoute(routeId: string): Promise<void> {
    // 1. Delete OpenSIPS routing rule
    await this.deleteOpenSipsRule(routeId);

    // 2. Delete database record
    await this.deleteOpenSipsRouteRecord(routeId);
  }

  // ===== GENERATORS =====
  private generateInboundDialplan(route: InboundRoute): any {
    const context = 'from-trunk';
    const extension = route.did_number;
    
    let condition = `destination_number = ${extension}`;
    if (route.caller_id_number) {
      condition += ` & caller_id_number = ${route.caller_id_number}`;
    }

    let action = '';
    switch (route.destination_type) {
      case 'extension':
        action = `bridge(user/${route.destination_value}@\${domain_name})`;
        break;
      case 'ring_group':
        action = `bridge(loopback/${route.destination_value}@\${domain_name})`;
        break;
      case 'queue':
        action = `bridge(loopback/${route.destination_value}@\${domain_name})`;
        break;
      case 'ivr':
        action = `bridge(loopback/${route.destination_value}@\${domain_name})`;
        break;
      case 'conference':
        action = `conference(${route.destination_value}@default)`;
        break;
      case 'voicemail':
        action = `voicemail(${route.destination_value}@\${domain_name})`;
        break;
      case 'external':
        action = `bridge(sofia/gateway/${route.destination_value}/\${destination_number})`;
        break;
    }

    if (route.record_calls) {
      action += ` & record_session(\${recordings_dir}/\${uuid}.wav)`;
    }

    return {
      context,
      extension,
      condition,
      action,
      anti_action: '',
      enabled: route.enabled
    };
  }

  private generateOutboundDialplan(route: OutboundRoute): any {
    const context = 'from-internal';
    const extension = route.dial_pattern;
    
    const condition = `destination_number = ${extension}`;
    
    let action = `bridge(sofia/gateway/${route.trunk_id}/\${destination_number})`;
    
    if (route.prefix) {
      action = `bridge(sofia/gateway/${route.trunk_id}/${route.prefix}\${destination_number})`;
    }
    
    if (route.strip_digits > 0) {
      action = `set(destination_number=\${destination_number:${route.strip_digits}}) & ${action}`;
    }

    if (route.record_calls) {
      action += ` & record_session(\${recordings_dir}/\${uuid}.wav)`;
    }

    return {
      context,
      extension,
      condition,
      action,
      anti_action: '',
      enabled: route.enabled
    };
  }

  private generateTimeCondition(condition: TimeCondition): any {
    const timeCondition = {
      name: condition.name,
      timezone: condition.timezone,
      business_hours: condition.business_hours,
      holidays: condition.holidays,
      business_hours_action: condition.business_hours_action,
      after_hours_action: condition.after_hours_action,
      holiday_action: condition.holiday_action,
      enabled: condition.enabled
    };

    return timeCondition;
  }

  private generateIvrApplication(menu: IvrMenu): any {
    const ivrApplication = {
      name: menu.name,
      greeting_message: menu.greeting_message,
      invalid_message: menu.invalid_message,
      timeout_message: menu.timeout_message,
      timeout_seconds: menu.timeout_seconds,
      max_failures: menu.max_failures,
      options: menu.options,
      default_action: menu.default_action,
      default_destination: menu.default_destination,
      enabled: menu.enabled
    };

    return ivrApplication;
  }

  private generateIvrDialplan(menu: IvrMenu): any {
    const context = 'from-internal';
    const extension = menu.name;
    
    const condition = `destination_number = ${extension}`;
    const action = `ivr(${menu.name})`;

    return {
      context,
      extension,
      condition,
      action,
      anti_action: '',
      enabled: menu.enabled
    };
  }

  private generateRingGroupApplication(group: RingGroup): any {
    const ringGroupApplication = {
      name: group.name,
      extension_number: group.extension_number,
      strategy: group.strategy,
      timeout: group.timeout,
      max_calls: group.max_calls,
      members: group.members,
      enabled: group.enabled
    };

    return ringGroupApplication;
  }

  private generateRingGroupDialplan(group: RingGroup): any {
    const context = 'from-internal';
    const extension = group.extension_number;
    
    const condition = `destination_number = ${extension}`;
    
    let action = '';
    switch (group.strategy) {
      case 'simultaneous':
        action = `bridge(loopback/${group.extension_number}@\${domain_name})`;
        break;
      case 'sequential':
        action = `bridge(loopback/${group.extension_number}@\${domain_name})`;
        break;
      case 'sequential':
        action = `bridge(loopback/${group.extension_number}@\${domain_name})`;
        break;
      default:
        action = `bridge(loopback/${group.extension_number}@\${domain_name})`;
    }

    return {
      context,
      extension,
      condition,
      action,
      anti_action: '',
      enabled: group.enabled
    };
  }

  private generateQueueApplication(queue: Queue): any {
    const queueApplication = {
      name: queue.name,
      extension_number: queue.extension_number,
      strategy: queue.strategy,
      timeout: queue.timeout,
      max_calls: queue.max_calls,
      hold_music: queue.hold_music,
      announce_frequency: queue.announce_frequency,
      announce_position: queue.announce_position,
      announce_hold_time: queue.announce_hold_time,
      agents: queue.agents,
      enabled: queue.enabled
    };

    return queueApplication;
  }

  private generateQueueDialplan(queue: Queue): any {
    const context = 'from-internal';
    const extension = queue.extension_number;
    
    const condition = `destination_number = ${extension}`;
    const action = `queue(${queue.name})`;

    return {
      context,
      extension,
      condition,
      action,
      anti_action: '',
      enabled: queue.enabled
    };
  }

  private generateConferenceRoom(room: ConferenceRoom): any {
    const conferenceRoom = {
      name: room.name,
      extension_number: room.extension_number,
      pin: room.pin,
      moderator_pin: room.moderator_pin,
      max_members: room.max_members,
      record_conference: room.record_conference,
      mute_on_join: room.mute_on_join,
      announce_join_leave: room.announce_join_leave,
      hold_music: room.hold_music,
      enabled: room.enabled
    };

    return conferenceRoom;
  }

  private generateConferenceDialplan(room: ConferenceRoom): any {
    const context = 'from-internal';
    const extension = room.extension_number;
    
    const condition = `destination_number = ${extension}`;
    const action = `conference(${room.extension_number}@default)`;

    return {
      context,
      extension,
      condition,
      action,
      anti_action: '',
      enabled: room.enabled
    };
  }

  private generateVoicemailBox(box: VoicemailBox): any {
    const voicemailBox = {
      extension_number: box.extension_number,
      password: box.password,
      display_name: box.display_name,
      email_address: box.email_address,
      max_messages: box.max_messages,
      max_message_length: box.max_message_length,
      delete_after_email: box.delete_after_email,
      attach_audio: box.attach_audio,
      email_notification: box.email_notification,
      greeting_type: box.greeting_type,
      custom_greeting_path: box.custom_greeting_path,
      enabled: box.enabled
    };

    return voicemailBox;
  }

  private generateSipExtension(extension: SipExtensionConfig): any {
    const sipExtension = {
      extension: extension.extension,
      password: extension.password,
      display_name: extension.display_name,
      sip_settings: extension.sip_settings,
      call_features: extension.call_features,
      security: extension.security,
      advanced: extension.advanced
    };

    return sipExtension;
  }

  private generateSipTrunk(trunk: SipTrunkConfig): any {
    const sipTrunk = {
      name: trunk.name,
      host: trunk.host,
      port: trunk.port,
      username: trunk.username,
      password: trunk.password,
      from_user: trunk.from_user,
      from_domain: trunk.from_domain,
      sip_settings: trunk.sip_settings,
      registration: trunk.registration,
      security: trunk.security,
      advanced: trunk.advanced
    };

    return sipTrunk;
  }

  private generateOpenSipsRule(route: OpenSipsRoute): any {
    const openSipsRule = {
      name: route.name,
      priority: route.priority,
      conditions: route.conditions,
      actions: route.actions,
      enabled: route.enabled
    };

    return openSipsRule;
  }

  // ===== FREESWITCH API CALLS =====
  private async createFreeSwitchDialplan(extension: any): Promise<void> {
    // Implementation for FreeSWITCH ESL API
    console.log('Creating FreeSWITCH dialplan:', extension);
  }

  private async updateFreeSwitchDialplan(extensionId: string, extension: any): Promise<void> {
    console.log('Updating FreeSWITCH dialplan:', extensionId, extension);
  }

  private async deleteFreeSwitchDialplan(extensionId: string): Promise<void> {
    console.log('Deleting FreeSWITCH dialplan:', extensionId);
  }

  private async createFreeSwitchTimeCondition(condition: any): Promise<void> {
    console.log('Creating FreeSWITCH time condition:', condition);
  }

  private async updateFreeSwitchTimeCondition(conditionId: string, condition: any): Promise<void> {
    console.log('Updating FreeSWITCH time condition:', conditionId, condition);
  }

  private async deleteFreeSwitchTimeCondition(conditionId: string): Promise<void> {
    console.log('Deleting FreeSWITCH time condition:', conditionId);
  }

  private async createFreeSwitchIvrApplication(application: any): Promise<void> {
    console.log('Creating FreeSWITCH IVR application:', application);
  }

  private async updateFreeSwitchIvrApplication(applicationId: string, application: any): Promise<void> {
    console.log('Updating FreeSWITCH IVR application:', applicationId, application);
  }

  private async deleteFreeSwitchIvrApplication(applicationId: string): Promise<void> {
    console.log('Deleting FreeSWITCH IVR application:', applicationId);
  }

  private async createFreeSwitchRingGroupApplication(application: any): Promise<void> {
    console.log('Creating FreeSWITCH ring group application:', application);
  }

  private async updateFreeSwitchRingGroupApplication(applicationId: string, application: any): Promise<void> {
    console.log('Updating FreeSWITCH ring group application:', applicationId, application);
  }

  private async deleteFreeSwitchRingGroupApplication(applicationId: string): Promise<void> {
    console.log('Deleting FreeSWITCH ring group application:', applicationId);
  }

  private async createFreeSwitchQueueApplication(application: any): Promise<void> {
    console.log('Creating FreeSWITCH queue application:', application);
  }

  private async updateFreeSwitchQueueApplication(applicationId: string, application: any): Promise<void> {
    console.log('Updating FreeSWITCH queue application:', applicationId, application);
  }

  private async deleteFreeSwitchQueueApplication(applicationId: string): Promise<void> {
    console.log('Deleting FreeSWITCH queue application:', applicationId);
  }

  private async createFreeSwitchConferenceRoom(room: any): Promise<void> {
    console.log('Creating FreeSWITCH conference room:', room);
  }

  private async updateFreeSwitchConferenceRoom(roomId: string, room: any): Promise<void> {
    console.log('Updating FreeSWITCH conference room:', roomId, room);
  }

  private async deleteFreeSwitchConferenceRoom(roomId: string): Promise<void> {
    console.log('Deleting FreeSWITCH conference room:', roomId);
  }

  private async createFreeSwitchVoicemailBox(box: any): Promise<void> {
    console.log('Creating FreeSWITCH voicemail box:', box);
  }

  private async updateFreeSwitchVoicemailBox(boxId: string, box: any): Promise<void> {
    console.log('Updating FreeSWITCH voicemail box:', boxId, box);
  }

  private async deleteFreeSwitchVoicemailBox(boxId: string): Promise<void> {
    console.log('Deleting FreeSWITCH voicemail box:', boxId);
  }

  private async createFreeSwitchSipExtension(extension: any): Promise<void> {
    console.log('Creating FreeSWITCH SIP extension:', extension);
  }

  private async updateFreeSwitchSipExtension(extensionId: string, extension: any): Promise<void> {
    console.log('Updating FreeSWITCH SIP extension:', extensionId, extension);
  }

  private async deleteFreeSwitchSipExtension(extensionId: string): Promise<void> {
    console.log('Deleting FreeSWITCH SIP extension:', extensionId);
  }

  private async createFreeSwitchSipTrunk(trunk: any): Promise<void> {
    console.log('Creating FreeSWITCH SIP trunk:', trunk);
  }

  private async updateFreeSwitchSipTrunk(trunkId: string, trunk: any): Promise<void> {
    console.log('Updating FreeSWITCH SIP trunk:', trunkId, trunk);
  }

  private async deleteFreeSwitchSipTrunk(trunkId: string): Promise<void> {
    console.log('Deleting FreeSWITCH SIP trunk:', trunkId);
  }

  // ===== FUSIONPBX API CALLS =====
  private async createFusionPBXInboundRoute(route: InboundRoute): Promise<void> {
    console.log('Creating FusionPBX inbound route:', route);
  }

  private async updateFusionPBXInboundRoute(routeId: string, route: Partial<InboundRoute>): Promise<void> {
    console.log('Updating FusionPBX inbound route:', routeId, route);
  }

  private async deleteFusionPBXInboundRoute(routeId: string): Promise<void> {
    console.log('Deleting FusionPBX inbound route:', routeId);
  }

  private async createFusionPBXOutboundRoute(route: OutboundRoute): Promise<void> {
    console.log('Creating FusionPBX outbound route:', route);
  }

  private async updateFusionPBXOutboundRoute(routeId: string, route: Partial<OutboundRoute>): Promise<void> {
    console.log('Updating FusionPBX outbound route:', routeId, route);
  }

  private async deleteFusionPBXOutboundRoute(routeId: string): Promise<void> {
    console.log('Deleting FusionPBX outbound route:', routeId);
  }

  private async createFusionPBXTimeCondition(condition: TimeCondition): Promise<void> {
    console.log('Creating FusionPBX time condition:', condition);
  }

  private async updateFusionPBXTimeCondition(conditionId: string, condition: Partial<TimeCondition>): Promise<void> {
    console.log('Updating FusionPBX time condition:', conditionId, condition);
  }

  private async deleteFusionPBXTimeCondition(conditionId: string): Promise<void> {
    console.log('Deleting FusionPBX time condition:', conditionId);
  }

  private async createFusionPBXIvrMenu(menu: IvrMenu): Promise<void> {
    console.log('Creating FusionPBX IVR menu:', menu);
  }

  private async updateFusionPBXIvrMenu(menuId: string, menu: Partial<IvrMenu>): Promise<void> {
    console.log('Updating FusionPBX IVR menu:', menuId, menu);
  }

  private async deleteFusionPBXIvrMenu(menuId: string): Promise<void> {
    console.log('Deleting FusionPBX IVR menu:', menuId);
  }

  private async createFusionPBXRingGroup(group: RingGroup): Promise<void> {
    console.log('Creating FusionPBX ring group:', group);
  }

  private async updateFusionPBXRingGroup(groupId: string, group: Partial<RingGroup>): Promise<void> {
    console.log('Updating FusionPBX ring group:', groupId, group);
  }

  private async deleteFusionPBXRingGroup(groupId: string): Promise<void> {
    console.log('Deleting FusionPBX ring group:', groupId);
  }

  private async createFusionPBXQueue(queue: Queue): Promise<void> {
    console.log('Creating FusionPBX queue:', queue);
  }

  private async updateFusionPBXQueue(queueId: string, queue: Partial<Queue>): Promise<void> {
    console.log('Updating FusionPBX queue:', queueId, queue);
  }

  private async deleteFusionPBXQueue(queueId: string): Promise<void> {
    console.log('Deleting FusionPBX queue:', queueId);
  }

  private async createFusionPBXConferenceRoom(room: ConferenceRoom): Promise<void> {
    console.log('Creating FusionPBX conference room:', room);
  }

  private async updateFusionPBXConferenceRoom(roomId: string, room: Partial<ConferenceRoom>): Promise<void> {
    console.log('Updating FusionPBX conference room:', roomId, room);
  }

  private async deleteFusionPBXConferenceRoom(roomId: string): Promise<void> {
    console.log('Deleting FusionPBX conference room:', roomId);
  }

  private async createFusionPBXVoicemailBox(box: VoicemailBox): Promise<void> {
    console.log('Creating FusionPBX voicemail box:', box);
  }

  private async updateFusionPBXVoicemailBox(boxId: string, box: Partial<VoicemailBox>): Promise<void> {
    console.log('Updating FusionPBX voicemail box:', boxId, box);
  }

  private async deleteFusionPBXVoicemailBox(boxId: string): Promise<void> {
    console.log('Deleting FusionPBX voicemail box:', boxId);
  }

  private async createFusionPBXExtension(extension: SipExtensionConfig): Promise<void> {
    console.log('Creating FusionPBX extension:', extension);
  }

  private async updateFusionPBXExtension(extensionId: string, extension: Partial<SipExtensionConfig>): Promise<void> {
    console.log('Updating FusionPBX extension:', extensionId, extension);
  }

  private async deleteFusionPBXExtension(extensionId: string): Promise<void> {
    console.log('Deleting FusionPBX extension:', extensionId);
  }

  private async createFusionPBXTrunk(trunk: SipTrunkConfig): Promise<void> {
    console.log('Creating FusionPBX trunk:', trunk);
  }

  private async updateFusionPBXTrunk(trunkId: string, trunk: Partial<SipTrunkConfig>): Promise<void> {
    console.log('Updating FusionPBX trunk:', trunkId, trunk);
  }

  private async deleteFusionPBXTrunk(trunkId: string): Promise<void> {
    console.log('Deleting FusionPBX trunk:', trunkId);
  }

  // ===== OPENSIPS API CALLS =====
  private async createOpenSipsRule(rule: any): Promise<void> {
    console.log('Creating OpenSIPS rule:', rule);
  }

  private async updateOpenSipsRule(ruleId: string, rule: any): Promise<void> {
    console.log('Updating OpenSIPS rule:', ruleId, rule);
  }

  private async deleteOpenSipsRule(ruleId: string): Promise<void> {
    console.log('Deleting OpenSIPS rule:', ruleId);
  }

  private async createOpenSipsRouteRecord(route: OpenSipsRoute): Promise<void> {
    console.log('Creating OpenSIPS route record:', route);
  }

  private async updateOpenSipsRouteRecord(routeId: string, route: Partial<OpenSipsRoute>): Promise<void> {
    console.log('Updating OpenSIPS route record:', routeId, route);
  }

  private async deleteOpenSipsRouteRecord(routeId: string): Promise<void> {
    console.log('Deleting OpenSIPS route record:', routeId);
  }

  // ===== UTILITY METHODS =====
  private async linkTimeCondition(routeId: string, timeConditionId: string): Promise<void> {
    console.log('Linking time condition:', routeId, timeConditionId);
  }
}
