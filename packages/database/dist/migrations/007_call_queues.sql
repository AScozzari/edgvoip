-- Migration: Create Call Queues System
-- Description: Create call_queues table and related functionality for mod_callcenter

-- Create call_queues table
CREATE TABLE IF NOT EXISTS call_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    extension VARCHAR(10) UNIQUE NOT NULL,
    strategy VARCHAR(20) NOT NULL DEFAULT 'ring-all', -- 'ring-all', 'longest-idle', 'round-robin', 'top-down', 'agent-with-least-talk-time'
    max_wait_time INTEGER NOT NULL DEFAULT 300, -- seconds
    max_wait_time_with_no_agent INTEGER NOT NULL DEFAULT 60, -- seconds
    max_wait_time_with_no_agent_time_reached INTEGER NOT NULL DEFAULT 5, -- seconds
    tier_rules_apply BOOLEAN DEFAULT true,
    tier_rule_wait_second INTEGER DEFAULT 300, -- seconds
    tier_rule_wait_multiply_level BOOLEAN DEFAULT true,
    tier_rule_no_agent_no_wait BOOLEAN DEFAULT false,
    discard_abandoned_after INTEGER DEFAULT 60, -- seconds
    abandoned_resume_allowed BOOLEAN DEFAULT false,
    agents JSONB NOT NULL DEFAULT '[]', -- Array of agent configurations
    moh_sound VARCHAR(255), -- Music on hold sound file
    record_template VARCHAR(255), -- Recording template
    time_base_score VARCHAR(20) DEFAULT 'system', -- 'system', 'queue', 'member'
    tier_rule_wait_second_level INTEGER DEFAULT 1,
    tier_rule_no_agent_no_wait_level INTEGER DEFAULT 1,
    abandoned_resume_allowed_level INTEGER DEFAULT 1,
    max_penalty INTEGER DEFAULT 0,
    min_penalty INTEGER DEFAULT 0,
    queue_timeout INTEGER DEFAULT 60, -- seconds
    queue_timeout_action VARCHAR(50) DEFAULT 'hangup', -- 'hangup', 'voicemail', 'forward'
    queue_timeout_destination VARCHAR(50),
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

-- Create queue_agents table for detailed agent management
CREATE TABLE IF NOT EXISTS queue_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES call_queues(id) ON DELETE CASCADE,
    extension_id UUID NOT NULL REFERENCES extensions(id) ON DELETE CASCADE,
    agent_name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(20) DEFAULT 'callback', -- 'callback', 'uuid-standby', 'uuid-bridge'
    contact VARCHAR(255) NOT NULL, -- SIP contact string
    status VARCHAR(20) DEFAULT 'Available', -- 'Available', 'On Break', 'Logged Out'
    state VARCHAR(20) DEFAULT 'Waiting', -- 'Waiting', 'Receiving', 'In a queue call'
    max_no_answer INTEGER DEFAULT 3,
    wrap_up_time INTEGER DEFAULT 10, -- seconds
    reject_delay_time INTEGER DEFAULT 10, -- seconds
    busy_delay_time INTEGER DEFAULT 60, -- seconds
    no_answer_delay_time INTEGER DEFAULT 60, -- seconds
    last_bridge_start TIMESTAMP,
    last_bridge_end TIMESTAMP,
    last_offered_call TIMESTAMP,
    last_status_change TIMESTAMP,
    no_answer_count INTEGER DEFAULT 0,
    calls_answered INTEGER DEFAULT 0,
    talk_time INTEGER DEFAULT 0, -- seconds
    ready_time TIMESTAMP,
    external_calls_count INTEGER DEFAULT 0,
    uuid VARCHAR(100), -- FreeSWITCH UUID for the agent
    tier_level INTEGER DEFAULT 1,
    tier_position INTEGER DEFAULT 1,
    enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(queue_id, extension_id)
);

