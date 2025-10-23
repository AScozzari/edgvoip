import { CDR, CDRFilter, CDRStats } from '@w3-voip/shared';
export declare class CDRService {
    createCDR(cdrData: Omit<CDR, 'id' | 'created_at' | 'updated_at'>): Promise<CDR>;
    updateCDR(cdrId: string, updates: Partial<Omit<CDR, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>, tenantId?: string): Promise<CDR>;
    getCDRById(cdrId: string, tenantId?: string): Promise<CDR | null>;
    getCDRByCallUuid(callUuid: string, tenantId?: string): Promise<CDR | null>;
    listCDR(filter: CDRFilter): Promise<{
        cdr: CDR[];
        total: number;
        totalPages: number;
    }>;
    getCDRStats(filter: Omit<CDRFilter, 'page' | 'limit' | 'sort_by' | 'sort_order'>): Promise<CDRStats>;
    deleteCDR(cdrId: string, tenantId?: string): Promise<void>;
    anonymizeCDR(cdrId: string, tenantId?: string): Promise<void>;
}
//# sourceMappingURL=cdr.service.d.ts.map