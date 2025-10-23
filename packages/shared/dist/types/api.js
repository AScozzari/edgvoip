"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantStatsSchema = exports.CrossTenantStatsSchema = exports.CreateTenantRequestSchema = exports.AdminUserSchema = exports.TenantContactSchema = exports.CompanySchema = exports.JWTPayloadSchema = exports.PaginationSchema = exports.ApiResponseSchema = void 0;
const zod_1 = require("zod");
// API Response wrapper
exports.ApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.any().optional(),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.any().optional()
    }).optional(),
    meta: zod_1.z.object({
        timestamp: zod_1.z.date(),
        request_id: zod_1.z.string().uuid(),
        tenant_id: zod_1.z.string().uuid().optional()
    })
});
// Pagination schema
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.number().min(1).default(1),
    limit: zod_1.z.number().min(1).max(1000).default(50),
    total: zod_1.z.number().min(0),
    total_pages: zod_1.z.number().min(0)
});
// JWT payload schema
exports.JWTPayloadSchema = zod_1.z.object({
    sub: zod_1.z.string().uuid(), // user_id
    tenant_id: zod_1.z.string().uuid().optional(),
    store_id: zod_1.z.string().uuid().optional(),
    role: zod_1.z.enum(['super_admin', 'tenant_admin', 'admin', 'manager', 'user']),
    permissions: zod_1.z.array(zod_1.z.string()).optional(),
    iat: zod_1.z.number(),
    exp: zod_1.z.number()
});
// Company schema for tenant management
exports.CompanySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    legal_name: zod_1.z.string().min(1).max(255),
    vat_number: zod_1.z.string().max(50).optional(),
    tax_code: zod_1.z.string().max(50).optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().max(100).optional(),
    state: zod_1.z.string().max(100).optional(),
    postal_code: zod_1.z.string().max(20).optional(),
    country: zod_1.z.string().max(100).default('Italy'),
    is_primary: zod_1.z.boolean().default(false),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date()
});
// Tenant Contact schema
exports.TenantContactSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenant_id: zod_1.z.string().uuid(),
    company_id: zod_1.z.string().uuid().optional(),
    first_name: zod_1.z.string().min(1).max(100),
    last_name: zod_1.z.string().min(1).max(100),
    role: zod_1.z.string().max(100).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().max(50).optional(),
    mobile: zod_1.z.string().max(50).optional(),
    is_primary: zod_1.z.boolean().default(false),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date()
});
// Admin User schema for tenant creation
exports.AdminUserSchema = zod_1.z.object({
    first_name: zod_1.z.string().min(1).max(100),
    last_name: zod_1.z.string().min(1).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(100),
    role: zod_1.z.enum(['tenant_admin', 'super_admin']).default('tenant_admin')
});
// Create Tenant Request schema
exports.CreateTenantRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    slug: zod_1.z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
    domain: zod_1.z.string().min(1).max(255),
    sip_domain: zod_1.z.string().min(1).max(255),
    admin_user: exports.AdminUserSchema,
    companies: zod_1.z.array(exports.CompanySchema.omit({ id: true, tenant_id: true, created_at: true, updated_at: true })).min(1),
    contacts: zod_1.z.array(exports.TenantContactSchema.omit({ id: true, tenant_id: true, created_at: true, updated_at: true })).min(1)
});
// Cross-tenant analytics schemas
exports.CrossTenantStatsSchema = zod_1.z.object({
    total_tenants: zod_1.z.number(),
    total_users: zod_1.z.number(),
    total_extensions: zod_1.z.number(),
    total_calls_24h: zod_1.z.number(),
    active_tenants: zod_1.z.number(),
    inactive_tenants: zod_1.z.number()
});
exports.TenantStatsSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().uuid(),
    tenant_name: zod_1.z.string(),
    tenant_slug: zod_1.z.string(),
    users_count: zod_1.z.number(),
    extensions_count: zod_1.z.number(),
    calls_24h: zod_1.z.number(),
    companies_count: zod_1.z.number(),
    contacts_count: zod_1.z.number(),
    status: zod_1.z.string()
});
//# sourceMappingURL=api.js.map