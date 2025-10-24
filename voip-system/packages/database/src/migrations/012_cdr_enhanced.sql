-- Enhanced CDR (Call Detail Records) table
CREATE TABLE IF NOT EXISTS cdr_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_uuid VARCHAR(36) NOT NULL UNIQUE, -- FreeSWITCH call UUID
  caller_id_name VARCHAR(100),
  caller_id_number VARCHAR(20),
  destination_number VARCHAR(20),
  destination_context VARCHAR(50),
  call_direction VARCHAR(10) NOT NULL, -- inbound, outbound, internal
  call_type VARCHAR(20), -- voice, video, fax
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  answer_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0, -- Total call duration in seconds
  bill_sec INTEGER DEFAULT 0, -- Billable duration in seconds
  hangup_cause VARCHAR(50), -- NORMAL_CLEARING, USER_BUSY, NO_ANSWER, etc.
  hangup_disposition VARCHAR(50), -- answered, no_answer, busy, failed
  sip_hangup_disposition VARCHAR(50),
  read_codec VARCHAR(20),
  write_codec VARCHAR(20),
  sip_from_user VARCHAR(50),
  sip_from_host VARCHAR(100),
  sip_to_user VARCHAR(50),
  sip_to_host VARCHAR(100),
  sip_via_protocol VARCHAR(10),
  sip_via_host VARCHAR(100),
  sip_via_port INTEGER,
  local_media_ip VARCHAR(45),
  local_media_port INTEGER,
  remote_media_ip VARCHAR(45),
  remote_media_port INTEGER,
  rtcp_local_ip VARCHAR(45),
  rtcp_local_port INTEGER,
  rtcp_remote_ip VARCHAR(45),
  rtcp_remote_port INTEGER,
  gateway_name VARCHAR(50), -- SIP trunk/gateway used
  accountcode VARCHAR(50),
  user_context VARCHAR(50),
  call_quality_score DECIMAL(3,2), -- 0.00 to 1.00
  mos_score DECIMAL(3,2), -- Mean Opinion Score
  packet_loss DECIMAL(5,2), -- Percentage
  jitter DECIMAL(8,2), -- Milliseconds
  latency DECIMAL(8,2), -- Milliseconds
  recording_path VARCHAR(500), -- Path to call recording
  transcription TEXT, -- Optional call transcription
  tags JSONB DEFAULT '[]'::jsonb, -- Custom tags for categorization
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional call metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Real-time Call Status table (for active calls)
CREATE TABLE IF NOT EXISTS call_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_uuid VARCHAR(36) NOT NULL UNIQUE,
  caller_id_name VARCHAR(100),
  caller_id_number VARCHAR(20),
  destination_number VARCHAR(20),
  call_direction VARCHAR(10) NOT NULL,
  call_state VARCHAR(20) NOT NULL, -- RINGING, ANSWERED, BRIDGED, HANGUP
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  answer_time TIMESTAMP WITH TIME ZONE,
  current_duration INTEGER DEFAULT 0, -- Current call duration in seconds
  gateway_name VARCHAR(50),
  local_media_ip VARCHAR(45),
  remote_media_ip VARCHAR(45),
  read_codec VARCHAR(20),
  write_codec VARCHAR(20),
  call_quality JSONB DEFAULT '{}'::jsonb, -- Real-time quality metrics
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Call Statistics table (for aggregated data)
CREATE TABLE IF NOT EXISTS call_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour INTEGER NOT NULL, -- 0-23
  call_direction VARCHAR(10) NOT NULL,
  call_type VARCHAR(20),
  gateway_name VARCHAR(50),
  total_calls INTEGER DEFAULT 0,
  answered_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- Total duration in seconds
  total_bill_sec INTEGER DEFAULT 0, -- Total billable duration
  avg_duration DECIMAL(8,2) DEFAULT 0,
  avg_bill_sec DECIMAL(8,2) DEFAULT 0,
  avg_quality_score DECIMAL(3,2) DEFAULT 0,
  total_packet_loss DECIMAL(8,2) DEFAULT 0,
  total_jitter DECIMAL(8,2) DEFAULT 0,
  total_latency DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, date, hour, call_direction, call_type, gateway_name)
);

