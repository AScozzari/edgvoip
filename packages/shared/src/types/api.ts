import { z } from 'zod';

// API Response wrapper
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }).optional(),
  meta: z.object({
    timestamp: z.date(),
    request_id: z.string().uuid(),
    tenant_id: z.string().uuid().optional()
  })
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: Date;
    request_id: string;
    tenant_id?: string;
  };
};

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(1000).default(50),
  total: z.number().min(0),
  total_pages: z.number().min(0)
});

export type Pagination = z.infer<typeof PaginationSchema>;

// JWT payload schema
export const JWTPayloadSchema = z.object({
  sub: z.string().uuid(), // user_id
  tenant_id: z.string().uuid().optional(),
  store_id: z.string().uuid().optional(),
  role: z.enum(['super_admin', 'tenant_admin', 'admin', 'manager', 'user']),
  permissions: z.array(z.string()).optional(),
  iat: z.number(),
  exp: z.number()
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

// Company schema for tenant management
export const CompanySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  legal_name: z.string().min(1).max(255),
  vat_number: z.string().max(50).optional(),
  tax_code: z.string().max(50).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(100).default('Italy'),
  is_primary: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date()
});

export type Company = z.infer<typeof CompanySchema>;

// Tenant Contact schema
export const TenantContactSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  company_id: z.string().uuid().optional(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  role: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  is_primary: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date()
});

export type TenantContact = z.infer<typeof TenantContactSchema>;

// Admin User schema for tenant creation
export const AdminUserSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['tenant_admin', 'super_admin']).default('tenant_admin')
});

export type AdminUser = z.infer<typeof AdminUserSchema>;

// Create Tenant Request schema
export const CreateTenantRequestSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  domain: z.string().min(1).max(255),
  sip_domain: z.string().min(1).max(255),
  admin_user: AdminUserSchema,
  companies: z.array(CompanySchema.omit({ id: true, tenant_id: true, created_at: true, updated_at: true })).min(1),
  contacts: z.array(TenantContactSchema.omit({ id: true, tenant_id: true, created_at: true, updated_at: true })).min(1)
});

export type CreateTenantRequest = z.infer<typeof CreateTenantRequestSchema>;

// Cross-tenant analytics schemas
export const CrossTenantStatsSchema = z.object({
  total_tenants: z.number(),
  total_users: z.number(),
  total_extensions: z.number(),
  total_calls_24h: z.number(),
  active_tenants: z.number(),
  inactive_tenants: z.number()
});

export type CrossTenantStats = z.infer<typeof CrossTenantStatsSchema>;

export const TenantStatsSchema = z.object({
  tenant_id: z.string().uuid(),
  tenant_name: z.string(),
  tenant_slug: z.string(),
  users_count: z.number(),
  extensions_count: z.number(),
  calls_24h: z.number(),
  companies_count: z.number(),
  contacts_count: z.number(),
  status: z.string()
});

export type TenantStats = z.infer<typeof TenantStatsSchema>;

