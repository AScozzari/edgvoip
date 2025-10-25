-- Migration 021: Create Dialplan Rules Table
-- Store FreeSWITCH dialplan rules dynamically per tenant and context

CREATE TABLE IF NOT EXISTS dialplan_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  context VARCHAR(100) NOT NULL, -- tenant-{slug}-internal|outbound|external|features|voicemail|emergency
  name VARCHAR(100) NOT NULL,
  description TEXT,
  priority INT DEFAULT 100,
  match_pattern VARCHAR(200) NOT NULL, -- regex pattern for destination_number
  match_condition JSONB, -- { caller_id: {...}, time: {...}, DID: {...}, source_ip: [...], etc. }
  actions JSONB NOT NULL, -- [{ type: 'bridge', target: 'user/$1@${domain_name}' }, { type: 'hangup', cause: 'NORMAL_CLEARING' }]
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, context, name)
);

-- Indici per query performance
CREATE INDEX idx_dialplan_rules_tenant_context ON dialplan_rules(tenant_id, context, priority);
CREATE INDEX idx_dialplan_rules_enabled ON dialplan_rules(enabled) WHERE enabled = true;
CREATE INDEX idx_dialplan_rules_context ON dialplan_rules(context);

-- Trigger per updated_at automatico
CREATE TRIGGER update_dialplan_rules_updated_at 
  BEFORE UPDATE ON dialplan_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commenti per documentazione
COMMENT ON TABLE dialplan_rules IS 'Dynamic FreeSWITCH dialplan rules per tenant and context';
COMMENT ON COLUMN dialplan_rules.context IS 'FreeSWITCH dialplan context (e.g., tenant-demo-internal)';
COMMENT ON COLUMN dialplan_rules.match_pattern IS 'Regex pattern for destination_number matching';
COMMENT ON COLUMN dialplan_rules.match_condition IS 'Additional matching conditions (caller_id, time, DID, etc.)';
COMMENT ON COLUMN dialplan_rules.actions IS 'Array of actions to execute on match (bridge, transfer, hangup, etc.)';
COMMENT ON COLUMN dialplan_rules.priority IS 'Lower number = higher priority (processed first)';

