import { Request, Response, NextFunction } from 'express';
import { getClient } from '@w3-voip/database';
import { AuthRequest } from './auth';

// Tenant Context Middleware
export const setTenantContext = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TENANT_ID_REQUIRED',
          message: 'Tenant ID is required'
        }
      });
    }

    // Verify tenant exists and is active
    const client = await getClient();
    
    try {
      const result = await client.query(
        'SELECT id, name, status FROM tenants WHERE id = $1',
        [req.tenantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found'
          }
        });
      }

      const tenant = result.rows[0];
      
      if (tenant.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_INACTIVE',
            message: `Tenant is ${tenant.status}`
          }
        });
      }

      // Set tenant context in request
      req.tenantId = tenant.id;
      
      // Add tenant info to response headers for debugging
      res.set('X-Tenant-ID', tenant.id);
      res.set('X-Tenant-Name', tenant.name);
      
    } finally {
      await client.release();
    }

    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TENANT_CONTEXT_ERROR',
        message: 'Failed to set tenant context'
      }
    });
  }
};

// Store Context Middleware
export const setStoreContext = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId || req.body.storeId || req.query.storeId;
    
    if (!storeId) {
      return next(); // Store is optional
    }

    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context required for store access'
        }
      });
    }

    // Verify store exists and belongs to tenant
    const client = await getClient();
    
    try {
      const result = await client.query(
        'SELECT id, name, status FROM stores WHERE id = $1 AND tenant_id = $2',
        [storeId, req.tenantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'STORE_NOT_FOUND',
            message: 'Store not found or access denied'
          }
        });
      }

      const store = result.rows[0];
      
      if (store.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'STORE_INACTIVE',
            message: `Store is ${store.status}`
          }
        });
      }

      // Set store context in request
      req.storeId = store.id;
      
      // Add store info to response headers for debugging
      res.set('X-Store-ID', store.id);
      res.set('X-Store-Name', store.name);
      
    } finally {
      await client.release();
    }

    next();
  } catch (error) {
    console.error('Store context error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'STORE_CONTEXT_ERROR',
        message: 'Failed to set store context'
      }
    });
  }
};

// Tenant Rate Limiting Middleware
export const tenantRateLimit = (maxRequests: number = 100, windowMs: number = 900000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.tenantId) {
      return next();
    }

    const now = Date.now();
    const key = `tenant:${req.tenantId}`;
    const tenantRequests = requests.get(key);

    if (!tenantRequests || now > tenantRequests.resetTime) {
      // Reset or initialize
      requests.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (tenantRequests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded for tenant. Max ${maxRequests} requests per ${windowMs / 1000} seconds`
        }
      });
    }

    tenantRequests.count++;
    next();
  };
};

// Tenant Resource Validation Middleware - FIXED SQL INJECTION VULNERABILITY
export const validateTenantResource = (resourceType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params.id || req.params[`${resourceType}Id`];
      
      if (!resourceId) {
        return next();
      }

      if (!req.tenantId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Tenant context required for resource validation'
          }
        });
      }

      // Validate resource belongs to tenant
      const client = await getClient();
      
      try {
        // Whitelist of allowed table names to prevent SQL injection
        const tableNameMap: Record<string, string> = {
          'extension': 'extensions',
          'trunk': 'sip_trunks',
          'store': 'stores',
          'queue': 'call_queues',
          'ivr': 'ivr_menus',
          'conference': 'conference_rooms',
          'voicemail': 'voicemail_boxes',
          'ring_group': 'ring_groups',
          'time_condition': 'time_conditions'
        };
        
        const tableName = tableNameMap[resourceType];
        
        if (!tableName) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_RESOURCE_TYPE',
              message: `Invalid resource type: ${resourceType}`
            }
          });
        }
        
        const result = await client.query(
          `SELECT id FROM ${tableName} WHERE id = $1 AND tenant_id = $2`,
          [resourceId, req.tenantId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: `${resourceType} not found or access denied`
            }
          });
        }
        
      } finally {
        await client.release();
      }

      next();
    } catch (error) {
      console.error('Resource validation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'RESOURCE_VALIDATION_ERROR',
          message: 'Failed to validate resource access'
        }
      });
    }
  };
};
