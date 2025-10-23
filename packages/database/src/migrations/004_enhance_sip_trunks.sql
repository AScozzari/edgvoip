-- Migration: Enhance SIP Trunks for Multi-Provider Support
-- Description: Add support for multiple SIP providers with custom fields

-- Add new columns to sip_trunks table for enhanced multi-provider support
ALTER TABLE sip_trunks 
ADD COLUMN IF NOT EXISTS provider_type VARCHAR(50) DEFAULT 'generic',
ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS codec_preferences JSONB DEFAULT '["PCMU", "PCMA", "G729"]',
ADD COLUMN IF NOT EXISTS dtmf_mode VARCHAR(20) DEFAULT 'rfc2833',
ADD COLUMN IF NOT EXISTS nat_traversal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nat_type VARCHAR(20) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS session_timers BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS session_refresh_method VARCHAR(20) DEFAULT 'uas',
ADD COLUMN IF NOT EXISTS session_expires INTEGER DEFAULT 1800,
ADD COLUMN IF NOT EXISTS session_min_se INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS media_timeout INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS media_hold_timeout INTEGER DEFAULT 1800,
ADD COLUMN IF NOT EXISTS rtp_timeout INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS rtp_hold_timeout INTEGER DEFAULT 1800,
ADD COLUMN IF NOT EXISTS call_timeout INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS call_timeout_code VARCHAR(50) DEFAULT 'NO_ANSWER',
ADD COLUMN IF NOT EXISTS hangup_after_bridge BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS record_calls BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS record_path VARCHAR(255),
ADD COLUMN IF NOT EXISTS record_sample_rate INTEGER DEFAULT 8000,
ADD COLUMN IF NOT EXISTS record_channels INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS failover_trunk_id UUID REFERENCES sip_trunks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS max_concurrent_calls INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS current_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_registration_attempt TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_successful_registration TIMESTAMP,
ADD COLUMN IF NOT EXISTS registration_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS registration_failures INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error_message TEXT,
ADD COLUMN IF NOT EXISTS health_check_interval INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS health_check_timeout INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS health_check_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMP,
ADD COLUMN IF NOT EXISTS health_status VARCHAR(20) DEFAULT 'unknown';

-- Create index for provider_type for faster queries
CREATE INDEX IF NOT EXISTS idx_sip_trunks_provider_type ON sip_trunks(provider_type);
CREATE INDEX IF NOT EXISTS idx_sip_trunks_health_status ON sip_trunks(health_status);
CREATE INDEX IF NOT EXISTS idx_sip_trunks_failover ON sip_trunks(failover_trunk_id);

-- Create table for provider templates
CREATE TABLE IF NOT EXISTS sip_provider_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50) NOT NULL,
    description TEXT,
    default_config JSONB NOT NULL DEFAULT '{}',
    required_fields JSONB NOT NULL DEFAULT '[]',
    optional_fields JSONB NOT NULL DEFAULT '[]',
    codec_preferences JSONB DEFAULT '["PCMU", "PCMA", "G729"]',
    supported_features JSONB DEFAULT '{}',
    documentation_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert common provider templates
INSERT INTO sip_provider_templates (name, provider_type, description, default_config, required_fields, optional_fields, supported_features) VALUES
(
    'Messagenet',
    'messagenet',
    'Messagenet SIP Trunk Provider',
    '{
        "transport": "udp",
        "port": 5060,
        "register": true,
        "retry_seconds": 30,
        "caller_id_in_from": true,
        "ping": true,
        "ping_time": 25
    }',
    '["host", "username", "password"]',
    '["realm", "from_user", "from_domain"]',
    '{
        "supports_dtmf": true,
        "supports_t38": true,
        "supports_srtp": false,
        "supports_video": false,
        "max_concurrent_calls": 100
    }'
),
(
    'Twilio',
    'twilio',
    'Twilio SIP Trunk Provider',
    '{
        "transport": "udp",
        "port": 5060,
        "register": false,
        "retry_seconds": 30,
        "caller_id_in_from": true,
        "ping": false,
        "ping_time": 0
    }',
    '["host", "username", "password"]',
    '["realm", "from_user", "from_domain"]',
    '{
        "supports_dtmf": true,
        "supports_t38": true,
        "supports_srtp": true,
        "supports_video": true,
        "max_concurrent_calls": 1000
    }'
),
(
    'VoIP.ms',
    'voipms',
    'VoIP.ms SIP Trunk Provider',
    '{
        "transport": "udp",
        "port": 5060,
        "register": true,
        "retry_seconds": 30,
        "caller_id_in_from": true,
        "ping": true,
        "ping_time": 25
    }',
    '["host", "username", "password"]',
    '["realm", "from_user", "from_domain"]',
    '{
        "supports_dtmf": true,
        "supports_t38": true,
        "supports_srtp": false,
        "supports_video": false,
        "max_concurrent_calls": 50
    }'
),
(
    'Generic SIP',
    'generic',
    'Generic SIP Trunk Provider',
    '{
        "transport": "udp",
        "port": 5060,
        "register": false,
        "retry_seconds": 30,
        "caller_id_in_from": true,
        "ping": false,
        "ping_time": 0
    }',
    '["host", "username", "password"]',
    '["realm", "from_user", "from_domain", "register_proxy"]',
    '{
        "supports_dtmf": true,
        "supports_t38": false,
        "supports_srtp": false,
        "supports_video": false,
        "max_concurrent_calls": 10
    }'
);

