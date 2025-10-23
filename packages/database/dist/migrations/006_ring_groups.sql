-- Migration: Create Ring Groups System
-- Description: Create ring_groups table and related functionality

-- Create ring_groups table
CREATE TABLE IF NOT EXISTS ring_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    extension VARCHAR(10) UNIQUE NOT NULL,
    strategy VARCHAR(20) NOT NULL DEFAULT 'ringall', -- 'ringall', 'hunt', 'random', 'simultaneous'
    ring_time INTEGER NOT NULL DEFAULT 20, -- seconds
    members JSONB NOT NULL DEFAULT '[]', -- Array of extension IDs
    member_settings JSONB DEFAULT '{}', -- Per-member settings
    moh_sound VARCHAR(255), -- Music on hold sound file
    voicemail_enabled BOOLEAN DEFAULT false,
    voicemail_extension VARCHAR(10),
    voicemail_password VARCHAR(20),
    voicemail_email VARCHAR(255),
    call_timeout INTEGER DEFAULT 60, -- seconds
    call_timeout_action VARCHAR(50) DEFAULT 'voicemail', -- 'voicemail', 'hangup', 'forward'
    call_timeout_destination VARCHAR(50),
    failover_enabled BOOLEAN DEFAULT false,
    failover_destination_type VARCHAR(50), -- 'extension', 'ring_group', 'queue', 'ivr'
    failover_destination_id UUID,
    failover_destination_data JSONB,
    caller_id_name VARCHAR(100),
    caller_id_number VARCHAR(50),
    recording_enabled BOOLEAN DEFAULT false,
    recording_path VARCHAR(255),
    recording_consent_required BOOLEAN DEFAULT true,
    max_concurrent_calls INTEGER DEFAULT 10,
    current_calls INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ring_group_members table for detailed member management
CREATE TABLE IF NOT EXISTS ring_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ring_group_id UUID NOT NULL REFERENCES ring_groups(id) ON DELETE CASCADE,
    extension_id UUID NOT NULL REFERENCES extensions(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 100, -- Lower number = higher priority
    ring_delay INTEGER DEFAULT 0, -- Delay before ringing this member
    ring_timeout INTEGER DEFAULT 20, -- Individual ring timeout for this member
    enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ring_group_id, extension_id)
);

-- Create ring_group_call_logs table for call tracking
CREATE TABLE IF NOT EXISTS ring_group_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ring_group_id UUID NOT NULL REFERENCES ring_groups(id) ON DELETE CASCADE,
    call_uuid VARCHAR(100),
    caller_id_name VARCHAR(100),
    caller_id_number VARCHAR(50),
    destination_number VARCHAR(50),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER DEFAULT 0, -- seconds
    hangup_cause VARCHAR(50),
    answered_by_extension VARCHAR(10),
    answered_by_name VARCHAR(100),
    recording_path VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ring_groups_tenant_id ON ring_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ring_groups_extension ON ring_groups(extension);
CREATE INDEX IF NOT EXISTS idx_ring_groups_enabled ON ring_groups(enabled);
CREATE INDEX IF NOT EXISTS idx_ring_groups_strategy ON ring_groups(strategy);

CREATE INDEX IF NOT EXISTS idx_ring_group_members_ring_group_id ON ring_group_members(ring_group_id);
CREATE INDEX IF NOT EXISTS idx_ring_group_members_extension_id ON ring_group_members(extension_id);
CREATE INDEX IF NOT EXISTS idx_ring_group_members_priority ON ring_group_members(priority);
CREATE INDEX IF NOT EXISTS idx_ring_group_members_enabled ON ring_group_members(enabled);

CREATE INDEX IF NOT EXISTS idx_ring_group_call_logs_ring_group_id ON ring_group_call_logs(ring_group_id);
CREATE INDEX IF NOT EXISTS idx_ring_group_call_logs_start_time ON ring_group_call_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_ring_group_call_logs_call_uuid ON ring_group_call_logs(call_uuid);

-- Create triggers for updated_at
CREATE TRIGGER update_ring_groups_updated_at 
    BEFORE UPDATE ON ring_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ring_group_members_updated_at 
    BEFORE UPDATE ON ring_group_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for all tables
ALTER TABLE ring_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ring_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ring_group_call_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY ring_groups_tenant_isolation_policy ON ring_groups
    FOR ALL TO authenticated
    USING (tenant_id IN (
        SELECT t.id FROM tenants t 
        WHERE t.id = current_setting('app.current_tenant_id')::uuid
    ));

CREATE POLICY ring_group_members_tenant_isolation_policy ON ring_group_members
    FOR ALL TO authenticated
    USING (ring_group_id IN (
        SELECT rg.id FROM ring_groups rg 
        JOIN tenants t ON rg.tenant_id = t.id
        WHERE t.id = current_setting('app.current_tenant_id')::uuid
    ));

CREATE POLICY ring_group_call_logs_tenant_isolation_policy ON ring_group_call_logs
    FOR ALL TO authenticated
    USING (ring_group_id IN (
        SELECT rg.id FROM ring_groups rg 
        JOIN tenants t ON rg.tenant_id = t.id
        WHERE t.id = current_setting('app.current_tenant_id')::uuid
    ));