-- Create queue_call_logs table for call tracking
CREATE TABLE IF NOT EXISTS queue_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES call_queues(id) ON DELETE CASCADE,
    call_uuid VARCHAR(100),
    caller_id_name VARCHAR(100),
    caller_id_number VARCHAR(50),
    destination_number VARCHAR(50),
    queue_position INTEGER,
    queue_wait_time INTEGER DEFAULT 0, -- seconds
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER DEFAULT 0, -- seconds
    hangup_cause VARCHAR(50),
    answered_by_agent VARCHAR(100),
    answered_by_extension VARCHAR(10),
    agent_wait_time INTEGER DEFAULT 0, -- seconds
    agent_talk_time INTEGER DEFAULT 0, -- seconds
    recording_path VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create queue_statistics table for performance metrics
CREATE TABLE IF NOT EXISTS queue_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES call_queues(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calls INTEGER DEFAULT 0,
    answered_calls INTEGER DEFAULT 0,
    abandoned_calls INTEGER DEFAULT 0,
    total_wait_time INTEGER DEFAULT 0, -- seconds
    average_wait_time INTEGER DEFAULT 0, -- seconds
    longest_wait_time INTEGER DEFAULT 0, -- seconds
    total_talk_time INTEGER DEFAULT 0, -- seconds
    average_talk_time INTEGER DEFAULT 0, -- seconds
    longest_talk_time INTEGER DEFAULT 0, -- seconds
    service_level_percentage DECIMAL(5,2) DEFAULT 0.00, -- % of calls answered within SLA
    service_level_threshold INTEGER DEFAULT 20, -- seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(queue_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_queues_tenant_id ON call_queues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_call_queues_extension ON call_queues(extension);
CREATE INDEX IF NOT EXISTS idx_call_queues_enabled ON call_queues(enabled);
CREATE INDEX IF NOT EXISTS idx_call_queues_strategy ON call_queues(strategy);

CREATE INDEX IF NOT EXISTS idx_queue_agents_queue_id ON queue_agents(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_agents_extension_id ON queue_agents(extension_id);
CREATE INDEX IF NOT EXISTS idx_queue_agents_status ON queue_agents(status);
CREATE INDEX IF NOT EXISTS idx_queue_agents_state ON queue_agents(state);
CREATE INDEX IF NOT EXISTS idx_queue_agents_enabled ON queue_agents(enabled);

CREATE INDEX IF NOT EXISTS idx_queue_call_logs_queue_id ON queue_call_logs(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_call_logs_start_time ON queue_call_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_queue_call_logs_call_uuid ON queue_call_logs(call_uuid);

CREATE INDEX IF NOT EXISTS idx_queue_statistics_queue_id ON queue_statistics(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_statistics_date ON queue_statistics(date);

-- Create triggers for updated_at
CREATE TRIGGER update_call_queues_updated_at 
    BEFORE UPDATE ON call_queues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_agents_updated_at 
    BEFORE UPDATE ON queue_agents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_statistics_updated_at 
    BEFORE UPDATE ON queue_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for all tables
ALTER TABLE call_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY call_queues_tenant_isolation_policy ON call_queues
    FOR ALL TO authenticated
    USING (tenant_id IN (
        SELECT t.id FROM tenants t 
        WHERE t.id = current_setting('app.current_tenant_id')::uuid
    ));

CREATE POLICY queue_agents_tenant_isolation_policy ON queue_agents
    FOR ALL TO authenticated
    USING (queue_id IN (
        SELECT cq.id FROM call_queues cq 
        JOIN tenants t ON cq.tenant_id = t.id
        WHERE t.id = current_setting('app.current_tenant_id')::uuid
    ));

CREATE POLICY queue_call_logs_tenant_isolation_policy ON queue_call_logs
    FOR ALL TO authenticated
    USING (queue_id IN (
        SELECT cq.id FROM call_queues cq 
        JOIN tenants t ON cq.tenant_id = t.id
        WHERE t.id = current_setting('app.current_tenant_id')::uuid
    ));

CREATE POLICY queue_statistics_tenant_isolation_policy ON queue_statistics
    FOR ALL TO authenticated
    USING (queue_id IN (
        SELECT cq.id FROM call_queues cq 
        JOIN tenants t ON cq.tenant_id = t.id
        WHERE t.id = current_setting('app.current_tenant_id')::uuid
    ));

-- Create function to update queue agent count
CREATE OR REPLACE FUNCTION update_queue_agent_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE call_queues 
        SET agents = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', qa.id,
                    'extension_id', qa.extension_id,
                    'agent_name', qa.agent_name,
                    'agent_type', qa.agent_type,
                    'contact', qa.contact,
                    'status', qa.status,
                    'state', qa.state,
                    'max_no_answer', qa.max_no_answer,
                    'wrap_up_time', qa.wrap_up_time,
                    'reject_delay_time', qa.reject_delay_time,
                    'busy_delay_time', qa.busy_delay_time,
                    'no_answer_delay_time', qa.no_answer_delay_time,
                    'calls_answered', qa.calls_answered,
                    'talk_time', qa.talk_time,
                    'tier_level', qa.tier_level,
                    'tier_position', qa.tier_position,
                    'enabled', qa.enabled
                )
            )
            FROM queue_agents qa
            WHERE qa.queue_id = NEW.queue_id
            AND qa.enabled = true
            ORDER BY qa.tier_level ASC, qa.tier_position ASC
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.queue_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE call_queues 
        SET agents = (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', qa.id,
                    'extension_id', qa.extension_id,
                    'agent_name', qa.agent_name,
                    'agent_type', qa.agent_type,
                    'contact', qa.contact,
                    'status', qa.status,
                    'state', qa.state,
                    'max_no_answer', qa.max_no_answer,
                    'wrap_up_time', qa.wrap_up_time,
                    'reject_delay_time', qa.reject_delay_time,
                    'busy_delay_time', qa.busy_delay_time,
                    'no_answer_delay_time', qa.no_answer_delay_time,
                    'calls_answered', qa.calls_answered,
                    'talk_time', qa.talk_time,
                    'tier_level', qa.tier_level,
                    'tier_position', qa.tier_position,
                    'enabled', qa.enabled
                )
            ), '[]'::jsonb)
            FROM queue_agents qa
            WHERE qa.queue_id = OLD.queue_id
            AND qa.enabled = true
            ORDER BY qa.tier_level ASC, qa.tier_position ASC
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.queue_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for agent count update
DROP TRIGGER IF EXISTS trigger_update_queue_agent_count ON queue_agents;
CREATE TRIGGER trigger_update_queue_agent_count
    AFTER INSERT OR UPDATE OR DELETE ON queue_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_queue_agent_count();

-- Create function to log queue calls
CREATE OR REPLACE FUNCTION log_queue_call(
    p_queue_id UUID,
    p_call_uuid VARCHAR(100),
    p_caller_id_name VARCHAR(100),
    p_caller_id_number VARCHAR(50),
    p_destination_number VARCHAR(50),
    p_queue_position INTEGER DEFAULT NULL,
    p_settings JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO queue_call_logs (
        queue_id, call_uuid, caller_id_name, caller_id_number,
        destination_number, queue_position, settings
    ) VALUES (
        p_queue_id, p_call_uuid, p_caller_id_name, p_caller_id_number,
        p_destination_number, p_queue_position, p_settings
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update queue call log
CREATE OR REPLACE FUNCTION update_queue_call_log(
    p_call_uuid VARCHAR(100),
    p_end_time TIMESTAMP DEFAULT NULL,
    p_duration INTEGER DEFAULT NULL,
    p_hangup_cause VARCHAR(50) DEFAULT NULL,
    p_answered_by_agent VARCHAR(100) DEFAULT NULL,
    p_answered_by_extension VARCHAR(10) DEFAULT NULL,
    p_agent_wait_time INTEGER DEFAULT NULL,
    p_agent_talk_time INTEGER DEFAULT NULL,
    p_recording_path VARCHAR(255) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE queue_call_logs 
    SET 
        end_time = COALESCE(p_end_time, end_time),
        duration = COALESCE(p_duration, duration),
        hangup_cause = COALESCE(p_hangup_cause, hangup_cause),
        answered_by_agent = COALESCE(p_answered_by_agent, answered_by_agent),
        answered_by_extension = COALESCE(p_answered_by_extension, answered_by_extension),
        agent_wait_time = COALESCE(p_agent_wait_time, agent_wait_time),
        agent_talk_time = COALESCE(p_agent_talk_time, agent_talk_time),
        recording_path = COALESCE(p_recording_path, recording_path)
    WHERE call_uuid = p_call_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to update queue statistics
CREATE OR REPLACE FUNCTION update_queue_statistics(
    p_queue_id UUID,
    p_date DATE,
    p_total_calls INTEGER DEFAULT NULL,
    p_answered_calls INTEGER DEFAULT NULL,
    p_abandoned_calls INTEGER DEFAULT NULL,
    p_total_wait_time INTEGER DEFAULT NULL,
    p_total_talk_time INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO queue_statistics (
        queue_id, date, total_calls, answered_calls, abandoned_calls,
        total_wait_time, total_talk_time
    ) VALUES (
        p_queue_id, p_date, 
        COALESCE(p_total_calls, 0),
        COALESCE(p_answered_calls, 0),
        COALESCE(p_abandoned_calls, 0),
        COALESCE(p_total_wait_time, 0),
        COALESCE(p_total_talk_time, 0)
    )
    ON CONFLICT (queue_id, date) 
    DO UPDATE SET
        total_calls = queue_statistics.total_calls + COALESCE(p_total_calls, 0),
        answered_calls = queue_statistics.answered_calls + COALESCE(p_answered_calls, 0),
        abandoned_calls = queue_statistics.abandoned_calls + COALESCE(p_abandoned_calls, 0),
        total_wait_time = queue_statistics.total_wait_time + COALESCE(p_total_wait_time, 0),
        total_talk_time = queue_statistics.total_talk_time + COALESCE(p_total_talk_time, 0),
        updated_at = CURRENT_TIMESTAMP;
    
    -- Update calculated fields
    UPDATE queue_statistics 
    SET 
        average_wait_time = CASE 
            WHEN answered_calls > 0 THEN total_wait_time / answered_calls 
            ELSE 0 
        END,
        average_talk_time = CASE 
            WHEN answered_calls > 0 THEN total_talk_time / answered_calls 
            ELSE 0 
        END,
        service_level_percentage = CASE 
            WHEN total_calls > 0 THEN (answered_calls::DECIMAL / total_calls::DECIMAL) * 100 
            ELSE 0 
        END
    WHERE queue_id = p_queue_id AND date = p_date;
END;
$$ LANGUAGE plpgsql;

-- Insert default call queues for each tenant
INSERT INTO call_queues (id, tenant_id, name, description, extension, strategy, max_wait_time, enabled)
SELECT 
    gen_random_uuid(),
    t.id,
    'Support Queue',
    'Support queue for customer service',
    '3000',
    'longest-idle',
    300,
    true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM call_queues cq WHERE cq.tenant_id = t.id AND cq.extension = '3000'
);

INSERT INTO call_queues (id, tenant_id, name, description, extension, strategy, max_wait_time, enabled)
SELECT 
    gen_random_uuid(),
    t.id,
    'Sales Queue',
    'Sales queue for sales team',
    '3001',
    'round-robin',
    180,
    true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM call_queues cq WHERE cq.tenant_id = t.id AND cq.extension = '3001'
);

-- Add comments for documentation
COMMENT ON TABLE call_queues IS 'Call queues for distributing calls to agents with various strategies';
COMMENT ON TABLE queue_agents IS 'Detailed agent management for call queues with tier levels and performance tracking';
COMMENT ON TABLE queue_call_logs IS 'Call logs and statistics for queue calls';
COMMENT ON TABLE queue_statistics IS 'Daily performance statistics for call queues';

COMMENT ON COLUMN call_queues.strategy IS 'Queue strategy: ring-all, longest-idle, round-robin, top-down, agent-with-least-talk-time';
COMMENT ON COLUMN call_queues.max_wait_time IS 'Maximum time a caller can wait in queue before timeout';
COMMENT ON COLUMN queue_agents.agent_type IS 'Agent type: callback, uuid-standby, uuid-bridge';
COMMENT ON COLUMN queue_agents.status IS 'Agent status: Available, On Break, Logged Out';
COMMENT ON COLUMN queue_agents.state IS 'Agent state: Waiting, Receiving, In a queue call';
COMMENT ON COLUMN queue_agents.tier_level IS 'Agent tier level for priority-based routing';
COMMENT ON COLUMN queue_statistics.service_level_percentage IS 'Percentage of calls answered within service level threshold';
