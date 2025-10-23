-- Update master tenant slug from 'edgvoip' to 'edg-voip'
-- and adjust constraint to reserve 'edg-voip' for the master tenant

-- Update existing master tenant if present
UPDATE tenants
SET slug = 'edg-voip'
WHERE (slug = 'edgvoip' OR domain = 'edgvoip.admin.local')
  AND (settings->>'is_super_admin_tenant')::boolean IS TRUE;

-- Relax and recreate constraint guarding the reserved master slug
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS check_edgvoip_slug;
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS check_edg_voip_slug;

ALTER TABLE tenants ADD CONSTRAINT check_edg_voip_slug
  CHECK (slug != 'edg-voip' OR settings->>'is_super_admin_tenant' = 'true');

-- Ensure unique index continues to exist for slug lookups
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Comment for documentation
COMMENT ON CONSTRAINT check_edg_voip_slug ON tenants IS 'Reserve slug edg-voip for the master super admin tenant';


