-- Ensure master tenant slug is 'edgvoip' (uniform across all system)
-- and adjust constraint to reserve 'edgvoip' for the master tenant

-- Update existing master tenant if present (from any variant to 'edgvoip')
UPDATE tenants
SET slug = 'edgvoip'
WHERE (slug IN ('edgvoip', 'edg-voip') OR domain = 'edgvoip.admin.local')
  AND (settings->>'is_super_admin_tenant')::boolean IS TRUE;

-- Relax and recreate constraint guarding the reserved master slug
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS check_edgvoip_slug;
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS check_edg_voip_slug;

ALTER TABLE tenants ADD CONSTRAINT check_edgvoip_slug
  CHECK (slug != 'edgvoip' OR settings->>'is_super_admin_tenant' = 'true');

-- Ensure unique index continues to exist for slug lookups
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Comment for documentation
COMMENT ON CONSTRAINT check_edgvoip_slug ON tenants IS 'Reserve slug edgvoip for the master super admin tenant';


