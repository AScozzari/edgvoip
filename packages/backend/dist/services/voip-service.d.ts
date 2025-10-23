import { TenantContext } from '../middleware/tenant-context';
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
export declare class VoipService {
    private freeSwitchConfig;
    private openSipsConfig;
    private fusionPBXConfig;
    private pool;
    constructor(freeSwitchConfig: FreeSwitchConfig, openSipsConfig: OpenSipsConfig, fusionPBXConfig: FusionPBXConfig);
    getInboundRoutes(tenantId: string): Promise<InboundRoute[]>;
    getInboundRouteById(routeId: string): Promise<InboundRoute | null>;
    createInboundRoute(tenantContext: TenantContext, route: Partial<InboundRoute>): Promise<InboundRoute>;
    updateInboundRoute(routeId: string, route: Partial<InboundRoute>): Promise<InboundRoute>;
    deleteInboundRoute(routeId: string): Promise<void>;
    getOutboundRoutes(tenantId: string): Promise<OutboundRoute[]>;
    getOutboundRouteById(routeId: string): Promise<OutboundRoute | null>;
    createOutboundRoute(tenantContext: TenantContext, route: Partial<OutboundRoute>): Promise<OutboundRoute>;
    updateOutboundRoute(routeId: string, route: Partial<OutboundRoute>): Promise<OutboundRoute>;
    deleteOutboundRoute(routeId: string): Promise<void>;
    getTimeConditions(tenantId: string): Promise<TimeCondition[]>;
    getTimeConditionById(conditionId: string): Promise<TimeCondition | null>;
    createTimeCondition(tenantContext: TenantContext, condition: Partial<TimeCondition>): Promise<TimeCondition>;
    updateTimeCondition(conditionId: string, condition: Partial<TimeCondition>): Promise<TimeCondition>;
    deleteTimeCondition(conditionId: string): Promise<void>;
    getIvrMenus(tenantId: string): Promise<IvrMenu[]>;
    getIvrMenuById(menuId: string): Promise<IvrMenu | null>;
    createIvrMenu(tenantContext: TenantContext, menu: Partial<IvrMenu>): Promise<IvrMenu>;
    updateIvrMenu(menuId: string, menu: Partial<IvrMenu>): Promise<IvrMenu>;
    deleteIvrMenu(menuId: string): Promise<void>;
    getRingGroups(tenantId: string): Promise<RingGroup[]>;
    getRingGroupById(groupId: string): Promise<RingGroup | null>;
    createRingGroup(tenantContext: TenantContext, group: Partial<RingGroup>): Promise<RingGroup>;
    updateRingGroup(groupId: string, group: Partial<RingGroup>): Promise<RingGroup>;
    deleteRingGroup(groupId: string): Promise<void>;
    getQueues(tenantId: string): Promise<Queue[]>;
    getQueueById(queueId: string): Promise<Queue | null>;
    createQueue(tenantContext: TenantContext, queue: Partial<Queue>): Promise<Queue>;
    updateQueue(queueId: string, queue: Partial<Queue>): Promise<Queue>;
    deleteQueue(queueId: string): Promise<void>;
    getConferenceRooms(tenantId: string): Promise<ConferenceRoom[]>;
    getConferenceRoomById(roomId: string): Promise<ConferenceRoom | null>;
    createConferenceRoom(tenantContext: TenantContext, room: Partial<ConferenceRoom>): Promise<ConferenceRoom>;
    updateConferenceRoom(roomId: string, room: Partial<ConferenceRoom>): Promise<ConferenceRoom>;
    deleteConferenceRoom(roomId: string): Promise<void>;
    getVoicemailBoxes(tenantId: string): Promise<VoicemailBox[]>;
    getVoicemailBoxById(boxId: string): Promise<VoicemailBox | null>;
    createVoicemailBox(tenantContext: TenantContext, box: Partial<VoicemailBox>): Promise<VoicemailBox>;
    updateVoicemailBox(boxId: string, box: Partial<VoicemailBox>): Promise<VoicemailBox>;
    deleteVoicemailBox(boxId: string): Promise<void>;
    getSipExtensions(tenantId: string): Promise<SipExtensionConfig[]>;
    getSipExtensionById(extensionId: string): Promise<SipExtensionConfig | null>;
    createSipExtension(tenantContext: TenantContext, extension: Partial<SipExtensionConfig>): Promise<SipExtensionConfig>;
    updateSipExtension(extensionId: string, extension: Partial<SipExtensionConfig>): Promise<SipExtensionConfig>;
    deleteSipExtension(extensionId: string): Promise<void>;
    getSipTrunks(tenantId: string): Promise<SipTrunkConfig[]>;
    getSipTrunkById(trunkId: string): Promise<SipTrunkConfig | null>;
    createSipTrunk(tenantContext: TenantContext, trunk: Partial<SipTrunkConfig>): Promise<SipTrunkConfig>;
    updateSipTrunk(trunkId: string, trunk: Partial<SipTrunkConfig>): Promise<SipTrunkConfig>;
    deleteSipTrunk(trunkId: string): Promise<void>;
    createOpenSipsRoute(route: OpenSipsRoute): Promise<OpenSipsRoute>;
    updateOpenSipsRoute(routeId: string, route: Partial<OpenSipsRoute>): Promise<OpenSipsRoute>;
    deleteOpenSipsRoute(routeId: string): Promise<void>;
    private generateInboundDialplan;
    private generateOutboundDialplan;
    private generateTimeCondition;
    private generateIvrApplication;
    private generateIvrDialplan;
    private generateRingGroupApplication;
    private generateRingGroupDialplan;
    private generateQueueApplication;
    private generateQueueDialplan;
    private generateConferenceRoom;
    private generateConferenceDialplan;
    private generateVoicemailBox;
    private generateSipExtension;
    private generateSipTrunk;
    private generateOpenSipsRule;
    private createFreeSwitchDialplan;
    private updateFreeSwitchDialplan;
    private deleteFreeSwitchDialplan;
    private createFreeSwitchTimeCondition;
    private updateFreeSwitchTimeCondition;
    private deleteFreeSwitchTimeCondition;
    private createFreeSwitchIvrApplication;
    private updateFreeSwitchIvrApplication;
    private deleteFreeSwitchIvrApplication;
    private createFreeSwitchRingGroupApplication;
    private updateFreeSwitchRingGroupApplication;
    private deleteFreeSwitchRingGroupApplication;
    private createFreeSwitchQueueApplication;
    private updateFreeSwitchQueueApplication;
    private deleteFreeSwitchQueueApplication;
    private createFreeSwitchConferenceRoom;
    private updateFreeSwitchConferenceRoom;
    private deleteFreeSwitchConferenceRoom;
    private createFreeSwitchVoicemailBox;
    private updateFreeSwitchVoicemailBox;
    private deleteFreeSwitchVoicemailBox;
    private createFreeSwitchSipExtension;
    private updateFreeSwitchSipExtension;
    private deleteFreeSwitchSipExtension;
    private createFreeSwitchSipTrunk;
    private updateFreeSwitchSipTrunk;
    private deleteFreeSwitchSipTrunk;
    private createFusionPBXInboundRoute;
    private updateFusionPBXInboundRoute;
    private deleteFusionPBXInboundRoute;
    private createFusionPBXOutboundRoute;
    private updateFusionPBXOutboundRoute;
    private deleteFusionPBXOutboundRoute;
    private createFusionPBXTimeCondition;
    private updateFusionPBXTimeCondition;
    private deleteFusionPBXTimeCondition;
    private createFusionPBXIvrMenu;
    private updateFusionPBXIvrMenu;
    private deleteFusionPBXIvrMenu;
    private createFusionPBXRingGroup;
    private updateFusionPBXRingGroup;
    private deleteFusionPBXRingGroup;
    private createFusionPBXQueue;
    private updateFusionPBXQueue;
    private deleteFusionPBXQueue;
    private createFusionPBXConferenceRoom;
    private updateFusionPBXConferenceRoom;
    private deleteFusionPBXConferenceRoom;
    private createFusionPBXVoicemailBox;
    private updateFusionPBXVoicemailBox;
    private deleteFusionPBXVoicemailBox;
    private createFusionPBXExtension;
    private updateFusionPBXExtension;
    private deleteFusionPBXExtension;
    private createFusionPBXTrunk;
    private updateFusionPBXTrunk;
    private deleteFusionPBXTrunk;
    private createOpenSipsRule;
    private updateOpenSipsRule;
    private deleteOpenSipsRule;
    private createOpenSipsRouteRecord;
    private updateOpenSipsRouteRecord;
    private deleteOpenSipsRouteRecord;
    private linkTimeCondition;
}
//# sourceMappingURL=voip-service.d.ts.map