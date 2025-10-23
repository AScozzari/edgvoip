-- Add slug field to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug VARCHAR(50) UNIQUE;

-- Add companies field for multiple ragioni sociali
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS companies JSONB NOT NULL DEFAULT '[]';

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Update existing Demo Tenant with slug
UPDATE tenants SET slug = 'demo' WHERE name = 'Demo Tenant' AND slug IS NULL;

-- Make slug NOT NULL after setting default
ALTER TABLE tenants ALTER COLUMN slug SET NOT NULL;

-- Create super admin tenant (reserved slug 'edgvoip')
INSERT INTO tenants (id, name, slug, domain, sip_domain, status, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'EdgeVoIP Super Admin',
  'edgvoip',
  'edgvoip.admin.local',
  'edgvoip-admin.voip.local',
  'active',
  '{"is_super_admin_tenant": true, "max_concurrent_calls": 1000, "recording_enabled": true, "gdpr_compliant": true, "timezone": "Europe/Rome", "language": "it"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Add constraint to prevent 'edgvoip' slug for regular tenants
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS check_edgvoip_slug;
ALTER TABLE tenants ADD CONSTRAINT check_edgvoip_slug 
  CHECK (slug != 'edgvoip' OR settings->>'is_super_admin_tenant' = 'true');

-- Add comment for documentation
COMMENT ON COLUMN tenants.slug IS 'URL-friendly identifier for tenant routing (e.g., /demo/login)';
COMMENT ON COLUMN tenants.companies IS 'Array of company information (ragioni sociali) belonging to this tenant';

