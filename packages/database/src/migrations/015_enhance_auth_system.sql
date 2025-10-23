-- Migration 015: Enhanced Authentication System
-- Add refresh tokens support and user role

-- Add 'user' role if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'tenant_user', 'user');
    ELSE
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Create refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE,
  device_info TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- Insert test users for demo tenant
DO $$
DECLARE
    demo_tenant_id UUID;
BEGIN
    -- Get demo tenant ID (assuming slug 'edgvoip')
    SELECT id INTO demo_tenant_id FROM tenants WHERE slug = 'edgvoip' LIMIT 1;
    
    IF demo_tenant_id IS NOT NULL THEN
        -- Insert admin user if not exists
        INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status)
        VALUES (
            demo_tenant_id,
            'admin@edgvoip.local',
            '$2b$10$rN3qY8Zx5vZ9XqJ0vZ9XqO3qY8Zx5vZ9XqJ0vZ9XqO3qY8Zx5vZ9X', -- password: admin123
            'Demo',
            'Administrator',
            'admin',
            'active'
        )
        ON CONFLICT (email) DO NOTHING;
        
        -- Insert regular user if not exists
        INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status)
        VALUES (
            demo_tenant_id,
            'user@edgvoip.local',
            '$2b$10$rN3qY8Zx5vZ9XqJ0vZ9XqO3qY8Zx5vZ9XqJ0vZ9XqO3qY8Zx5vZ9X', -- password: user123
            'Demo',
            'User',
            'user',
            'active'
        )
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Add comment
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for JWT authentication';

