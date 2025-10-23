-- Migration: Create Dialplan Routes and Routing System
-- Description: Create tables for inbound/outbound routes, time conditions, and routing logic

-- Create inbound_routes table
CREATE TABLE IF NOT EXISTS inbound_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    did_number VARCHAR(50),
    caller_id_pattern VARCHAR(100),
    destination_type VARCHAR(50) NOT NULL, -- 'extension', 'ring_group', 'queue', 'ivr', 'conference', 'voicemail'
    destination_id UUID,
    destination_data JSONB, -- Additional destination configuration
    time_condition_id UUID, -- Reference to time_conditions table
    priority INTEGER DEFAULT 100,
    enabled BOOLEAN DEFAULT true,
    failover_destination_type VARCHAR(50),
    failover_destination_id UUID,
    failover_destination_data JSONB,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create outbound_routes table
CREATE TABLE IF NOT EXISTS outbound_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    pattern VARCHAR(200) NOT NULL, -- Regex pattern for matching numbers
    caller_id_prefix VARCHAR(50),
    caller_id_number VARCHAR(50),
    trunk_priority JSONB DEFAULT '[]', -- Array of trunk priorities with failover
    least_cost_routing BOOLEAN DEFAULT false,
    time_condition_id UUID, -- Reference to time_conditions table
    priority INTEGER DEFAULT 100,
    enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create time_conditions table
CREATE TABLE IF NOT EXISTS time_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    time_groups JSONB NOT NULL DEFAULT '[]', -- Array of time groups with days/hours
    holidays JSONB DEFAULT '[]', -- Array of holiday dates
    timezone VARCHAR(50) DEFAULT 'UTC',
    match_destination_type VARCHAR(50) NOT NULL,
    match_destination_id UUID,
    match_destination_data JSONB,
    nomatch_destination_type VARCHAR(50) NOT NULL,
    nomatch_destination_id UUID,
    nomatch_destination_data JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dialplan_contexts table for advanced routing
CREATE TABLE IF NOT EXISTS dialplan_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    context_type VARCHAR(50) NOT NULL, -- 'internal', 'external', 'public', 'private'
    variables JSONB DEFAULT '{}',
    conditions JSONB DEFAULT '[]', -- Array of conditions and actions
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inbound_routes_tenant_id ON inbound_routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inbound_routes_did_number ON inbound_routes(did_number);
CREATE INDEX IF NOT EXISTS idx_inbound_routes_priority ON inbound_routes(priority);
CREATE INDEX IF NOT EXISTS idx_inbound_routes_enabled ON inbound_routes(enabled);

CREATE INDEX IF NOT EXISTS idx_outbound_routes_tenant_id ON outbound_routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_outbound_routes_pattern ON outbound_routes(pattern);
CREATE INDEX IF NOT EXISTS idx_outbound_routes_priority ON outbound_routes(priority);
CREATE INDEX IF NOT EXISTS idx_outbound_routes_enabled ON outbound_routes(enabled);

CREATE INDEX IF NOT EXISTS idx_time_conditions_tenant_id ON time_conditions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_time_conditions_enabled ON time_conditions(enabled);

CREATE INDEX IF NOT EXISTS idx_dialplan_contexts_tenant_id ON dialplan_contexts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dialplan_contexts_context_type ON dialplan_contexts(context_type);
CREATE INDEX IF NOT EXISTS idx_dialplan_contexts_enabled ON dialplan_contexts(enabled);

-- Create triggers for updated_at
CREATE TRIGGER update_inbound_routes_updated_at 
    BEFORE UPDATE ON inbound_routes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outbound_routes_updated_at 
    BEFORE UPDATE ON outbound_routes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_conditions_updated_at 
    BEFORE UPDATE ON time_conditions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dialplan_contexts_updated_at 
    BEFORE UPDATE ON dialplan_contexts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for all tables
ALTER TABLE inbound_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialplan_contexts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY inbound_routes_tenant_isolation_policy ON inbound_routes
    FOR ALL TO authenticated
    USING (tenant_id IN (
        SELECT t.id FROM tenants t 
        WHERE t.id = current_setting('app.current_tenant_id')::uuid
    ));

