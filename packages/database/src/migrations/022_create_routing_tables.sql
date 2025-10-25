-- Migration 022: Create Routing Tables
-- Inbound Routes, Outbound Routes, Time Conditions, Ring Groups, Queues, IVR Menus

-- ============================================================
-- INBOUND ROUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS inbound_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  did_number VARCHAR(20), -- DID number to match (e.g., 0591234567)
  caller_id_pattern VARCHAR(100), -- Regex for caller ID matching
  destination_type VARCHAR(50) NOT NULL CHECK (destination_type IN ('extension', 'ring_group', 'queue', 'voicemail', 'ivr', 'conference', 'external')),
  destination_value VARCHAR(200) NOT NULL, -- Extension number, ring group ID, external number, etc.
  time_condition_id UUID REFERENCES time_conditions(id) ON DELETE SET NULL,
  enabled BOOLEAN DEFAULT true,
  -- Caller ID Override
  caller_id_override BOOLEAN DEFAULT false,
  caller_id_name_override VARCHAR(100),
  caller_id_number_override VARCHAR(50),
  -- Recording
  record_calls BOOLEAN DEFAULT false,
  recording_path TEXT,
  -- Failover
  failover_enabled BOOLEAN DEFAULT false,
  failover_destination_type VARCHAR(50),
  failover_destination_value VARCHAR(200),
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_inbound_routes_tenant ON inbound_routes(tenant_id);
CREATE INDEX idx_inbound_routes_did ON inbound_routes(did_number) WHERE did_number IS NOT NULL;
CREATE INDEX idx_inbound_routes_enabled ON inbound_routes(enabled) WHERE enabled = true;

CREATE TRIGGER update_inbound_routes_updated_at 
  BEFORE UPDATE ON inbound_routes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- OUTBOUND ROUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS outbound_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  dial_pattern VARCHAR(50) NOT NULL, -- Regex pattern for matching dialed numbers (e.g., ^0[1-9]\d+$)
  caller_id_name VARCHAR(100),
  caller_id_number VARCHAR(50),
  trunk_id UUID NOT NULL REFERENCES sip_trunks(id) ON DELETE CASCADE,
  -- Number Manipulation
  prefix VARCHAR(20), -- Prefix to add to number
  strip_digits INT DEFAULT 0, -- Digits to strip from beginning
  add_digits VARCHAR(20), -- Digits to add to beginning after stripping
  -- Priority and Status
  priority INT DEFAULT 100, -- Lower = higher priority
  enabled BOOLEAN DEFAULT true,
  -- Caller ID Override
  caller_id_override BOOLEAN DEFAULT false,
  caller_id_name_override VARCHAR(100),
  caller_id_number_override VARCHAR(50),
  -- Recording
  record_calls BOOLEAN DEFAULT false,
  recording_path TEXT,
  -- Failover
  failover_trunk_id UUID REFERENCES sip_trunks(id) ON DELETE SET NULL,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_outbound_routes_tenant ON outbound_routes(tenant_id, priority);
CREATE INDEX idx_outbound_routes_trunk ON outbound_routes(trunk_id);
CREATE INDEX idx_outbound_routes_enabled ON outbound_routes(enabled) WHERE enabled = true;

CREATE TRIGGER update_outbound_routes_updated_at 
  BEFORE UPDATE ON outbound_routes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TIME CONDITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS time_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  -- Business Hours (JSONB)
  -- Format: { monday: { enabled: true, start_time: "09:00", end_time: "18:00" }, tuesday: {...}, ... }
  business_hours JSONB NOT NULL DEFAULT '{}',
  -- Holidays (JSONB Array)
  -- Format: [{ name: "Natale", date: "2025-12-25", enabled: true }, ...]
  holidays JSONB DEFAULT '[]',
  -- Actions
  business_hours_action VARCHAR(50) DEFAULT 'continue' CHECK (business_hours_action IN ('continue', 'voicemail', 'external', 'hangup')),
  business_hours_destination VARCHAR(200),
  after_hours_action VARCHAR(50) DEFAULT 'voicemail' CHECK (after_hours_action IN ('voicemail', 'external', 'hangup')),
  after_hours_destination VARCHAR(200),
  holiday_action VARCHAR(50) DEFAULT 'voicemail' CHECK (holiday_action IN ('voicemail', 'external', 'hangup')),
  holiday_destination VARCHAR(200),
  -- Status
  enabled BOOLEAN DEFAULT true,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_time_conditions_tenant ON time_conditions(tenant_id);
CREATE INDEX idx_time_conditions_enabled ON time_conditions(enabled) WHERE enabled = true;

