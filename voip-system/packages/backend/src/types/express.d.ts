import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        id: string;
        email: string;
        role: string;
        tenant_id?: string;
        tenant_slug?: string;
      };
    }
  }
}

