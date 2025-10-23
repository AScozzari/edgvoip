import { Pool } from 'pg';
declare const pool: Pool;
export declare class DatabaseClient {
    private client;
    private tenantId;
    private userRole;
    constructor(client: any);
    setTenantContext(tenantId: string, userRole?: string): Promise<void>;
    clearTenantContext(): Promise<void>;
    getCurrentTenantId(): string | null;
    getCurrentUserRole(): string | null;
    query(text: string, params?: any[]): Promise<any>;
    release(): Promise<void>;
}
export declare function getClient(tenantId?: string, userRole?: string): Promise<DatabaseClient>;
export declare function queryWithTenant(text: string, params?: any[], tenantId?: string, userRole?: string): Promise<any>;
export declare function withTransaction<T>(callback: (client: DatabaseClient) => Promise<T>, tenantId?: string, userRole?: string): Promise<T>;
export declare function healthCheck(): Promise<boolean>;
export declare function closePool(): Promise<void>;
export { pool };
//# sourceMappingURL=index.d.ts.map