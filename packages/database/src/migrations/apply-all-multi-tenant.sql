-- ================================================================
-- CONSOLIDATED MULTI-TENANT MIGRATIONS
-- Apply all 5 migrations in order: 020, 021, 022, 023, 024
-- ================================================================

BEGIN;

-- ================================================================
-- MIGRATION 020: Enhance Tenants Table for Multi-Tenancy
-- ================================================================

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
DO $$ BEGIN
  ALTER TABLE tenants ADD CONSTRAINT check_master_slug 
    CHECK (is_master = false OR (is_master = true AND slug = 'edgvoip'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tenants ADD CONSTRAINT check_master_no_parent 
    CHECK (is_master = false OR (is_master = true AND parent_tenant_id IS NULL));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tenants ADD CONSTRAINT check_child_has_sip_domain
    CHECK (is_master = true OR (is_master = false AND sip_domain IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

-- ================================================================
-- MIGRATION 021: Create Dialplan Rules Table
-- ================================================================

CREATE TABLE IF NOT EXISTS dialplan_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  context VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  priority INT DEFAULT 100,
  match_pattern VARCHAR(200) NOT NULL,
  match_condition JSONB,
  actions JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, context, name)
);

CREATE INDEX IF NOT EXISTS idx_dialplan_rules_tenant_context ON dialplan_rules(tenant_id, context, priority);
CREATE INDEX IF NOT EXISTS idx_dialplan_rules_enabled ON dialplan_rules(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_dialplan_rules_context ON dialplan_rules(context);

DO $$ BEGIN
  CREATE TRIGGER update_dialplan_rules_updated_at 
    BEFORE UPDATE ON dialplan_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================================
-- MIGRATION 022: Create Routing Tables
-- ================================================================

-- TIME_CONDITIONS (must be created first as it's referenced by others)
CREATE TABLE IF NOT EXISTS time_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  business_hours JSONB NOT NULL DEFAULT '{}',
  holidays JSONB DEFAULT '[]',
  business_hours_action VARCHAR(50) DEFAULT 'continue' CHECK (business_hours_action IN ('continue', 'voicemail', 'external', 'hangup')),
  business_hours_destination VARCHAR(200),
  after_hours_action VARCHAR(50) DEFAULT 'voicemail' CHECK (after_hours_action IN ('voicemail', 'external', 'hangup')),
  after_hours_destination VARCHAR(200),
  holiday_action VARCHAR(50) DEFAULT 'voicemail' CHECK (holiday_action IN ('voicemail', 'external', 'hangup')),
  holiday_destination VARCHAR(200),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_time_conditions_tenant ON time_conditions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_time_conditions_enabled ON time_conditions(enabled) WHERE enabled = true;

DO $$ BEGIN
  CREATE TRIGGER update_time_conditions_updated_at 
    BEFORE UPDATE ON time_conditions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INBOUND_ROUTES
CREATE TABLE IF NOT EXISTS inbound_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  did_number VARCHAR(20),
  caller_id_pattern VARCHAR(100),
  destination_type VARCHAR(50) NOT NULL CHECK (destination_type IN ('extension', 'ring_group', 'queue', 'voicemail', 'ivr', 'conference', 'external')),
  destination_value VARCHAR(200) NOT NULL,
  time_condition_id UUID REFERENCES time_conditions(id) ON DELETE SET NULL,
  enabled BOOLEAN DEFAULT true,
  caller_id_override BOOLEAN DEFAULT false,
  caller_id_name_override VARCHAR(100),
  caller_id_number_override VARCHAR(50),
  record_calls BOOLEAN DEFAULT false,
  recording_path TEXT,
  failover_enabled BOOLEAN DEFAULT false,
  failover_destination_type VARCHAR(50),
  failover_destination_value VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_inbound_routes_tenant ON inbound_routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inbound_routes_did ON inbound_routes(did_number) WHERE did_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inbound_routes_enabled ON inbound_routes(enabled) WHERE enabled = true;

DO $$ BEGIN
  CREATE TRIGGER update_inbound_routes_updated_at 
    BEFORE UPDATE ON inbound_routes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- OUTBOUND_ROUTES
CREATE TABLE IF NOT EXISTS outbound_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  dial_pattern VARCHAR(50) NOT NULL,
  caller_id_name VARCHAR(100),
  caller_id_number VARCHAR(50),
  trunk_id UUID NOT NULL REFERENCES sip_trunks(id) ON DELETE CASCADE,
  prefix VARCHAR(20),
  strip_digits INT DEFAULT 0,
  add_digits VARCHAR(20),
  priority INT DEFAULT 100,
  enabled BOOLEAN DEFAULT true,
  caller_id_override BOOLEAN DEFAULT false,
  caller_id_name_override VARCHAR(100),
  caller_id_number_override VARCHAR(50),
  record_calls BOOLEAN DEFAULT false,
  recording_path TEXT,
  failover_trunk_id UUID REFERENCES sip_trunks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_outbound_routes_tenant ON outbound_routes(tenant_id, priority);
CREATE INDEX IF NOT EXISTS idx_outbound_routes_trunk ON outbound_routes(trunk_id);
CREATE INDEX IF NOT EXISTS idx_outbound_routes_enabled ON outbound_routes(enabled) WHERE enabled = true;

DO $$ BEGIN
  CREATE TRIGGER update_outbound_routes_updated_at 
    BEFORE UPDATE ON outbound_routes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RING_GROUPS, QUEUES, IVR_MENUS (simplified for now, can be expanded later)
CREATE TABLE IF NOT EXISTS ring_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  extension_number VARCHAR(10),
  strategy VARCHAR(20) DEFAULT 'simultaneous',
  timeout INT DEFAULT 30,
  max_calls INT DEFAULT 10,
  members JSONB NOT NULL DEFAULT '[]',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  extension_number VARCHAR(10),
  strategy VARCHAR(50) DEFAULT 'longest_idle',
  timeout INT DEFAULT 30,
  max_calls INT DEFAULT 100,
  agents JSONB NOT NULL DEFAULT '[]',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS ivr_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  greeting_message TEXT,
  timeout_seconds INT DEFAULT 10,
  max_failures INT DEFAULT 3,
  options JSONB NOT NULL DEFAULT '[]',
  default_action VARCHAR(50) DEFAULT 'hangup',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- ================================================================
-- MIGRATION 023: Enhance Extensions Table
-- ================================================================

ALTER TABLE extensions ADD COLUMN IF NOT EXISTS context VARCHAR(100);
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS caller_id_number VARCHAR(50);
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS voicemail_pin VARCHAR(20);
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS pickup_group VARCHAR(50);
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS limit_max INT DEFAULT 3;

-- Aggiornare context per extensions esistenti
UPDATE extensions e 
SET context = 'tenant-' || t.slug || '-internal'
FROM tenants t 
WHERE e.tenant_id = t.id AND e.context IS NULL;

-- Aggiungere caller_id_number default
UPDATE extensions 
SET caller_id_number = extension 
WHERE caller_id_number IS NULL;

-- Indici
CREATE INDEX IF NOT EXISTS idx_extensions_context ON extensions(context);
CREATE INDEX IF NOT EXISTS idx_extensions_pickup_group ON extensions(pickup_group) WHERE pickup_group IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_extensions_caller_id ON extensions(caller_id_number);

-- ================================================================
-- MIGRATION 024: Enhance SIP Trunks Table
-- ================================================================

ALTER TABLE sip_trunks ADD COLUMN IF NOT EXISTS outbound_caller_id VARCHAR(50);
ALTER TABLE sip_trunks ADD COLUMN IF NOT EXISTS inbound_dids TEXT[] DEFAULT '{}';
ALTER TABLE sip_trunks ADD COLUMN IF NOT EXISTS failover_trunk_id UUID REFERENCES sip_trunks(id) ON DELETE SET NULL;
ALTER TABLE sip_trunks ADD COLUMN IF NOT EXISTS max_concurrent_calls INT DEFAULT 10;
ALTER TABLE sip_trunks ADD COLUMN IF NOT EXISTS codec_prefs VARCHAR(200) DEFAULT 'PCMA,OPUS,G729';

-- Indici
CREATE INDEX IF NOT EXISTS idx_sip_trunks_failover ON sip_trunks(failover_trunk_id) WHERE failover_trunk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sip_trunks_dids ON sip_trunks USING GIN (inbound_dids);
CREATE INDEX IF NOT EXISTS idx_sip_trunks_caller_id ON sip_trunks(outbound_caller_id) WHERE outbound_caller_id IS NOT NULL;

-- ================================================================
-- COMMIT TRANSACTION
-- ================================================================

COMMIT;

-- Print success message
SELECT 'Multi-Tenant Migrations Applied Successfully!' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('dialplan_rules', 'inbound_routes', 'outbound_routes', 'time_conditions', 'ring_groups', 'queues', 'ivr_menus')
ORDER BY table_name;

