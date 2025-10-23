import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface TenantContext {
  tenant_id: string;
  sip_domain: string;
  store_id?: string;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
    }
  }
}

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function tenantContextMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'edg-voip-secret-key-2024';

    // Verify and decode JWT
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    if (!payload.tenant_id) {
      return res.status(401).json({ error: 'No tenant_id in JWT payload' });
    }

    // Fetch tenant from database
    const result = await pool.query(
      'SELECT id, name, sip_domain FROM tenants WHERE id = $1 AND status = $2',
      [payload.tenant_id, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = result.rows[0];

    // Extract store_id from request body or query params (optional)
    const store_id = req.body?.store_id || req.query?.store_id;

    // Add tenant context to request
    req.tenantContext = {
      tenant_id: payload.tenant_id,
      sip_domain: tenant.sip_domain,
      store_id: store_id as string | undefined
    };

    next();
  } catch (error) {
    console.error('Tenant context middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Helper function to generate SIP domain from tenant name
export function generateSipDomain(tenantName: string): string {
  return `${tenantName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')}.edgvoip.local`;
}

// Helper function to validate SIP domain format
export function validateSipDomain(sipDomain: string): boolean {
  const regex = /^[a-z0-9-]+\.edgvoip\.local$/;
  return regex.test(sipDomain) && sipDomain.length <= 253;
}