-- Indexes for cdr_enhanced
CREATE INDEX IF NOT EXISTS idx_cdr_enhanced_tenant_id ON cdr_enhanced(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cdr_enhanced_call_uuid ON cdr_enhanced(call_uuid);
CREATE INDEX IF NOT EXISTS idx_cdr_enhanced_start_time ON cdr_enhanced(start_time);
CREATE INDEX IF NOT EXISTS idx_cdr_enhanced_call_direction ON cdr_enhanced(call_direction);
CREATE INDEX IF NOT EXISTS idx_cdr_enhanced_caller_id_number ON cdr_enhanced(caller_id_number);
CREATE INDEX IF NOT EXISTS idx_cdr_enhanced_destination_number ON cdr_enhanced(destination_number);
CREATE INDEX IF NOT EXISTS idx_cdr_enhanced_gateway_name ON cdr_enhanced(gateway_name);
CREATE INDEX IF NOT EXISTS idx_cdr_enhanced_hangup_cause ON cdr_enhanced(hangup_cause);

-- Indexes for call_status
CREATE INDEX IF NOT EXISTS idx_call_status_tenant_id ON call_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_call_status_call_uuid ON call_status(call_uuid);
CREATE INDEX IF NOT EXISTS idx_call_status_call_state ON call_status(call_state);
CREATE INDEX IF NOT EXISTS idx_call_status_start_time ON call_status(start_time);
CREATE INDEX IF NOT EXISTS idx_call_status_last_updated ON call_status(last_updated);

-- Indexes for call_statistics
CREATE INDEX IF NOT EXISTS idx_call_statistics_tenant_id ON call_statistics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_call_statistics_date ON call_statistics(date);
CREATE INDEX IF NOT EXISTS idx_call_statistics_call_direction ON call_statistics(call_direction);
CREATE INDEX IF NOT EXISTS idx_call_statistics_gateway_name ON call_statistics(gateway_name);

-- RLS Policies
ALTER TABLE cdr_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_statistics ENABLE ROW LEVEL SECURITY;

-- CDR Enhanced RLS policy
DROP POLICY IF EXISTS cdr_enhanced_tenant_isolation_policy ON cdr_enhanced;
CREATE POLICY cdr_enhanced_tenant_isolation_policy ON cdr_enhanced
FOR ALL
USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Call Status RLS policy
DROP POLICY IF EXISTS call_status_tenant_isolation_policy ON call_status;
CREATE POLICY call_status_tenant_isolation_policy ON call_status
FOR ALL
USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Call Statistics RLS policy
DROP POLICY IF EXISTS call_statistics_tenant_isolation_policy ON call_statistics;
CREATE POLICY call_statistics_tenant_isolation_policy ON call_statistics
FOR ALL
USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Triggers to update updated_at column
CREATE TRIGGER update_cdr_enhanced_updated_at BEFORE UPDATE ON cdr_enhanced FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_call_statistics_updated_at BEFORE UPDATE ON call_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically move completed calls from call_status to cdr_enhanced
CREATE OR REPLACE FUNCTION move_completed_call_to_cdr()
RETURNS TRIGGER AS $$
BEGIN
  -- When a call is marked as completed (state = 'HANGUP'), move it to cdr_enhanced
  IF NEW.call_state = 'HANGUP' AND OLD.call_state != 'HANGUP' THEN
    INSERT INTO cdr_enhanced (
      tenant_id, call_uuid, caller_id_name, caller_id_number, destination_number,
      call_direction, start_time, answer_time, end_time, duration,
      gateway_name, local_media_ip, remote_media_ip, read_codec, write_codec
    ) VALUES (
      NEW.tenant_id, NEW.call_uuid, NEW.caller_id_name, NEW.caller_id_number, NEW.destination_number,
      NEW.call_direction, NEW.start_time, NEW.answer_time, CURRENT_TIMESTAMP, NEW.current_duration,
      NEW.gateway_name, NEW.local_media_ip, NEW.remote_media_ip, NEW.read_codec, NEW.write_codec
    );
    
    -- Delete from call_status after moving to cdr_enhanced
    DELETE FROM call_status WHERE call_uuid = NEW.call_uuid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically move completed calls
CREATE TRIGGER trigger_move_completed_call_to_cdr
  AFTER UPDATE ON call_status
  FOR EACH ROW
  EXECUTE FUNCTION move_completed_call_to_cdr();
