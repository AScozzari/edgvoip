import { Request, Response, NextFunction } from 'express';
import { getClient } from '@w3-voip/database';

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    slug: string;
    name: string;
    domain: string;
    sip_domain: string;
  };
}

/**
 * Middleware to validate tenant slug from URL parameters
 * Extracts tenant information and attaches it to the request object
 */
export async function validateTenantSlug(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  const tenantSlug = req.params.tenantSlug || req.query.tenantSlug;
  
  if (!tenantSlug) {
    return res.status(400).json({
      success: false,
      error: 'Tenant slug is required'
    });
  }

  try {
    const client = await getClient();
    const result = await client.query(
      'SELECT id, slug, name, domain, sip_domain FROM tenants WHERE slug = $1 AND status = $2',
      [tenantSlug, 'active']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found',
        tenantSlug
      });
    }

    const tenant = result.rows[0];
    req.tenant = tenant as any;
    
    next();
  } catch (error) {
    console.error('Error validating tenant slug:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate tenant'
    });
  }
}

/**
 * Middleware to extract tenant slug from JWT token
 * Used for API calls that don't have tenant slug in URL
 */
export function extractTenantFromToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization token required'
    });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = require('jsonwebtoken').verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    (req as any).tenantSlug = decoded.tenantSlug;
    (req as any).tenantId = decoded.tenantId;
    (req as any).userId = decoded.userId;
    (req as any).userRole = decoded.role;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}
