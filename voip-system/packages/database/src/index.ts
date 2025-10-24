import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://edgvoip_user:edgvoip_password@192.168.172.234:5432/edgvoip',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Database client with tenant context
export class DatabaseClient {
  private client: any;
  private tenantId: string | null = null;
  private userRole: string | null = null;

  constructor(client: any) {
    this.client = client;
  }

  // Set tenant context for RLS
  async setTenantContext(tenantId: string, userRole: string = 'user') {
    this.tenantId = tenantId;
    this.userRole = userRole;
    await this.client.query('SELECT set_tenant_context($1, $2)', [tenantId, userRole]);
  }

  // Clear tenant context
  async clearTenantContext() {
    this.tenantId = null;
    this.userRole = null;
    await this.client.query('SELECT clear_tenant_context()');
  }

  // Get current tenant ID
  getCurrentTenantId(): string | null {
    return this.tenantId;
  }

  // Get current user role
  getCurrentUserRole(): string | null {
    return this.userRole;
  }

  // Query with tenant context
  async query(text: string, params?: any[]) {
    return this.client.query(text, params);
  }

  // Release client
  async release() {
    await this.clearTenantContext();
    this.client.release();
  }
}

// Get database client with tenant context
export async function getClient(tenantId?: string, userRole?: string): Promise<DatabaseClient> {
  const client = await pool.connect();
  const dbClient = new DatabaseClient(client);
  
  if (tenantId) {
    await dbClient.setTenantContext(tenantId, userRole || 'user');
  }
  
  return dbClient;
}

// Execute query with tenant context
export async function queryWithTenant(
  text: string, 
  params: any[] = [], 
  tenantId?: string, 
  userRole?: string
) {
  const client = await getClient(tenantId, userRole);
  
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    await client.release();
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: DatabaseClient) => Promise<T>,
  tenantId?: string,
  userRole?: string
): Promise<T> {
  const client = await getClient(tenantId, userRole);
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.release();
  }
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Close all connections
export async function closePool(): Promise<void> {
  await pool.end();
}

export { pool };
