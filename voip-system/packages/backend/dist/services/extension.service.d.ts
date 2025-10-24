export interface Extension {
    id: string;
    tenant_id: string;
    store_id?: string;
    extension: string;
    password: string;
    display_name: string;
    status: 'active' | 'inactive';
    type: 'user' | 'queue' | 'conference';
    settings: {
        voicemail_enabled: boolean;
        call_forwarding: {
            enabled: boolean;
            destination?: string;
        };
        recording: {
            enabled: boolean;
            mode: 'always' | 'on_demand';
        };
    };
    created_at: Date;
    updated_at: Date;
}
export declare class ExtensionService {
    createExtension(extensionData: Omit<Extension, 'id' | 'created_at' | 'updated_at'>): Promise<Extension>;
    getExtensionById(extensionId: string, tenantId?: string): Promise<Extension | null>;
    getExtensionByNumber(extension: string, tenantId: string): Promise<Extension | null>;
    updateExtension(extensionId: string, updates: Partial<Omit<Extension, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>, tenantId?: string): Promise<Extension>;
    deleteExtension(extensionId: string, tenantId?: string): Promise<void>;
    listExtensions(tenantId: string, storeId?: string, page?: number, limit?: number, search?: string): Promise<{
        extensions: Extension[];
        total: number;
        totalPages: number;
    }>;
    verifyExtensionPassword(extension: string, password: string, tenantId: string): Promise<Extension | null>;
    activateExtension(extensionId: string, tenantId?: string): Promise<Extension>;
    deactivateExtension(extensionId: string, tenantId?: string): Promise<Extension>;
    lockExtension(extensionId: string, tenantId?: string): Promise<Extension>;
    validateExtensionUniqueness(extension: string, tenantId: string, excludeExtensionId?: string): Promise<boolean>;
    getExtensionStatus(extensionId: string, tenantId?: string): Promise<{
        extension: string;
        registered: boolean;
        ip?: string;
        port?: number;
        user_agent?: string;
        expires?: number;
    }>;
    getExtensionStats(extensionId: string, tenantId?: string): Promise<{
        total_calls: number;
        answered_calls: number;
        missed_calls: number;
        total_duration: number;
        last_call_time: Date | null;
    }>;
}
//# sourceMappingURL=extension.service.d.ts.map