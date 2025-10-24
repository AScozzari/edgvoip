-- Time Conditions table
CREATE TABLE IF NOT EXISTS time_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of time conditions
  action_true JSONB NOT NULL, -- Action to take when condition is true
  action_false JSONB NOT NULL, -- Action to take when condition is false
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_conditions_tenant_id ON time_conditions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_time_conditions_enabled ON time_conditions(enabled);

-- RLS Policy for time_conditions
ALTER TABLE time_conditions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS time_conditions_tenant_isolation_policy ON time_conditions;
CREATE POLICY time_conditions_tenant_isolation_policy ON time_conditions
FOR ALL
USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Trigger to update updated_at column
DROP TRIGGER IF EXISTS update_time_conditions_updated_at ON time_conditions;
CREATE TRIGGER update_time_conditions_updated_at BEFORE UPDATE ON time_conditions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
