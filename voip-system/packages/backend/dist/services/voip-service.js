"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoipService = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
class VoipService {
    constructor(freeSwitchConfig, openSipsConfig, fusionPBXConfig) {
        this.freeSwitchConfig = freeSwitchConfig;
        this.openSipsConfig = openSipsConfig;
        this.fusionPBXConfig = fusionPBXConfig;
        // Initialize PostgreSQL connection pool
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL
        });
    }
    // ===== INBOUND ROUTES =====
    async getInboundRoutes(tenantId) {
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
    async getInboundRouteById(routeId) {
        // In production, this would query the database
        return null;
    }
    async createInboundRoute(tenantContext, route) {
        // Auto-populate tenant context fields
        const fullRoute = {
            ...route,
            tenant_id: tenantContext.tenant_id,
            store_id: tenantContext.store_id
        };
        // 1. Create FreeSWITCH dialplan extension
        const dialplanExtension = this.generateInboundDialplan(fullRoute);
        await this.createFreeSwitchDialplan(dialplanExtension);
        // 2. Create FusionPBX inbound route record
        await this.createFusionPBXInboundRoute(fullRoute);
        // 3. If time condition exists, link it
        if (fullRoute.time_condition_id) {
            await this.linkTimeCondition(fullRoute.id, fullRoute.time_condition_id);
        }
        return fullRoute;
    }
    async updateInboundRoute(routeId, route) {
        // 1. Update FreeSWITCH dialplan
        const dialplanExtension = this.generateInboundDialplan(route);
        await this.updateFreeSwitchDialplan(routeId, dialplanExtension);
        // 2. Update FusionPBX record
        await this.updateFusionPBXInboundRoute(routeId, route);
        return route;
    }
    async deleteInboundRoute(routeId) {
        // 1. Delete FreeSWITCH dialplan
        await this.deleteFreeSwitchDialplan(routeId);
        // 2. Delete FusionPBX record
        await this.deleteFusionPBXInboundRoute(routeId);
    }
    // ===== OUTBOUND ROUTES =====
    async getOutboundRoutes(tenantId) {
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
    async getOutboundRouteById(routeId) {
        return null;
    }
    async createOutboundRoute(tenantContext, route) {
        // Auto-populate tenant context fields
        const fullRoute = {
            ...route,
            tenant_id: tenantContext.tenant_id,
            store_id: tenantContext.store_id
        };
        // 1. Create FreeSWITCH dialplan extension for outbound routing
        const dialplanExtension = this.generateOutboundDialplan(fullRoute);
        await this.createFreeSwitchDialplan(dialplanExtension);
        // 2. Create FusionPBX outbound route record
        await this.createFusionPBXOutboundRoute(fullRoute);
        return fullRoute;
    }
    async updateOutboundRoute(routeId, route) {
        // 1. Update FreeSWITCH dialplan
        const dialplanExtension = this.generateOutboundDialplan(route);
        await this.updateFreeSwitchDialplan(routeId, dialplanExtension);
        // 2. Update FusionPBX record
        await this.updateFusionPBXOutboundRoute(routeId, route);
        return route;
    }
    async deleteOutboundRoute(routeId) {
        // 1. Delete FreeSWITCH dialplan
        await this.deleteFreeSwitchDialplan(routeId);
        // 2. Delete FusionPBX record
        await this.deleteFusionPBXOutboundRoute(routeId);
    }
    // ===== TIME CONDITIONS =====
    async getTimeConditions(tenantId) {
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
    async getTimeConditionById(conditionId) {
        return null;
    }
    async createTimeCondition(tenantContext, condition) {
        // Auto-populate tenant context fields
        const fullCondition = {
            ...condition,
            tenant_id: tenantContext.tenant_id,
            store_id: tenantContext.store_id
        };
        // 1. Create FreeSWITCH time condition
        const timeCondition = this.generateTimeCondition(fullCondition);
        await this.createFreeSwitchTimeCondition(timeCondition);
        // 2. Create FusionPBX time condition record
        await this.createFusionPBXTimeCondition(fullCondition);
        return fullCondition;
    }
    async updateTimeCondition(conditionId, condition) {
        // 1. Update FreeSWITCH time condition
        const timeCondition = this.generateTimeCondition(condition);
        await this.updateFreeSwitchTimeCondition(conditionId, timeCondition);
        // 2. Update FusionPBX record
        await this.updateFusionPBXTimeCondition(conditionId, condition);
        return condition;
    }
    async deleteTimeCondition(conditionId) {
        // 1. Delete FreeSWITCH time condition
        await this.deleteFreeSwitchTimeCondition(conditionId);
        // 2. Delete FusionPBX record
        await this.deleteFusionPBXTimeCondition(conditionId);
    }
    // ===== IVR MENUS =====
    async getIvrMenus(tenantId) {
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
    async getIvrMenuById(menuId) {
        return null;
    }
    async createIvrMenu(tenantContext, menu) {
        // Auto-populate tenant context fields
        const fullMenu = {
            ...menu,
            tenant_id: tenantContext.tenant_id,
            store_id: tenantContext.store_id
        };
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
    async updateIvrMenu(menuId, menu) {
        // 1. Update FreeSWITCH IVR application
        const ivrApplication = this.generateIvrApplication(menu);
        await this.updateFreeSwitchIvrApplication(menuId, ivrApplication);
        // 2. Update FusionPBX record
        await this.updateFusionPBXIvrMenu(menuId, menu);
        // 3. Update dialplan extension
        const dialplanExtension = this.generateIvrDialplan(menu);
        await this.updateFreeSwitchDialplan(menuId, dialplanExtension);
        return menu;
    }
    async deleteIvrMenu(menuId) {
        // 1. Delete FreeSWITCH IVR application
        await this.deleteFreeSwitchIvrApplication(menuId);
        // 2. Delete FusionPBX record
        await this.deleteFusionPBXIvrMenu(menuId);
        // 3. Delete dialplan extension
        await this.deleteFreeSwitchDialplan(menuId);
    }
    // ===== RING GROUPS =====
    async getRingGroups(tenantId) {
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
    async getRingGroupById(groupId) {
        return null;
    }
    async createRingGroup(tenantContext, group) {
        // Auto-populate tenant context fields
        const fullGroup = {
            ...group,
            tenant_id: tenantContext.tenant_id,
            store_id: tenantContext.store_id
        };
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
    async updateRingGroup(groupId, group) {
        // 1. Update FreeSWITCH ring group application
        const ringGroupApplication = this.generateRingGroupApplication(group);
        await this.updateFreeSwitchRingGroupApplication(groupId, ringGroupApplication);
        // 2. Update FusionPBX record
        await this.updateFusionPBXRingGroup(groupId, group);
        // 3. Update dialplan extension
        const dialplanExtension = this.generateRingGroupDialplan(group);
        await this.updateFreeSwitchDialplan(groupId, dialplanExtension);
        return group;
    }
    async deleteRingGroup(groupId) {
        // 1. Delete FreeSWITCH ring group application
        await this.deleteFreeSwitchRingGroupApplication(groupId);
        // 2. Delete FusionPBX record
        await this.deleteFusionPBXRingGroup(groupId);
        // 3. Delete dialplan extension
        await this.deleteFreeSwitchDialplan(groupId);
    }
    // ===== QUEUES =====
    async getQueues(tenantId) {
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
    async getQueueById(queueId) {
        return null;
    }
    async createQueue(tenantContext, queue) {
        // Auto-populate tenant context fields
        const fullQueue = {
            ...queue,
            tenant_id: tenantContext.tenant_id,
            store_id: tenantContext.store_id
        };
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
    async updateQueue(queueId, queue) {
        // 1. Update FreeSWITCH queue application
        const queueApplication = this.generateQueueApplication(queue);
        await this.updateFreeSwitchQueueApplication(queueId, queueApplication);
        // 2. Update FusionPBX record
        await this.updateFusionPBXQueue(queueId, queue);
        // 3. Update dialplan extension
        const dialplanExtension = this.generateQueueDialplan(queue);
        await this.updateFreeSwitchDialplan(queueId, dialplanExtension);
        return queue;
    }
    async deleteQueue(queueId) {
        // 1. Delete FreeSWITCH queue application
        await this.deleteFreeSwitchQueueApplication(queueId);
        // 2. Delete FusionPBX record
        await this.deleteFusionPBXQueue(queueId);
        // 3. Delete dialplan extension
        await this.deleteFreeSwitchDialplan(queueId);
    }
    // ===== CONFERENCE ROOMS =====
    async getConferenceRooms(tenantId) {
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
    async getConferenceRoomById(roomId) {
        return null;
    }
    async createConferenceRoom(tenantContext, room) {
        // Auto-populate tenant context fields
        const fullRoom = {
            ...room,
            tenant_id: tenantContext.tenant_id,
            store_id: tenantContext.store_id
        };
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
    async updateConferenceRoom(roomId, room) {
        // 1. Update FreeSWITCH conference room
        const conferenceRoom = this.generateConferenceRoom(room);
        await this.updateFreeSwitchConferenceRoom(roomId, conferenceRoom);
        // 2. Update FusionPBX record
        await this.updateFusionPBXConferenceRoom(roomId, room);
        // 3. Update dialplan extension
        const dialplanExtension = this.generateConferenceDialplan(room);
        await this.updateFreeSwitchDialplan(roomId, dialplanExtension);
        return room;
    }
    async deleteConferenceRoom(roomId) {
        // 1. Delete FreeSWITCH conference room
        await this.deleteFreeSwitchConferenceRoom(roomId);
        // 2. Delete FusionPBX record
        await this.deleteFusionPBXConferenceRoom(roomId);
        // 3. Delete dialplan extension
        await this.deleteFreeSwitchDialplan(roomId);
    }
    // ===== VOICEMAIL BOXES =====
    async getVoicemailBoxes(tenantId) {
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
    async getVoicemailBoxById(boxId) {
        return null;
    }
    async createVoicemailBox(tenantContext, box) {
        // Auto-populate tenant context fields
        const fullBox = {
            ...box,
            tenant_id: tenantContext.tenant_id,
            store_id: tenantContext.store_id
        };
        // 1. Create FreeSWITCH voicemail box
        const voicemailBox = this.generateVoicemailBox(fullBox);
        await this.createFreeSwitchVoicemailBox(voicemailBox);
        // 2. Create FusionPBX voicemail box record
        await this.createFusionPBXVoicemailBox(fullBox);
        return fullBox;
    }
    async updateVoicemailBox(boxId, box) {
        // 1. Update FreeSWITCH voicemail box
        const voicemailBox = this.generateVoicemailBox(box);
        await this.updateFreeSwitchVoicemailBox(boxId, voicemailBox);
        // 2. Update FusionPBX record
        await this.updateFusionPBXVoicemailBox(boxId, box);
        return box;
    }
    async deleteVoicemailBox(boxId) {
        // 1. Delete FreeSWITCH voicemail box
        await this.deleteFreeSwitchVoicemailBox(boxId);
        // 2. Delete FusionPBX record
        await this.deleteFusionPBXVoicemailBox(boxId);
    }
    // ===== SIP EXTENSIONS =====
    async getSipExtensions(tenantId) {
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
    async getSipExtensionById(extensionId) {
        return null;
    }
    async createSipExtension(tenantContext, extension) {
        // Auto-populate tenant context fields
        const fullExtension = {
            ...extension,
            tenant_id: tenantContext.tenant_id,
            store_id: tenantContext.store_id,
            realm: tenantContext.sip_domain
        };
        // 1. Create FreeSWITCH SIP extension
        const sipExtension = this.generateSipExtension(fullExtension);
        await this.createFreeSwitchSipExtension(sipExtension);
        // 2. Create FusionPBX extension record
        await this.createFusionPBXExtension(fullExtension);
        return fullExtension;
    }
    async updateSipExtension(extensionId, extension) {
        // 1. Update FreeSWITCH SIP extension
        const sipExtension = this.generateSipExtension(extension);
        await this.updateFreeSwitchSipExtension(extensionId, sipExtension);
        // 2. Update FusionPBX record
        await this.updateFusionPBXExtension(extensionId, extension);
        return extension;
    }
    async deleteSipExtension(extensionId) {
        // 1. Delete FreeSWITCH SIP extension
        await this.deleteFreeSwitchSipExtension(extensionId);
        // 2. Delete FusionPBX record
        await this.deleteFusionPBXExtension(extensionId);
    }
    // ===== SIP TRUNKS =====
    async getSipTrunks(tenantId) {
        try {
            const result = await this.pool.query(`SELECT 
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
        ORDER BY created_at DESC`, [tenantId]);
            // Map database rows to SipTrunkConfig format
            return result.rows.map((row) => ({
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
        }
        catch (error) {
            console.error('Error fetching SIP trunks from database:', error);
            return [];
        }
    }
    async getSipTrunkById(trunkId) {
        return null;
    }
    async createSipTrunk(tenantContext, trunk) {
        // Auto-populate tenant context fields
        const fullTrunk = {
            ...trunk,
            tenant_id: tenantContext.tenant_id,
            store_id: tenantContext.store_id,
            from_domain: tenantContext.sip_domain
        };
        // 1. Create FreeSWITCH SIP trunk
        const sipTrunk = this.generateSipTrunk(fullTrunk);
        await this.createFreeSwitchSipTrunk(sipTrunk);
        // 2. Create FusionPBX trunk record
        await this.createFusionPBXTrunk(fullTrunk);
        return fullTrunk;
    }
    async updateSipTrunk(trunkId, trunk) {
        // 1. Update FreeSWITCH SIP trunk
        const sipTrunk = this.generateSipTrunk(trunk);
        await this.updateFreeSwitchSipTrunk(trunkId, sipTrunk);
        // 2. Update FusionPBX record
        await this.updateFusionPBXTrunk(trunkId, trunk);
        return trunk;
    }
    async deleteSipTrunk(trunkId) {
        // 1. Delete FreeSWITCH SIP trunk
        await this.deleteFreeSwitchSipTrunk(trunkId);
        // 2. Delete FusionPBX record
        await this.deleteFusionPBXTrunk(trunkId);
    }
    // ===== OPENSIPS ROUTES =====
    async createOpenSipsRoute(route) {
        // 1. Create OpenSIPS routing rule
        const openSipsRule = this.generateOpenSipsRule(route);
        await this.createOpenSipsRule(openSipsRule);
        // 2. Create database record
        await this.createOpenSipsRouteRecord(route);
        return route;
    }
    async updateOpenSipsRoute(routeId, route) {
        // 1. Update OpenSIPS routing rule
        const openSipsRule = this.generateOpenSipsRule(route);
        await this.updateOpenSipsRule(routeId, openSipsRule);
        // 2. Update database record
        await this.updateOpenSipsRouteRecord(routeId, route);
        return route;
    }
    async deleteOpenSipsRoute(routeId) {
        // 1. Delete OpenSIPS routing rule
        await this.deleteOpenSipsRule(routeId);
        // 2. Delete database record
        await this.deleteOpenSipsRouteRecord(routeId);
    }
    // ===== GENERATORS =====
    generateInboundDialplan(route) {
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
    generateOutboundDialplan(route) {
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
    generateTimeCondition(condition) {
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
    generateIvrApplication(menu) {
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
    generateIvrDialplan(menu) {
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
    generateRingGroupApplication(group) {
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
    generateRingGroupDialplan(group) {
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
    generateQueueApplication(queue) {
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
    generateQueueDialplan(queue) {
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
    generateConferenceRoom(room) {
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
    generateConferenceDialplan(room) {
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
    generateVoicemailBox(box) {
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
    generateSipExtension(extension) {
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
    generateSipTrunk(trunk) {
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
    generateOpenSipsRule(route) {
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
    async createFreeSwitchDialplan(extension) {
        // Implementation for FreeSWITCH ESL API
        console.log('Creating FreeSWITCH dialplan:', extension);
    }
    async updateFreeSwitchDialplan(extensionId, extension) {
        console.log('Updating FreeSWITCH dialplan:', extensionId, extension);
    }
    async deleteFreeSwitchDialplan(extensionId) {
        console.log('Deleting FreeSWITCH dialplan:', extensionId);
    }
    async createFreeSwitchTimeCondition(condition) {
        console.log('Creating FreeSWITCH time condition:', condition);
    }
    async updateFreeSwitchTimeCondition(conditionId, condition) {
        console.log('Updating FreeSWITCH time condition:', conditionId, condition);
    }
    async deleteFreeSwitchTimeCondition(conditionId) {
        console.log('Deleting FreeSWITCH time condition:', conditionId);
    }
    async createFreeSwitchIvrApplication(application) {
        console.log('Creating FreeSWITCH IVR application:', application);
    }
    async updateFreeSwitchIvrApplication(applicationId, application) {
        console.log('Updating FreeSWITCH IVR application:', applicationId, application);
    }
    async deleteFreeSwitchIvrApplication(applicationId) {
        console.log('Deleting FreeSWITCH IVR application:', applicationId);
    }
    async createFreeSwitchRingGroupApplication(application) {
        console.log('Creating FreeSWITCH ring group application:', application);
    }
    async updateFreeSwitchRingGroupApplication(applicationId, application) {
        console.log('Updating FreeSWITCH ring group application:', applicationId, application);
    }
    async deleteFreeSwitchRingGroupApplication(applicationId) {
        console.log('Deleting FreeSWITCH ring group application:', applicationId);
    }
    async createFreeSwitchQueueApplication(application) {
        console.log('Creating FreeSWITCH queue application:', application);
    }
    async updateFreeSwitchQueueApplication(applicationId, application) {
        console.log('Updating FreeSWITCH queue application:', applicationId, application);
    }
    async deleteFreeSwitchQueueApplication(applicationId) {
        console.log('Deleting FreeSWITCH queue application:', applicationId);
    }
    async createFreeSwitchConferenceRoom(room) {
        console.log('Creating FreeSWITCH conference room:', room);
    }
    async updateFreeSwitchConferenceRoom(roomId, room) {
        console.log('Updating FreeSWITCH conference room:', roomId, room);
    }
    async deleteFreeSwitchConferenceRoom(roomId) {
        console.log('Deleting FreeSWITCH conference room:', roomId);
    }
    async createFreeSwitchVoicemailBox(box) {
        console.log('Creating FreeSWITCH voicemail box:', box);
    }
    async updateFreeSwitchVoicemailBox(boxId, box) {
        console.log('Updating FreeSWITCH voicemail box:', boxId, box);
    }
    async deleteFreeSwitchVoicemailBox(boxId) {
        console.log('Deleting FreeSWITCH voicemail box:', boxId);
    }
    async createFreeSwitchSipExtension(extension) {
        console.log('Creating FreeSWITCH SIP extension:', extension);
    }
    async updateFreeSwitchSipExtension(extensionId, extension) {
        console.log('Updating FreeSWITCH SIP extension:', extensionId, extension);
    }
    async deleteFreeSwitchSipExtension(extensionId) {
        console.log('Deleting FreeSWITCH SIP extension:', extensionId);
    }
    async createFreeSwitchSipTrunk(trunk) {
        console.log('Creating FreeSWITCH SIP trunk:', trunk);
    }
    async updateFreeSwitchSipTrunk(trunkId, trunk) {
        console.log('Updating FreeSWITCH SIP trunk:', trunkId, trunk);
    }
    async deleteFreeSwitchSipTrunk(trunkId) {
        console.log('Deleting FreeSWITCH SIP trunk:', trunkId);
    }
    // ===== FUSIONPBX API CALLS =====
    async createFusionPBXInboundRoute(route) {
        console.log('Creating FusionPBX inbound route:', route);
    }
    async updateFusionPBXInboundRoute(routeId, route) {
        console.log('Updating FusionPBX inbound route:', routeId, route);
    }
    async deleteFusionPBXInboundRoute(routeId) {
        console.log('Deleting FusionPBX inbound route:', routeId);
    }
    async createFusionPBXOutboundRoute(route) {
        console.log('Creating FusionPBX outbound route:', route);
    }
    async updateFusionPBXOutboundRoute(routeId, route) {
        console.log('Updating FusionPBX outbound route:', routeId, route);
    }
    async deleteFusionPBXOutboundRoute(routeId) {
        console.log('Deleting FusionPBX outbound route:', routeId);
    }
    async createFusionPBXTimeCondition(condition) {
        console.log('Creating FusionPBX time condition:', condition);
    }
    async updateFusionPBXTimeCondition(conditionId, condition) {
        console.log('Updating FusionPBX time condition:', conditionId, condition);
    }
    async deleteFusionPBXTimeCondition(conditionId) {
        console.log('Deleting FusionPBX time condition:', conditionId);
    }
    async createFusionPBXIvrMenu(menu) {
        console.log('Creating FusionPBX IVR menu:', menu);
    }
    async updateFusionPBXIvrMenu(menuId, menu) {
        console.log('Updating FusionPBX IVR menu:', menuId, menu);
    }
    async deleteFusionPBXIvrMenu(menuId) {
        console.log('Deleting FusionPBX IVR menu:', menuId);
    }
    async createFusionPBXRingGroup(group) {
        console.log('Creating FusionPBX ring group:', group);
    }
    async updateFusionPBXRingGroup(groupId, group) {
        console.log('Updating FusionPBX ring group:', groupId, group);
    }
    async deleteFusionPBXRingGroup(groupId) {
        console.log('Deleting FusionPBX ring group:', groupId);
    }
    async createFusionPBXQueue(queue) {
        console.log('Creating FusionPBX queue:', queue);
    }
    async updateFusionPBXQueue(queueId, queue) {
        console.log('Updating FusionPBX queue:', queueId, queue);
    }
    async deleteFusionPBXQueue(queueId) {
        console.log('Deleting FusionPBX queue:', queueId);
    }
    async createFusionPBXConferenceRoom(room) {
        console.log('Creating FusionPBX conference room:', room);
    }
    async updateFusionPBXConferenceRoom(roomId, room) {
        console.log('Updating FusionPBX conference room:', roomId, room);
    }
    async deleteFusionPBXConferenceRoom(roomId) {
        console.log('Deleting FusionPBX conference room:', roomId);
    }
    async createFusionPBXVoicemailBox(box) {
        console.log('Creating FusionPBX voicemail box:', box);
    }
    async updateFusionPBXVoicemailBox(boxId, box) {
        console.log('Updating FusionPBX voicemail box:', boxId, box);
    }
    async deleteFusionPBXVoicemailBox(boxId) {
        console.log('Deleting FusionPBX voicemail box:', boxId);
    }
    async createFusionPBXExtension(extension) {
        console.log('Creating FusionPBX extension:', extension);
    }
    async updateFusionPBXExtension(extensionId, extension) {
        console.log('Updating FusionPBX extension:', extensionId, extension);
    }
    async deleteFusionPBXExtension(extensionId) {
        console.log('Deleting FusionPBX extension:', extensionId);
    }
    async createFusionPBXTrunk(trunk) {
        console.log('Creating FusionPBX trunk:', trunk);
    }
    async updateFusionPBXTrunk(trunkId, trunk) {
        console.log('Updating FusionPBX trunk:', trunkId, trunk);
    }
    async deleteFusionPBXTrunk(trunkId) {
        console.log('Deleting FusionPBX trunk:', trunkId);
    }
    // ===== OPENSIPS API CALLS =====
    async createOpenSipsRule(rule) {
        console.log('Creating OpenSIPS rule:', rule);
    }
    async updateOpenSipsRule(ruleId, rule) {
        console.log('Updating OpenSIPS rule:', ruleId, rule);
    }
    async deleteOpenSipsRule(ruleId) {
        console.log('Deleting OpenSIPS rule:', ruleId);
    }
    async createOpenSipsRouteRecord(route) {
        console.log('Creating OpenSIPS route record:', route);
    }
    async updateOpenSipsRouteRecord(routeId, route) {
        console.log('Updating OpenSIPS route record:', routeId, route);
    }
    async deleteOpenSipsRouteRecord(routeId) {
        console.log('Deleting OpenSIPS route record:', routeId);
    }
    // ===== UTILITY METHODS =====
    async linkTimeCondition(routeId, timeConditionId) {
        console.log('Linking time condition:', routeId, timeConditionId);
    }
}
exports.VoipService = VoipService;
//# sourceMappingURL=voip-service.js.map