CREATE TRIGGER update_time_conditions_updated_at 
  BEFORE UPDATE ON time_conditions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RING GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS ring_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  extension_number VARCHAR(10), -- Optional extension to dial this ring group (e.g., 2001)
  strategy VARCHAR(20) DEFAULT 'simultaneous' CHECK (strategy IN ('simultaneous', 'sequential', 'round_robin', 'random', 'longest_idle')),
  timeout INT DEFAULT 30, -- Timeout in seconds
  max_calls INT DEFAULT 10,
  -- Members (JSONB Array)
  -- Format: [{ extension_id: "uuid", extension_number: "1001", display_name: "John", priority: 1, enabled: true, delay: 0 }, ...]
  members JSONB NOT NULL DEFAULT '[]',
  -- Caller ID Override
  caller_id_override BOOLEAN DEFAULT false,
  caller_id_name_override VARCHAR(100),
  caller_id_number_override VARCHAR(50),
  -- Recording
  record_calls BOOLEAN DEFAULT false,
  recording_path TEXT,
  -- Failover
  failover_enabled BOOLEAN DEFAULT false,
  failover_destination_type VARCHAR(50),
  failover_destination_value VARCHAR(200),
  -- Time Conditions
  time_condition_id UUID REFERENCES time_conditions(id) ON DELETE SET NULL,
  -- Status
  enabled BOOLEAN DEFAULT true,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_ring_groups_tenant ON ring_groups(tenant_id);
CREATE INDEX idx_ring_groups_extension ON ring_groups(extension_number) WHERE extension_number IS NOT NULL;

CREATE TRIGGER update_ring_groups_updated_at 
  BEFORE UPDATE ON ring_groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- QUEUES (Call Center)
-- ============================================================
CREATE TABLE IF NOT EXISTS queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  extension_number VARCHAR(10), -- Extension to dial this queue (e.g., 3001)
  strategy VARCHAR(50) DEFAULT 'longest_idle' CHECK (strategy IN ('ring_all', 'longest_idle', 'round_robin', 'top_down', 'agent_with_least_calls', 'agent_with_fewest_calls', 'sequentially_by_agent_order', 'random')),
  timeout INT DEFAULT 30, -- Agent timeout in seconds
  max_calls INT DEFAULT 100,
  -- Queue Settings
  hold_music VARCHAR(100), -- Music on hold class
  announce_frequency INT DEFAULT 0, -- Seconds, 0 = no announcements
  announce_position BOOLEAN DEFAULT false,
  announce_hold_time BOOLEAN DEFAULT false,
  -- Agents (JSONB Array)
  -- Format: [{ extension_id: "uuid", extension_number: "1001", display_name: "Agent1", penalty: 0, enabled: true, max_calls: 1 }, ...]
  agents JSONB NOT NULL DEFAULT '[]',
  -- Caller ID Override
  caller_id_override BOOLEAN DEFAULT false,
  caller_id_name_override VARCHAR(100),
  caller_id_number_override VARCHAR(50),
  -- Recording
  record_calls BOOLEAN DEFAULT false,
  recording_path TEXT,
  -- Failover
  failover_enabled BOOLEAN DEFAULT false,
  failover_destination_type VARCHAR(50),
  failover_destination_value VARCHAR(200),
  -- Time Conditions
  time_condition_id UUID REFERENCES time_conditions(id) ON DELETE SET NULL,
  -- Status
  enabled BOOLEAN DEFAULT true,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_queues_tenant ON queues(tenant_id);
CREATE INDEX idx_queues_extension ON queues(extension_number) WHERE extension_number IS NOT NULL;

CREATE TRIGGER update_queues_updated_at 
  BEFORE UPDATE ON queues 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- IVR MENUS
-- ============================================================
CREATE TABLE IF NOT EXISTS ivr_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  -- Messages
  greeting_message TEXT, -- Text-to-speech or audio file path
  invalid_message TEXT,
  timeout_message TEXT,
  timeout_seconds INT DEFAULT 10,
  max_failures INT DEFAULT 3,
  -- Menu Options (JSONB Array)
  -- Format: [{ digit: "1", action: "extension", destination: "1001", description: "Sales" }, ...]
  options JSONB NOT NULL DEFAULT '[]',
  -- Default Action
  default_action VARCHAR(50) DEFAULT 'hangup' CHECK (default_action IN ('extension', 'ring_group', 'queue', 'voicemail', 'ivr', 'conference', 'external', 'hangup')),
  default_destination VARCHAR(200),
  -- Caller ID Override
  caller_id_override BOOLEAN DEFAULT false,
  caller_id_name_override VARCHAR(100),
  caller_id_number_override VARCHAR(50),
  -- Recording
  record_calls BOOLEAN DEFAULT false,
  recording_path TEXT,
  -- Status
  enabled BOOLEAN DEFAULT true,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_ivr_menus_tenant ON ivr_menus(tenant_id);

CREATE TRIGGER update_ivr_menus_updated_at 
  BEFORE UPDATE ON ivr_menus 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commenti per documentazione
COMMENT ON TABLE inbound_routes IS 'Inbound call routing rules (DID → destination)';
COMMENT ON TABLE outbound_routes IS 'Outbound call routing rules (pattern → trunk)';
COMMENT ON TABLE time_conditions IS 'Business hours and holiday schedules';
COMMENT ON TABLE ring_groups IS 'Ring groups for simultaneous/sequential ringing';
COMMENT ON TABLE queues IS 'Call center queues with agents';
COMMENT ON TABLE ivr_menus IS 'Interactive Voice Response menus';

