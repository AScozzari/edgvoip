export interface RingGroup {
    id: string;
    tenant_id: string;
    store_id?: string;
    name: string;
    description?: string;
    extension: string;
    strategy: 'ringall' | 'hunt' | 'random' | 'simultaneous';
    ring_time: number;
    members: Array<{
        extension_id: string;
        extension: string;
        display_name: string;
        priority: number;
        ring_delay: number;
        ring_timeout: number;
        enabled: boolean;
    }>;
    member_settings: any;
    moh_sound?: string;
    voicemail_enabled: boolean;
    voicemail_extension?: string;
    voicemail_password?: string;
    voicemail_email?: string;
    call_timeout: number;
    call_timeout_action: 'voicemail' | 'hangup' | 'forward';
    call_timeout_destination?: string;
    failover_enabled: boolean;
    failover_destination_type?: string;
    failover_destination_id?: string;
    failover_destination_data?: any;
    caller_id_name?: string;
    caller_id_number?: string;
    recording_enabled: boolean;
    recording_path?: string;
    recording_consent_required: boolean;
    max_concurrent_calls: number;
    current_calls: number;
    settings: any;
    enabled: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface RingGroupMember {
    id: string;
    ring_group_id: string;
    extension_id: string;
    priority: number;
    ring_delay: number;
    ring_timeout: number;
    enabled: boolean;
    settings: any;
    created_at: Date;
    updated_at: Date;
}
export interface RingGroupCallLog {
    id: string;
    ring_group_id: string;
    call_uuid: string;
    caller_id_name?: string;
    caller_id_number?: string;
    destination_number?: string;
    start_time: Date;
    end_time?: Date;
    duration: number;
    hangup_cause?: string;
    answered_by_extension?: string;
    answered_by_name?: string;
    recording_path?: string;
    settings: any;
    created_at: Date;
}
export declare class RingGroupService {
    createRingGroup(ringGroupData: Partial<RingGroup>): Promise<RingGroup>;
    getRingGroups(tenantId: string, storeId?: string): Promise<RingGroup[]>;
    getRingGroup(ringGroupId: string): Promise<RingGroup | null>;
    addMember(ringGroupId: string, extensionId: string, memberData: Partial<RingGroupMember>): Promise<RingGroupMember>;
    removeMember(ringGroupId: string, extensionId: string): Promise<void>;
    updateMember(ringGroupId: string, extensionId: string, memberData: Partial<RingGroupMember>): Promise<RingGroupMember>;
    updateRingGroup(ringGroupId: string, updateData: Partial<RingGroup>): Promise<RingGroup>;
    deleteRingGroup(ringGroupId: string): Promise<void>;
    getCallLogs(ringGroupId: string, limit?: number, offset?: number): Promise<RingGroupCallLog[]>;
    logCall(callData: Partial<RingGroupCallLog>): Promise<string>;
    updateCallLog(callUuid: string, updateData: Partial<RingGroupCallLog>): Promise<void>;
    generateRingGroupXML(ringGroup: RingGroup): string;
    private generateRingAllXML;
    private generateHuntXML;
    private generateRandomXML;
    private generateSimultaneousXML;
    private generateTimeoutActionXML;
    private mapRowToRingGroup;
    private mapRowToRingGroupMember;
    private mapRowToRingGroupCallLog;
}
export declare const ringGroupService: RingGroupService;
//# sourceMappingURL=ring-group.service.d.ts.map