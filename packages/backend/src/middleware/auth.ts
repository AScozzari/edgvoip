// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '@w3-voip/shared';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      tenantId?: string;
      storeId?: string;
    }
  }
}

export interface AuthRequest extends Request {
  user: JWTPayload;
  tenantId: string;
  storeId?: string;
}

// JWT Authentication Middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Access token required'
      }
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Set user context
    req.user = decoded;
    req.tenantId = decoded.tenant_id;
    req.storeId = decoded.store_id;
    
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

// Tenant Isolation Middleware
export const requireTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.tenantId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TENANT_REQUIRED',
        message: 'Tenant context required'
      }
    });
  }
  next();
};

// Super Admin Access Middleware
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'SUPER_ADMIN_REQUIRED',
        message: 'Super admin access required'
      }
    });
  }
  next();
};

// Role-based Authorization Middleware
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Required role: ${roles.join(' or ')}`
        }
      });
    }

    next();
  };
};

// Permission-based Authorization Middleware
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Required permission: ${permission}`
        }
      });
    }

    next();
  };
};

// Store Access Middleware
export const requireStoreAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  const storeId = req.params.storeId || req.body.storeId || req.query.storeId;
  
  if (!storeId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'STORE_ID_REQUIRED',
        message: 'Store ID required'
      }
    });
  }

  // If user has store_id in token, verify it matches
  if (req.user.store_id && req.user.store_id !== storeId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'STORE_ACCESS_DENIED',
        message: 'Access denied to this store'
      }
    });
  }

  req.storeId = storeId;
  next();
};

// Optional Authentication Middleware (for public endpoints)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const decoded = jwt.verify(token, secret) as JWTPayload;
        req.user = decoded;
        req.tenantId = decoded.tenant_id;
        req.storeId = decoded.store_id;
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }

  next();
};

// Generate JWT Token
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const expiresIn: string | number = process.env.JWT_EXPIRES_IN || '24h';
  
  return jwt.sign(payload, secret, { expiresIn });
};

// Verify JWT Token
export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.verify(token, secret) as JWTPayload;
};

