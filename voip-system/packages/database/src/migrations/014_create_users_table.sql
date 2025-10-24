-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    settings JSONB NOT NULL DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create updated_at trigger
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert super admin user (password: superadmin123)
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'superadmin@edgvoip.local',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- superadmin123
  'Super',
  'Admin',
  'super_admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Insert demo tenant admin user (password: tenantadmin123)
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status)
SELECT 
  t.id,
  'tenantadmin@edgvoip.local',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- tenantadmin123
  'Tenant',
  'Admin',
  'tenant_admin',
  'active'
FROM tenants t 
WHERE t.slug = 'demo'
ON CONFLICT (email) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE users IS 'User authentication and authorization table with tenant isolation';
COMMENT ON COLUMN users.tenant_id IS 'Reference to tenant for data isolation';
COMMENT ON COLUMN users.role IS 'User role: super_admin (cross-tenant), tenant_admin (tenant admin), user (regular user)';
COMMENT ON COLUMN users.settings IS 'User-specific settings and preferences';
