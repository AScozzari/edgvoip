"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = exports.UserPermissionsSchema = exports.UserRoleSchema = void 0;
exports.getPermissionsForRole = getPermissionsForRole;
const zod_1 = require("zod");
// User roles hierarchy
exports.UserRoleSchema = zod_1.z.enum([
    'super_admin', // System administrator - can manage all tenants
    'tenant_admin', // Tenant administrator - can manage everything within their tenant
    'tenant_user' // Regular user - limited access within tenant
]);
// User permissions based on role
exports.UserPermissionsSchema = zod_1.z.object({
    // Super Admin permissions
    can_create_tenants: zod_1.z.boolean().default(false),
    can_delete_tenants: zod_1.z.boolean().default(false),
    can_manage_system_settings: zod_1.z.boolean().default(false),
    can_view_all_tenants: zod_1.z.boolean().default(false),
    // Tenant Admin permissions
    can_manage_tenant_settings: zod_1.z.boolean().default(false),
    can_create_stores: zod_1.z.boolean().default(false),
    can_manage_stores: zod_1.z.boolean().default(false),
    can_create_trunks: zod_1.z.boolean().default(false),
    can_manage_trunks: zod_1.z.boolean().default(false),
    can_create_extensions: zod_1.z.boolean().default(false),
    can_manage_extensions: zod_1.z.boolean().default(false),
    can_view_cdr: zod_1.z.boolean().default(false),
    can_manage_users: zod_1.z.boolean().default(false),
    // Tenant User permissions
    can_view_own_extensions: zod_1.z.boolean().default(false),
    can_make_calls: zod_1.z.boolean().default(false),
    can_view_own_cdr: zod_1.z.boolean().default(false),
    can_manage_own_settings: zod_1.z.boolean().default(false)
});
// User schema
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1).max(100),
    role: exports.UserRoleSchema,
    tenant_id: zod_1.z.string().uuid().optional(), // null for super_admin
    status: zod_1.z.enum(['active', 'inactive', 'suspended']),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    last_login: zod_1.z.date().optional(),
    permissions: exports.UserPermissionsSchema
});
// Helper function to get permissions based on role
function getPermissionsForRole(role) {
    switch (role) {
        case 'super_admin':
            return {
                can_create_tenants: true,
                can_delete_tenants: true,
                can_manage_system_settings: true,
                can_view_all_tenants: true,
                can_manage_tenant_settings: false,
                can_create_stores: false,
                can_manage_stores: false,
                can_create_trunks: false,
                can_manage_trunks: false,
                can_create_extensions: false,
                can_manage_extensions: false,
                can_view_cdr: false,
                can_manage_users: false,
                can_view_own_extensions: false,
                can_make_calls: false,
                can_view_own_cdr: false,
                can_manage_own_settings: false
            };
        case 'tenant_admin':
            return {
                can_create_tenants: false,
                can_delete_tenants: false,
                can_manage_system_settings: false,
                can_view_all_tenants: false,
                can_manage_tenant_settings: true,
                can_create_stores: true,
                can_manage_stores: true,
                can_create_trunks: true,
                can_manage_trunks: true,
                can_create_extensions: true,
                can_manage_extensions: true,
                can_view_cdr: true,
                can_manage_users: true,
                can_view_own_extensions: true,
                can_make_calls: true,
                can_view_own_cdr: true,
                can_manage_own_settings: true
            };
        case 'tenant_user':
            return {
                can_create_tenants: false,
                can_delete_tenants: false,
                can_manage_system_settings: false,
                can_view_all_tenants: false,
                can_manage_tenant_settings: false,
                can_create_stores: false,
                can_manage_stores: false,
                can_create_trunks: false,
                can_manage_trunks: false,
                can_create_extensions: false,
                can_manage_extensions: false,
                can_view_cdr: false,
                can_manage_users: false,
                can_view_own_extensions: true,
                can_make_calls: true,
                can_view_own_cdr: true,
                can_manage_own_settings: true
            };
        default:
            return {
                can_create_tenants: false,
                can_delete_tenants: false,
                can_manage_system_settings: false,
                can_view_all_tenants: false,
                can_manage_tenant_settings: false,
                can_create_stores: false,
                can_manage_stores: false,
                can_create_trunks: false,
                can_manage_trunks: false,
                can_create_extensions: false,
                can_manage_extensions: false,
                can_view_cdr: false,
                can_manage_users: false,
                can_view_own_extensions: false,
                can_make_calls: false,
                can_view_own_cdr: false,
                can_manage_own_settings: false
            };
    }
}
//# sourceMappingURL=user.js.map