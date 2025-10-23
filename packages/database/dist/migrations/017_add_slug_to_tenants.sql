-- Migration 017: Add slug column to tenants table
-- For URL-friendly tenant identification

-- Add slug column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Create index for slug
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Update existing tenants with slug based on name
UPDATE tenants SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '_', '-')) WHERE slug IS NULL;

-- Make slug NOT NULL after updating existing records
ALTER TABLE tenants ALTER COLUMN slug SET NOT NULL;