-- Create table for SIP trunk health monitoring
CREATE TABLE IF NOT EXISTS sip_trunk_health_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trunk_id UUID NOT NULL REFERENCES sip_trunks(id) ON DELETE CASCADE,
    check_type VARCHAR(50) NOT NULL, -- 'registration', 'ping', 'call_test'
    status VARCHAR(20) NOT NULL, -- 'success', 'failure', 'timeout'
    response_time INTEGER, -- milliseconds
    error_message TEXT,
    details JSONB,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for health logs
CREATE INDEX IF NOT EXISTS idx_sip_trunk_health_logs_trunk_id ON sip_trunk_health_logs(trunk_id);
CREATE INDEX IF NOT EXISTS idx_sip_trunk_health_logs_checked_at ON sip_trunk_health_logs(checked_at);

-- Create table for SIP trunk usage statistics
CREATE TABLE IF NOT EXISTS sip_trunk_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trunk_id UUID NOT NULL REFERENCES sip_trunks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0, -- seconds
    total_cost DECIMAL(10,4) DEFAULT 0,
    peak_concurrent_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trunk_id, date)
);

-- Create index for usage stats
CREATE INDEX IF NOT EXISTS idx_sip_trunk_usage_stats_trunk_id ON sip_trunk_usage_stats(trunk_id);
CREATE INDEX IF NOT EXISTS idx_sip_trunk_usage_stats_date ON sip_trunk_usage_stats(date);

-- Update existing sip_trunks with default values
UPDATE sip_trunks 
SET 
    provider_type = 'generic',
    provider_config = '{}',
    codec_preferences = '["PCMU", "PCMA", "G729"]',
    dtmf_mode = 'rfc2833',
    nat_traversal = false,
    nat_type = 'none',
    session_timers = false,
    session_refresh_method = 'uas',
    session_expires = 1800,
    session_min_se = 90,
    media_timeout = 300,
    media_hold_timeout = 1800,
    rtp_timeout = 300,
    rtp_hold_timeout = 1800,
    call_timeout = 60,
    call_timeout_code = 'NO_ANSWER',
    hangup_after_bridge = true,
    record_calls = false,
    max_concurrent_calls = 10,
    current_calls = 0,
    registration_attempts = 0,
    registration_failures = 0,
    health_check_interval = 300,
    health_check_timeout = 30,
    health_check_enabled = true,
    health_status = 'unknown'
WHERE provider_type IS NULL;

-- Create function to update SIP trunk health status
CREATE OR REPLACE FUNCTION update_sip_trunk_health_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update health status based on registration status and last check
    IF NEW.last_successful_registration IS NOT NULL AND 
       (NEW.last_health_check IS NULL OR NEW.last_health_check > NOW() - INTERVAL '5 minutes') THEN
        NEW.health_status = 'healthy';
    ELSIF NEW.registration_failures > 3 THEN
        NEW.health_status = 'unhealthy';
    ELSIF NEW.last_registration_attempt IS NOT NULL AND 
          NEW.last_registration_attempt < NOW() - INTERVAL '10 minutes' THEN
        NEW.health_status = 'unknown';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for health status update
DROP TRIGGER IF EXISTS trigger_update_sip_trunk_health_status ON sip_trunks;
CREATE TRIGGER trigger_update_sip_trunk_health_status
    BEFORE UPDATE ON sip_trunks
    FOR EACH ROW
    EXECUTE FUNCTION update_sip_trunk_health_status();

-- Create function to log SIP trunk health checks
CREATE OR REPLACE FUNCTION log_sip_trunk_health_check(
    p_trunk_id UUID,
    p_check_type VARCHAR(50),
    p_status VARCHAR(20),
    p_response_time INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO sip_trunk_health_logs (
        trunk_id, check_type, status, response_time, error_message, details
    ) VALUES (
        p_trunk_id, p_check_type, p_status, p_response_time, p_error_message, p_details
    );
    
    -- Update trunk health status
    UPDATE sip_trunks 
    SET 
        last_health_check = CURRENT_TIMESTAMP,
        health_status = CASE 
            WHEN p_status = 'success' THEN 'healthy'
            WHEN p_status = 'failure' THEN 'unhealthy'
            ELSE 'unknown'
        END
    WHERE id = p_trunk_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE sip_provider_templates IS 'Templates for different SIP providers with default configurations';
COMMENT ON TABLE sip_trunk_health_logs IS 'Health monitoring logs for SIP trunks';
COMMENT ON TABLE sip_trunk_usage_stats IS 'Daily usage statistics for SIP trunks';

COMMENT ON COLUMN sip_trunks.provider_type IS 'Type of SIP provider (messagenet, twilio, voipms, generic)';
COMMENT ON COLUMN sip_trunks.provider_config IS 'Provider-specific configuration in JSON format';
COMMENT ON COLUMN sip_trunks.codec_preferences IS 'Preferred codecs in order of preference';
COMMENT ON COLUMN sip_trunks.dtmf_mode IS 'DTMF signaling mode (rfc2833, inband, info)';
COMMENT ON COLUMN sip_trunks.nat_traversal IS 'Enable NAT traversal features';
COMMENT ON COLUMN sip_trunks.health_status IS 'Current health status (healthy, unhealthy, unknown)';
COMMENT ON COLUMN sip_trunks.failover_trunk_id IS 'Trunk to use as failover when this trunk is unhealthy';
