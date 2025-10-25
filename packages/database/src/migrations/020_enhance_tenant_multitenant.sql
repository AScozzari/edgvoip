-- Migration 020: Enhance Tenants Table for Multi-Tenancy
-- Add support for master/child tenant hierarchy and FreeSWITCH contexts

-- Aggiungere colonne per gerarchia e multi-tenancy
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS context_prefix VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Europe/Rome';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'it';

-- Aggiornare context_prefix per tenant esistenti
UPDATE tenants SET context_prefix = 'tenant-' || slug WHERE context_prefix IS NULL;

-- Rendere context_prefix NOT NULL
ALTER TABLE tenants ALTER COLUMN context_prefix SET NOT NULL;

-- Identificare master tenant (edgvoip)
UPDATE tenants SET is_master = true WHERE slug = 'edgvoip';

-- Constraints per garantire integrità master/child
ALTER TABLE tenants ADD CONSTRAINT check_master_slug 
  CHECK (is_master = false OR (is_master = true AND slug = 'edgvoip'));

ALTER TABLE tenants ADD CONSTRAINT check_master_no_parent 
  CHECK (is_master = false OR (is_master = true AND parent_tenant_id IS NULL));

ALTER TABLE tenants ADD CONSTRAINT check_child_has_sip_domain
  CHECK (is_master = true OR (is_master = false AND sip_domain IS NOT NULL));

-- Aggiornare settings JSONB per includere nuovi campi
UPDATE tenants SET settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(settings, '{}'::jsonb),
      '{max_extensions}',
      '100'
    ),
    '{max_trunks}',
    '10'
  ),
  '{voicemail_directory}',
  to_jsonb('/var/lib/freeswitch/storage/' || slug || '/voicemail')
) WHERE settings IS NOT NULL OR settings IS NULL;

-- Assicurarsi che max_concurrent_calls sia presente
UPDATE tenants SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{max_concurrent_calls}',
  COALESCE(settings->'max_concurrent_calls', '20')
) WHERE settings->'max_concurrent_calls' IS NULL;

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_tenants_parent_id ON tenants(parent_tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_is_master ON tenants(is_master);
CREATE INDEX IF NOT EXISTS idx_tenants_context_prefix ON tenants(context_prefix);

-- Commenti per documentazione
COMMENT ON COLUMN tenants.context_prefix IS 'FreeSWITCH dialplan context prefix (e.g., tenant-demo)';
COMMENT ON COLUMN tenants.parent_tenant_id IS 'Parent tenant ID (NULL for master tenant)';
COMMENT ON COLUMN tenants.is_master IS 'True only for edgvoip master tenant';
COMMENT ON COLUMN tenants.timezone IS 'Timezone for time conditions and scheduling';
COMMENT ON COLUMN tenants.language IS 'Language for IVR prompts (it, en, es, fr)';

