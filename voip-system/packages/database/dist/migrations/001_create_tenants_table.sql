-- Create tenants table with RLS
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(100) UNIQUE NOT NULL,
    sip_domain VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'pending')),
    settings JSONB NOT NULL DEFAULT '{
        "max_concurrent_calls": 20,
        "recording_enabled": true,
        "gdpr_compliant": true,
        "timezone": "Europe/Rome",
        "language": "it"
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stores table with RLS
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    store_id VARCHAR(50) NOT NULL, -- W3 Suite store ID
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    settings JSONB NOT NULL DEFAULT '{
        "business_hours": {
            "enabled": true,
            "timezone": "Europe/Rome",
            "schedule": {}
        },
        "outbound_caller_id": null,
        "recording_consent_required": true
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, store_id)
);

-- Create extensions table with RLS
CREATE TABLE IF NOT EXISTS extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    extension VARCHAR(10) NOT NULL,
    password VARCHAR(32) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    type VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (type IN ('user', 'queue', 'conference', 'voicemail')),
    settings JSONB NOT NULL DEFAULT '{
        "voicemail_enabled": true,
        "call_forwarding": {
            "enabled": false,
            "destination": null
        },
        "dnd_enabled": false,
        "recording_enabled": true
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, extension)
);

-- Create sip_trunks table with RLS
CREATE TABLE IF NOT EXISTS sip_trunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'testing' CHECK (status IN ('active', 'inactive', 'testing')),
    sip_config JSONB NOT NULL,
    did_config JSONB NOT NULL,
    security JSONB NOT NULL DEFAULT '{
        "encryption": "tls",
        "authentication": "digest",
        "acl": [],
        "rate_limit": {
            "enabled": true,
            "calls_per_minute": 60,
            "calls_per_hour": 1000
        }
    }',
    gdpr JSONB NOT NULL DEFAULT '{
        "data_retention_days": 365,
        "recording_consent_required": true,
        "data_processing_purpose": "Business communications",
        "lawful_basis": "legitimate_interest",
        "data_controller": "",
        "dpo_contact": null
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CDR table with RLS
CREATE TABLE IF NOT EXISTS cdr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    extension_id UUID REFERENCES extensions(id) ON DELETE SET NULL,
    trunk_id UUID REFERENCES sip_trunks(id) ON DELETE SET NULL,
    
    -- Call identification
    call_uuid UUID NOT NULL,
    call_direction VARCHAR(20) NOT NULL CHECK (call_direction IN ('inbound', 'outbound', 'internal')),
    call_type VARCHAR(20) NOT NULL DEFAULT 'voice' CHECK (call_type IN ('voice', 'video', 'fax')),
    
    -- Caller information
    caller_id_number VARCHAR(50),
    caller_id_name VARCHAR(100),
    caller_extension VARCHAR(10),
    
    -- Callee information
    callee_id_number VARCHAR(50),
    callee_id_name VARCHAR(100),
    callee_extension VARCHAR(10),
    
    -- Call details
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    answer_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0, -- seconds
    bill_seconds INTEGER NOT NULL DEFAULT 0, -- billable seconds
    hangup_cause VARCHAR(50) NOT NULL,
    hangup_disposition VARCHAR(20) NOT NULL CHECK (hangup_disposition IN ('answered', 'busy', 'no_answer', 'congestion', 'fail', 'timeout')),
    
    -- Media information
    audio_codec VARCHAR(20),
    video_codec VARCHAR(20),
    rtp_audio_in_mos DECIMAL(3,2) CHECK (rtp_audio_in_mos >= 1 AND rtp_audio_in_mos <= 5),
    rtp_audio_out_mos DECIMAL(3,2) CHECK (rtp_audio_out_mos >= 1 AND rtp_audio_out_mos <= 5),
    
    -- Recording
    recording_enabled BOOLEAN NOT NULL DEFAULT false,
    recording_path TEXT,
    recording_duration INTEGER,
    recording_consent BOOLEAN,
    
    -- Network information
    local_ip INET,
    remote_ip INET,
    local_port INTEGER,
    remote_port INTEGER,
    
    -- FreeSWITCH specific
    fs_uuid UUID NOT NULL,
    fs_domain VARCHAR(100) NOT NULL,
    fs_context VARCHAR(50),
    fs_profile VARCHAR(50),
    
    -- Metadata
    metadata JSONB,
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create active_calls table for real-time monitoring
CREATE TABLE IF NOT EXISTS active_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    call_uuid UUID NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
    state VARCHAR(20) NOT NULL CHECK (state IN ('ringing', 'answered', 'hold', 'transfer', 'conference')),
    caller_number VARCHAR(50),
    caller_name VARCHAR(100),
    callee_number VARCHAR(50),
    callee_name VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    recording_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table for security and compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID, -- Reference to W3 Suite user
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_sip_domain ON tenants(sip_domain);
CREATE INDEX IF NOT EXISTS idx_stores_tenant_id ON stores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stores_store_id ON stores(store_id);
CREATE INDEX IF NOT EXISTS idx_extensions_tenant_id ON extensions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_extensions_extension ON extensions(tenant_id, extension);
CREATE INDEX IF NOT EXISTS idx_sip_trunks_tenant_id ON sip_trunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cdr_tenant_id ON cdr(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cdr_start_time ON cdr(start_time);
CREATE INDEX IF NOT EXISTS idx_cdr_call_uuid ON cdr(call_uuid);
CREATE INDEX IF NOT EXISTS idx_cdr_caller_number ON cdr(caller_id_number);
CREATE INDEX IF NOT EXISTS idx_cdr_callee_number ON cdr(callee_id_number);
CREATE INDEX IF NOT EXISTS idx_active_calls_tenant_id ON active_calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_active_calls_call_uuid ON active_calls(call_uuid);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_extensions_updated_at BEFORE UPDATE ON extensions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sip_trunks_updated_at BEFORE UPDATE ON sip_trunks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cdr_updated_at BEFORE UPDATE ON cdr FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