-- Create function to update ring group member count
CREATE OR REPLACE FUNCTION update_ring_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE ring_groups 
        SET members = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'extension_id', rgm.extension_id,
                    'extension', e.extension,
                    'display_name', e.display_name,
                    'priority', rgm.priority,
                    'ring_delay', rgm.ring_delay,
                    'ring_timeout', rgm.ring_timeout,
                    'enabled', rgm.enabled
                )
            )
            FROM ring_group_members rgm
            JOIN extensions e ON rgm.extension_id = e.id
            WHERE rgm.ring_group_id = NEW.ring_group_id
            AND rgm.enabled = true
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.ring_group_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE ring_groups 
        SET members = (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'extension_id', rgm.extension_id,
                    'extension', e.extension,
                    'display_name', e.display_name,
                    'priority', rgm.priority,
                    'ring_delay', rgm.ring_delay,
                    'ring_timeout', rgm.ring_timeout,
                    'enabled', rgm.enabled
                )
            ), '[]'::jsonb)
            FROM ring_group_members rgm
            JOIN extensions e ON rgm.extension_id = e.id
            WHERE rgm.ring_group_id = OLD.ring_group_id
            AND rgm.enabled = true
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.ring_group_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for member count update
DROP TRIGGER IF EXISTS trigger_update_ring_group_member_count ON ring_group_members;
CREATE TRIGGER trigger_update_ring_group_member_count
    AFTER INSERT OR UPDATE OR DELETE ON ring_group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_ring_group_member_count();

-- Create function to log ring group calls
CREATE OR REPLACE FUNCTION log_ring_group_call(
    p_ring_group_id UUID,
    p_call_uuid VARCHAR(100),
    p_caller_id_name VARCHAR(100),
    p_caller_id_number VARCHAR(50),
    p_destination_number VARCHAR(50),
    p_settings JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO ring_group_call_logs (
        ring_group_id, call_uuid, caller_id_name, caller_id_number,
        destination_number, settings
    ) VALUES (
        p_ring_group_id, p_call_uuid, p_caller_id_name, p_caller_id_number,
        p_destination_number, p_settings
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update ring group call log
CREATE OR REPLACE FUNCTION update_ring_group_call_log(
    p_call_uuid VARCHAR(100),
    p_end_time TIMESTAMP DEFAULT NULL,
    p_duration INTEGER DEFAULT NULL,
    p_hangup_cause VARCHAR(50) DEFAULT NULL,
    p_answered_by_extension VARCHAR(10) DEFAULT NULL,
    p_answered_by_name VARCHAR(100) DEFAULT NULL,
    p_recording_path VARCHAR(255) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE ring_group_call_logs 
    SET 
        end_time = COALESCE(p_end_time, end_time),
        duration = COALESCE(p_duration, duration),
        hangup_cause = COALESCE(p_hangup_cause, hangup_cause),
        answered_by_extension = COALESCE(p_answered_by_extension, answered_by_extension),
        answered_by_name = COALESCE(p_answered_by_name, answered_by_name),
        recording_path = COALESCE(p_recording_path, recording_path)
    WHERE call_uuid = p_call_uuid;
END;
$$ LANGUAGE plpgsql;

-- Insert default ring groups for each tenant
INSERT INTO ring_groups (id, tenant_id, name, description, extension, strategy, ring_time, members, enabled)
SELECT 
    gen_random_uuid(),
    t.id,
    'Sales Team',
    'Ring group for sales team members',
    '2000',
    'ringall',
    20,
    '[]'::jsonb,
    true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM ring_groups rg WHERE rg.tenant_id = t.id AND rg.extension = '2000'
);

INSERT INTO ring_groups (id, tenant_id, name, description, extension, strategy, ring_time, members, enabled)
SELECT 
    gen_random_uuid(),
    t.id,
    'Support Team',
    'Ring group for support team members',
    '2001',
    'hunt',
    15,
    '[]'::jsonb,
    true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM ring_groups rg WHERE rg.tenant_id = t.id AND rg.extension = '2001'
);

-- Add comments for documentation
COMMENT ON TABLE ring_groups IS 'Ring groups for simultaneous or sequential ringing of multiple extensions';
COMMENT ON TABLE ring_group_members IS 'Detailed member management for ring groups with individual settings';
COMMENT ON TABLE ring_group_call_logs IS 'Call logs and statistics for ring groups';

COMMENT ON COLUMN ring_groups.strategy IS 'Ring strategy: ringall (all at once), hunt (one by one), random (random order), simultaneous (all simultaneously)';
COMMENT ON COLUMN ring_groups.members IS 'JSON array of extension members with their settings';
COMMENT ON COLUMN ring_groups.ring_time IS 'Maximum ring time in seconds before timeout';
COMMENT ON COLUMN ring_groups.call_timeout_action IS 'Action when call times out: voicemail, hangup, forward';
COMMENT ON COLUMN ring_group_members.priority IS 'Member priority (lower number = higher priority)';
COMMENT ON COLUMN ring_group_members.ring_delay IS 'Delay in seconds before ringing this member';
COMMENT ON COLUMN ring_group_call_logs.answered_by_extension IS 'Extension that answered the call';
