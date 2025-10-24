-- Conference Rooms table
CREATE TABLE IF NOT EXISTS conference_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  extension VARCHAR(10) NOT NULL UNIQUE,
  pin VARCHAR(20), -- Conference PIN for participants
  moderator_pin VARCHAR(20), -- Conference PIN for moderators
  max_members INTEGER NOT NULL DEFAULT 50,
  record BOOLEAN NOT NULL DEFAULT false,
  record_path VARCHAR(255), -- Recording file path
  moh_sound VARCHAR(255), -- Music on Hold sound
  announce_sound VARCHAR(255), -- Sound to play when member joins/leaves
  settings JSONB NOT NULL DEFAULT '{}'::jsonb, -- Additional conference settings
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conference Members table (for tracking active participants)
CREATE TABLE IF NOT EXISTS conference_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conference_rooms(id) ON DELETE CASCADE,
  extension VARCHAR(10) NOT NULL,
  caller_id_name VARCHAR(100),
  caller_id_number VARCHAR(20),
  join_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  leave_time TIMESTAMP WITH TIME ZONE,
  is_moderator BOOLEAN NOT NULL DEFAULT false,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  is_deaf BOOLEAN NOT NULL DEFAULT false,
  member_flags VARCHAR(100), -- FreeSWITCH member flags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for conference_rooms
CREATE INDEX IF NOT EXISTS idx_conference_rooms_tenant_id ON conference_rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conference_rooms_extension ON conference_rooms(extension);
CREATE INDEX IF NOT EXISTS idx_conference_rooms_enabled ON conference_rooms(enabled);

-- Indexes for conference_members
CREATE INDEX IF NOT EXISTS idx_conference_members_conference_id ON conference_members(conference_id);
CREATE INDEX IF NOT EXISTS idx_conference_members_extension ON conference_members(extension);
CREATE INDEX IF NOT EXISTS idx_conference_members_join_time ON conference_members(join_time);

-- RLS Policies
ALTER TABLE conference_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_members ENABLE ROW LEVEL SECURITY;

-- Conference rooms RLS policy
DROP POLICY IF EXISTS conference_rooms_tenant_isolation_policy ON conference_rooms;
CREATE POLICY conference_rooms_tenant_isolation_policy ON conference_rooms
FOR ALL
USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Conference members RLS policy (inherits from conference_rooms)
DROP POLICY IF EXISTS conference_members_tenant_isolation_policy ON conference_members;
CREATE POLICY conference_members_tenant_isolation_policy ON conference_members
FOR ALL
USING (conference_id IN (
  SELECT id FROM conference_rooms 
  WHERE tenant_id = current_setting('app.tenant_id')::uuid
));

-- Triggers to update updated_at column
CREATE TRIGGER update_conference_rooms_updated_at BEFORE UPDATE ON conference_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
