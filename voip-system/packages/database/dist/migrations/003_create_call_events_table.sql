-- Create call_events table for webhook event storage
CREATE TABLE call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    call_uuid UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'call_started', 'call_answered', 'call_ended', etc.
    event_name VARCHAR(100) NOT NULL, -- FreeSWITCH event name
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data JSONB, -- Additional event data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_call_events_tenant_id ON call_events(tenant_id);
CREATE INDEX idx_call_events_call_uuid ON call_events(call_uuid);
CREATE INDEX idx_call_events_timestamp ON call_events(timestamp);
CREATE INDEX idx_call_events_event_type ON call_events(event_type);

-- Enable RLS
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tenant_isolation_call_events ON call_events
USING (tenant_id = current_setting('app.tenant_id', TRUE)::uuid);

-- Set owner
ALTER TABLE call_events OWNER TO postgres;

