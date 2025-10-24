export interface Store {
    id: string;
    tenant_id: string;
    name: string;
    address: string;
    phone: string;
    status: 'active' | 'inactive';
    settings: {
        timezone: string;
        business_hours: {
            open: string;
            close: string;
            days: string[];
        };
    };
    created_at: Date;
    updated_at: Date;
}
export declare class StoreService {
    createStore(storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'>): Promise<Store>;
    getStoreById(storeId: string, tenantId?: string): Promise<Store | null>;
    getStoreByStoreId(storeId: string, tenantId: string): Promise<Store | null>;
    updateStore(storeId: string, updates: Partial<Omit<Store, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>, tenantId?: string): Promise<Store>;
    deleteStore(storeId: string, tenantId?: string): Promise<void>;
    listStores(tenantId: string, page?: number, limit?: number, search?: string): Promise<{
        stores: Store[];
        total: number;
        totalPages: number;
    }>;
    getStoreStats(storeId: string, tenantId?: string): Promise<{
        extension_count: number;
        trunk_count: number;
        total_calls: number;
        active_calls: number;
        last_call_time: Date | null;
    }>;
    activateStore(storeId: string, tenantId?: string): Promise<Store>;
    deactivateStore(storeId: string, tenantId?: string): Promise<Store>;
    validateStoreIdUniqueness(storeId: string, tenantId: string, excludeStoreId?: string): Promise<boolean>;
}
//# sourceMappingURL=store.service.d.ts.map