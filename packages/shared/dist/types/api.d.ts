import { z } from 'zod';
export declare const ApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: any;
    }, {
        code: string;
        message: string;
        details?: any;
    }>>;
    meta: z.ZodObject<{
        timestamp: z.ZodDate;
        request_id: z.ZodString;
        tenant_id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: Date;
        request_id: string;
        tenant_id?: string | undefined;
    }, {
        timestamp: Date;
        request_id: string;
        tenant_id?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    meta: {
        timestamp: Date;
        request_id: string;
        tenant_id?: string | undefined;
    };
    data?: any;
    error?: {
        code: string;
        message: string;
        details?: any;
    } | undefined;
}, {
    success: boolean;
    meta: {
        timestamp: Date;
        request_id: string;
        tenant_id?: string | undefined;
    };
    data?: any;
    error?: {
        code: string;
        message: string;
        details?: any;
    } | undefined;
}>;
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
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    total: z.ZodNumber;
    total_pages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}, {
    total: number;
    total_pages: number;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type Pagination = z.infer<typeof PaginationSchema>;
export declare const JWTPayloadSchema: z.ZodObject<{
    sub: z.ZodString;
    tenant_id: z.ZodOptional<z.ZodString>;
    store_id: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["super_admin", "tenant_admin", "admin", "manager", "user"]>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    is_master_tenant: z.ZodOptional<z.ZodBoolean>;
    iat: z.ZodNumber;
    exp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sub: string;
    role: "user" | "super_admin" | "tenant_admin" | "admin" | "manager";
    iat: number;
    exp: number;
    tenant_id?: string | undefined;
    store_id?: string | undefined;
    permissions?: string[] | undefined;
    is_master_tenant?: boolean | undefined;
}, {
    sub: string;
    role: "user" | "super_admin" | "tenant_admin" | "admin" | "manager";
    iat: number;
    exp: number;
    tenant_id?: string | undefined;
    store_id?: string | undefined;
    permissions?: string[] | undefined;
    is_master_tenant?: boolean | undefined;
}>;
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;
export declare const CompanySchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    legal_name: z.ZodString;
    vat_number: z.ZodOptional<z.ZodString>;
    tax_code: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    postal_code: z.ZodOptional<z.ZodString>;
    country: z.ZodDefault<z.ZodString>;
    is_primary: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: Date;
    updated_at: Date;
    tenant_id: string;
    legal_name: string;
    country: string;
    is_primary: boolean;
    state?: string | undefined;
    vat_number?: string | undefined;
    tax_code?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    postal_code?: string | undefined;
}, {
    id: string;
    created_at: Date;
    updated_at: Date;
    tenant_id: string;
    legal_name: string;
    state?: string | undefined;
    vat_number?: string | undefined;
    tax_code?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    postal_code?: string | undefined;
    country?: string | undefined;
    is_primary?: boolean | undefined;
}>;
export type Company = z.infer<typeof CompanySchema>;
export declare const TenantContactSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    company_id: z.ZodOptional<z.ZodString>;
    first_name: z.ZodString;
    last_name: z.ZodString;
    role: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    mobile: z.ZodOptional<z.ZodString>;
    is_primary: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: Date;
    updated_at: Date;
    tenant_id: string;
    is_primary: boolean;
    first_name: string;
    last_name: string;
    role?: string | undefined;
    company_id?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    mobile?: string | undefined;
}, {
    id: string;
    created_at: Date;
    updated_at: Date;
    tenant_id: string;
    first_name: string;
    last_name: string;
    role?: string | undefined;
    is_primary?: boolean | undefined;
    company_id?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    mobile?: string | undefined;
}>;
export type TenantContact = z.infer<typeof TenantContactSchema>;
export declare const AdminUserSchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["tenant_admin", "super_admin"]>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    role: "super_admin" | "tenant_admin";
    first_name: string;
    last_name: string;
    email: string;
}, {
    password: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: "super_admin" | "tenant_admin" | undefined;
}>;
export type AdminUser = z.infer<typeof AdminUserSchema>;
export declare const CreateTenantRequestSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    domain: z.ZodString;
    sip_domain: z.ZodString;
    admin_user: z.ZodObject<{
        first_name: z.ZodString;
        last_name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        role: z.ZodDefault<z.ZodEnum<["tenant_admin", "super_admin"]>>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        role: "super_admin" | "tenant_admin";
        first_name: string;
        last_name: string;
        email: string;
    }, {
        password: string;
        first_name: string;
        last_name: string;
        email: string;
        role?: "super_admin" | "tenant_admin" | undefined;
    }>;
    companies: z.ZodArray<z.ZodObject<Omit<{
        id: z.ZodString;
        tenant_id: z.ZodString;
        legal_name: z.ZodString;
        vat_number: z.ZodOptional<z.ZodString>;
        tax_code: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        postal_code: z.ZodOptional<z.ZodString>;
        country: z.ZodDefault<z.ZodString>;
        is_primary: z.ZodDefault<z.ZodBoolean>;
        created_at: z.ZodDate;
        updated_at: z.ZodDate;
    }, "id" | "created_at" | "updated_at" | "tenant_id">, "strip", z.ZodTypeAny, {
        legal_name: string;
        country: string;
        is_primary: boolean;
        state?: string | undefined;
        vat_number?: string | undefined;
        tax_code?: string | undefined;
        address?: string | undefined;
        city?: string | undefined;
        postal_code?: string | undefined;
    }, {
        legal_name: string;
        state?: string | undefined;
        vat_number?: string | undefined;
        tax_code?: string | undefined;
        address?: string | undefined;
        city?: string | undefined;
        postal_code?: string | undefined;
        country?: string | undefined;
        is_primary?: boolean | undefined;
    }>, "many">;
    contacts: z.ZodArray<z.ZodObject<Omit<{
        id: z.ZodString;
        tenant_id: z.ZodString;
        company_id: z.ZodOptional<z.ZodString>;
        first_name: z.ZodString;
        last_name: z.ZodString;
        role: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        mobile: z.ZodOptional<z.ZodString>;
        is_primary: z.ZodDefault<z.ZodBoolean>;
        created_at: z.ZodDate;
        updated_at: z.ZodDate;
    }, "id" | "created_at" | "updated_at" | "tenant_id">, "strip", z.ZodTypeAny, {
        is_primary: boolean;
        first_name: string;
        last_name: string;
        role?: string | undefined;
        company_id?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        mobile?: string | undefined;
    }, {
        first_name: string;
        last_name: string;
        role?: string | undefined;
        is_primary?: boolean | undefined;
        company_id?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        mobile?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    domain: string;
    sip_domain: string;
    slug: string;
    admin_user: {
        password: string;
        role: "super_admin" | "tenant_admin";
        first_name: string;
        last_name: string;
        email: string;
    };
    companies: {
        legal_name: string;
        country: string;
        is_primary: boolean;
        state?: string | undefined;
        vat_number?: string | undefined;
        tax_code?: string | undefined;
        address?: string | undefined;
        city?: string | undefined;
        postal_code?: string | undefined;
    }[];
    contacts: {
        is_primary: boolean;
        first_name: string;
        last_name: string;
        role?: string | undefined;
        company_id?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        mobile?: string | undefined;
    }[];
}, {
    name: string;
    domain: string;
    sip_domain: string;
    slug: string;
    admin_user: {
        password: string;
        first_name: string;
        last_name: string;
        email: string;
        role?: "super_admin" | "tenant_admin" | undefined;
    };
    companies: {
        legal_name: string;
        state?: string | undefined;
        vat_number?: string | undefined;
        tax_code?: string | undefined;
        address?: string | undefined;
        city?: string | undefined;
        postal_code?: string | undefined;
        country?: string | undefined;
        is_primary?: boolean | undefined;
    }[];
    contacts: {
        first_name: string;
        last_name: string;
        role?: string | undefined;
        is_primary?: boolean | undefined;
        company_id?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        mobile?: string | undefined;
    }[];
}>;
export type CreateTenantRequest = z.infer<typeof CreateTenantRequestSchema>;
export declare const CrossTenantStatsSchema: z.ZodObject<{
    total_tenants: z.ZodNumber;
    total_users: z.ZodNumber;
    total_extensions: z.ZodNumber;
    total_calls_24h: z.ZodNumber;
    active_tenants: z.ZodNumber;
    inactive_tenants: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total_tenants: number;
    total_users: number;
    total_extensions: number;
    total_calls_24h: number;
    active_tenants: number;
    inactive_tenants: number;
}, {
    total_tenants: number;
    total_users: number;
    total_extensions: number;
    total_calls_24h: number;
    active_tenants: number;
    inactive_tenants: number;
}>;
export type CrossTenantStats = z.infer<typeof CrossTenantStatsSchema>;
export declare const TenantStatsSchema: z.ZodObject<{
    tenant_id: z.ZodString;
    tenant_name: z.ZodString;
    tenant_slug: z.ZodString;
    users_count: z.ZodNumber;
    extensions_count: z.ZodNumber;
    calls_24h: z.ZodNumber;
    companies_count: z.ZodNumber;
    contacts_count: z.ZodNumber;
    status: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string;
    users_count: number;
    extensions_count: number;
    calls_24h: number;
    companies_count: number;
    contacts_count: number;
}, {
    status: string;
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string;
    users_count: number;
    extensions_count: number;
    calls_24h: number;
    companies_count: number;
    contacts_count: number;
}>;
export type TenantStats = z.infer<typeof TenantStatsSchema>;
//# sourceMappingURL=api.d.ts.map