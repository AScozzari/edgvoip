export interface ConferenceRoom {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    extension: string;
    pin?: string;
    moderator_pin?: string;
    max_members: number;
    record: boolean;
    record_path?: string;
    moh_sound?: string;
    announce_sound?: string;
    settings: any;
    enabled: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface ConferenceMember {
    id: string;
    conference_id: string;
    extension: string;
    caller_id_name?: string;
    caller_id_number?: string;
    join_time: Date;
    leave_time?: Date;
    is_moderator: boolean;
    is_muted: boolean;
    is_deaf: boolean;
    member_flags?: string;
    created_at: Date;
}
export declare class ConferenceService {
    private mapRowToConferenceRoom;
    private mapRowToConferenceMember;
    createConferenceRoom(conferenceRoomData: Omit<ConferenceRoom, 'id' | 'created_at' | 'updated_at'>): Promise<ConferenceRoom>;
    getConferenceRoomById(id: string, tenantId: string): Promise<ConferenceRoom | undefined>;
    getConferenceRoomByExtension(extension: string, tenantId: string): Promise<ConferenceRoom | undefined>;
    listConferenceRooms(tenantId: string): Promise<ConferenceRoom[]>;
    updateConferenceRoom(id: string, tenantId: string, updateData: Partial<Omit<ConferenceRoom, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>): Promise<ConferenceRoom | undefined>;
    deleteConferenceRoom(id: string, tenantId: string): Promise<boolean>;
    getConferenceMembers(conferenceId: string, tenantId: string): Promise<ConferenceMember[]>;
    addConferenceMember(conferenceId: string, tenantId: string, memberData: {
        extension: string;
        caller_id_name?: string;
        caller_id_number?: string;
        is_moderator?: boolean;
    }): Promise<ConferenceMember>;
    removeConferenceMember(conferenceId: string, tenantId: string, memberId: string): Promise<boolean>;
    updateMemberStatus(conferenceId: string, tenantId: string, memberId: string, updates: {
        is_muted?: boolean;
        is_deaf?: boolean;
        is_moderator?: boolean;
    }): Promise<boolean>;
    validateConferenceRoom(conferenceRoom: Partial<ConferenceRoom>): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    getActiveConferenceRooms(tenantId: string): Promise<ConferenceRoom[]>;
    generateFreeSwitchXml(conferenceRoom: ConferenceRoom): Promise<string>;
    getConferenceStatistics(conferenceId: string, tenantId: string): Promise<{
        total_members: number;
        active_members: number;
        moderators: number;
        average_duration: number;
        total_calls: number;
    }>;
}
//# sourceMappingURL=conference.service.d.ts.map