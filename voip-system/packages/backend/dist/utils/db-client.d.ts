import { DatabaseClient } from '@w3-voip/database';
/**
 * Get a database client with RLS context automatically set
 * This should be used instead of getClient() directly in services
 */
export declare function getClientWithRLS(tenantId?: string, userRole?: string): Promise<DatabaseClient>;
/**
 * Execute a query with RLS context
 */
export declare function queryWithRLS<T = any>(query: string, params: any[], tenantId?: string, userRole?: string): Promise<T[]>;
//# sourceMappingURL=db-client.d.ts.map