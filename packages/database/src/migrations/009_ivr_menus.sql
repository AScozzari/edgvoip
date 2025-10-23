-- IVR Menus table
CREATE TABLE IF NOT EXISTS ivr_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  extension VARCHAR(10) NOT NULL UNIQUE,
  greeting_sound VARCHAR(255), -- Sound file path
  invalid_sound VARCHAR(255), -- Sound file for invalid input
  exit_sound VARCHAR(255), -- Sound file for exit
  timeout INTEGER NOT NULL DEFAULT 10, -- Timeout in seconds
  max_failures INTEGER NOT NULL DEFAULT 3, -- Max invalid attempts
  timeout_action JSONB NOT NULL DEFAULT '{"type": "hangup", "destination": ""}'::jsonb,
  invalid_action JSONB NOT NULL DEFAULT '{"type": "hangup", "destination": ""}'::jsonb,
  options JSONB NOT NULL DEFAULT '{}'::jsonb, -- DTMF options mapping
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ivr_menus_tenant_id ON ivr_menus(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ivr_menus_extension ON ivr_menus(extension);
CREATE INDEX IF NOT EXISTS idx_ivr_menus_enabled ON ivr_menus(enabled);

-- RLS Policy for ivr_menus
ALTER TABLE ivr_menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ivr_menus_tenant_isolation_policy ON ivr_menus;
CREATE POLICY ivr_menus_tenant_isolation_policy ON ivr_menus
FOR ALL
USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Trigger to update updated_at column
CREATE TRIGGER update_ivr_menus_updated_at BEFORE UPDATE ON ivr_menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