CREATE POLICY outbound_routes_tenant_isolation_policy ON outbound_routes
    FOR ALL TO authenticated
    USING (tenant_id IN (
        SELECT t.id FROM tenants t 
        WHERE t.id = current_setting('app.current_tenant_id')::uuid
    ));

CREATE POLICY time_conditions_tenant_isolation_policy ON time_conditions
    FOR ALL TO authenticated
    USING (tenant_id IN (
        SELECT t.id FROM tenants t 
        WHERE t.id = current_setting('app.current_tenant_id')::uuid
    ));

CREATE POLICY dialplan_contexts_tenant_isolation_policy ON dialplan_contexts
    FOR ALL TO authenticated
    USING (tenant_id IN (
        SELECT t.id FROM tenants t 
        WHERE t.id = current_setting('app.current_tenant_id')::uuid
    ));

-- Insert default time conditions
INSERT INTO time_conditions (id, tenant_id, name, description, time_groups, match_destination_type, match_destination_id, nomatch_destination_type, nomatch_destination_id) 
SELECT 
    gen_random_uuid(),
    t.id,
    'Business Hours',
    'Standard business hours (9 AM - 5 PM, Monday-Friday)',
    '[
        {
            "days": [1, 2, 3, 4, 5],
            "start_time": "09:00",
            "end_time": "17:00",
            "timezone": "UTC"
        }
    ]'::jsonb,
    'extension',
    NULL,
    'voicemail',
    NULL
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM time_conditions tc WHERE tc.tenant_id = t.id AND tc.name = 'Business Hours'
);

-- Insert default inbound routes
INSERT INTO inbound_routes (id, tenant_id, name, description, did_number, destination_type, destination_data, priority)
SELECT 
    gen_random_uuid(),
    t.id,
    'Default Inbound',
    'Default inbound route for all calls',
    NULL,
    'extension',
    '{"extension": "100"}'::jsonb,
    100
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM inbound_routes ir WHERE ir.tenant_id = t.id AND ir.name = 'Default Inbound'
);

-- Insert default outbound routes
INSERT INTO outbound_routes (id, tenant_id, name, description, pattern, trunk_priority, priority)
SELECT 
    gen_random_uuid(),
    t.id,
    'Default Outbound',
    'Default outbound route for all calls',
    '^([0-9]+)$',
    '[]'::jsonb,
    100
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM outbound_routes or_ WHERE or_.tenant_id = t.id AND or_.name = 'Default Outbound'
);

-- Insert default dialplan contexts
INSERT INTO dialplan_contexts (id, tenant_id, name, description, context_type, conditions, priority)
SELECT 
    gen_random_uuid(),
    t.id,
    'Internal Context',
    'Internal routing context',
    'internal',
    '[
        {
            "condition": "destination_number",
            "expression": "^(1\\d{3})$",
            "actions": [
                {
                    "application": "set",
                    "data": "domain_name=${domain_name}"
                },
                {
                    "application": "bridge",
                    "data": "user/${destination_number}@${domain_name}"
                }
            ]
        }
    ]'::jsonb,
    100
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM dialplan_contexts dc WHERE dc.tenant_id = t.id AND dc.name = 'Internal Context'
);

-- Add comments for documentation
COMMENT ON TABLE inbound_routes IS 'Inbound call routing rules based on DID, caller ID, and time conditions';
COMMENT ON TABLE outbound_routes IS 'Outbound call routing rules based on number patterns and trunk selection';
COMMENT ON TABLE time_conditions IS 'Time-based routing conditions for inbound and outbound routes';
COMMENT ON TABLE dialplan_contexts IS 'Advanced dialplan contexts for complex routing scenarios';

COMMENT ON COLUMN inbound_routes.destination_type IS 'Type of destination: extension, ring_group, queue, ivr, conference, voicemail';
COMMENT ON COLUMN outbound_routes.pattern IS 'Regex pattern to match destination numbers';
COMMENT ON COLUMN outbound_routes.trunk_priority IS 'Array of trunk priorities for failover routing';
COMMENT ON COLUMN time_conditions.time_groups IS 'Array of time groups with days, hours, and timezone';
COMMENT ON COLUMN dialplan_contexts.conditions IS 'Array of conditions and actions for advanced routing';
