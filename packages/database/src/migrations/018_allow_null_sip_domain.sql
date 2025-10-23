-- Allow NULL sip_domain for super admin tenants
-- Super admin tenants (like edg-voip) don't need a SIP domain as they only manage other tenants

-- Remove UNIQUE constraint first (will recreate as partial unique below)
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_sip_domain_key;

-- Change column to allow NULL
ALTER TABLE tenants ALTER COLUMN sip_domain DROP NOT NULL;

-- Add partial UNIQUE constraint (only for non-NULL values)
-- This allows multiple NULL sip_domains but ensures unique values when set
CREATE UNIQUE INDEX IF NOT EXISTS tenants_sip_domain_unique_idx 
ON tenants (sip_domain) 
WHERE sip_domain IS NOT NULL;
