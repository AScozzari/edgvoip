import { Pool, PoolClient } from 'pg';

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('💡 Please set DATABASE_URL in your .env file');
  console.error('Example: DATABASE_URL=postgresql://user:password@host:5432/database');
  process.exit(1);
}

// Database connection pool with optimized settings for Replit environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  allowExitOnIdle: false,
});

// Pool event handlers for resilience
pool.on('error', (err: Error, client: PoolClient) => {
  console.error('⚠️ Unexpected database pool error:', err.message);
  console.error('⚠️ Error code:', (err as any).code);
  
  // Don't crash on connection termination - pool will recover
  if ((err as any).code === '57P01' || err.message.includes('terminating connection')) {
    console.warn('⚠️ Connection terminated by database server - pool will create new connections');
    return;
  }
  
  // Log other errors but don't crash
  console.error('⚠️ Pool error details:', err);
});

pool.on('connect', (client: PoolClient) => {
  console.log('✅ New database connection established in pool');
});

pool.on('acquire', (client: PoolClient) => {
  // Client acquired from pool - uncomment for debugging
  // console.log('📊 Database client acquired from pool');
});

pool.on('remove', (client: PoolClient) => {
  console.log('🔄 Database client removed from pool');
});

// Graceful pool cleanup
let isPoolClosing = false;

async function gracefulPoolShutdown() {
  if (isPoolClosing) return;
  isPoolClosing = true;
  
  console.log('🛑 Closing database connection pool...');
  try {
    await pool.end();
    console.log('✅ Database pool closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
}

process.on('SIGTERM', gracefulPoolShutdown);
process.on('SIGINT', gracefulPoolShutdown);

// Database client with tenant context
export class DatabaseClient {
  private client: any;
  private tenantId: string | null = null;
  private userRole: string | null = null;
  private released: boolean = false;

  constructor(client: any) {
    this.client = client;
  }

  // Set tenant context for RLS
  async setTenantContext(tenantId: string, userRole: string = 'user') {
    this.tenantId = tenantId;
    this.userRole = userRole;
    try {
      await this.client.query('SELECT set_tenant_context($1, $2)', [tenantId, userRole]);
    } catch (error: any) {
      // If tenant context function doesn't exist, just skip it
      if (error.code === '42883') {
        console.warn('⚠️ set_tenant_context function not found - skipping RLS setup');
      } else {
        throw error;
      }
    }
  }

  // Clear tenant context
  async clearTenantContext() {
    this.tenantId = null;
    this.userRole = null;
    try {
      await this.client.query('SELECT clear_tenant_context()');
    } catch (error: any) {
      // If function doesn't exist, just skip it
      if (error.code === '42883') {
        // Function doesn't exist - that's ok
      } else {
        console.warn('⚠️ Error clearing tenant context:', error.message);
      }
    }
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
    if (this.released) {
      throw new Error('Cannot query on released client');
    }
    return this.client.query(text, params);
  }

  // Release client
  async release() {
    if (this.released) return;
    
    try {
      await this.clearTenantContext();
    } catch (error) {
      console.warn('⚠️ Error clearing context before release:', error);
    }
    
    this.client.release();
    this.released = true;
  }
}

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.code === '42P01' || error.code === '42883') {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`⚠️ Database operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Get database client with tenant context and retry logic
export async function getClient(tenantId?: string, userRole?: string): Promise<DatabaseClient> {
  const client = await retryWithBackoff(async () => {
    return await pool.connect();
  }, 3, 500);
  
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

// Health check with retry
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await retryWithBackoff(async () => {
      return await pool.query('SELECT 1 as health');
    }, 2, 500);
    
    return result.rows.length > 0 && result.rows[0].health === 1;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

// Periodic health check (runs every 30 seconds)
let healthCheckInterval: NodeJS.Timeout | null = null;

export function startPeriodicHealthCheck(intervalMs: number = 30000) {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      console.warn('⚠️ Periodic health check failed - database may be unavailable');
    }
  }, intervalMs);
  
  console.log(`🏥 Started periodic database health check (every ${intervalMs / 1000}s)`);
}

export function stopPeriodicHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('🛑 Stopped periodic database health check');
  }
}

// Close all connections
export async function closePool(): Promise<void> {
  stopPeriodicHealthCheck();
  await gracefulPoolShutdown();
}

// Pool statistics
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

export { pool };
