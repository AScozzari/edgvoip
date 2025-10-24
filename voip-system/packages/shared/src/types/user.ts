import { z } from 'zod';

// User roles hierarchy
export const UserRoleSchema = z.enum([
  'super_admin',    // System administrator - can manage all tenants
  'tenant_admin',   // Tenant administrator - can manage everything within their tenant
  'tenant_user'     // Regular user - limited access within tenant
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

// User permissions based on role
export const UserPermissionsSchema = z.object({
  // Super Admin permissions
  can_create_tenants: z.boolean().default(false),
  can_delete_tenants: z.boolean().default(false),
  can_manage_system_settings: z.boolean().default(false),
  can_view_all_tenants: z.boolean().default(false),
  
  // Tenant Admin permissions
  can_manage_tenant_settings: z.boolean().default(false),
  can_create_stores: z.boolean().default(false),
  can_manage_stores: z.boolean().default(false),
  can_create_trunks: z.boolean().default(false),
  can_manage_trunks: z.boolean().default(false),
  can_create_extensions: z.boolean().default(false),
  can_manage_extensions: z.boolean().default(false),
  can_view_cdr: z.boolean().default(false),
  can_manage_users: z.boolean().default(false),
  
  // Tenant User permissions
  can_view_own_extensions: z.boolean().default(false),
  can_make_calls: z.boolean().default(false),
  can_view_own_cdr: z.boolean().default(false),
  can_manage_own_settings: z.boolean().default(false)
});

export type UserPermissions = z.infer<typeof UserPermissionsSchema>;

// User schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: UserRoleSchema,
  tenant_id: z.string().uuid().optional(), // null for super_admin
  status: z.enum(['active', 'inactive', 'suspended']),
  created_at: z.date(),
  updated_at: z.date(),
  last_login: z.date().optional(),
  permissions: UserPermissionsSchema
});

export type User = z.infer<typeof UserSchema>;

// Helper function to get permissions based on role
export function getPermissionsForRole(role: UserRole): UserPermissions {
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

