-- Migration 024: Enhance SIP Trunks Table
-- Add fields for outbound caller ID, DIDs, failover, and codec preferences

-- Aggiungere colonne per trunk enhancement
ALTER TABLE sip_trunks ADD COLUMN IF NOT EXISTS outbound_caller_id VARCHAR(50);
ALTER TABLE sip_trunks ADD COLUMN IF NOT EXISTS inbound_dids TEXT[] DEFAULT '{}';
ALTER TABLE sip_trunks ADD COLUMN IF NOT EXISTS failover_trunk_id UUID REFERENCES sip_trunks(id) ON DELETE SET NULL;
ALTER TABLE sip_trunks ADD COLUMN IF NOT EXISTS max_concurrent_calls INT DEFAULT 10;
ALTER TABLE sip_trunks ADD COLUMN IF NOT EXISTS codec_prefs VARCHAR(200) DEFAULT 'PCMA,OPUS,G729';

-- Indici per performance e search
CREATE INDEX IF NOT EXISTS idx_sip_trunks_failover ON sip_trunks(failover_trunk_id) WHERE failover_trunk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sip_trunks_dids ON sip_trunks USING GIN (inbound_dids);
CREATE INDEX IF NOT EXISTS idx_sip_trunks_caller_id ON sip_trunks(outbound_caller_id) WHERE outbound_caller_id IS NOT NULL;

-- Commenti per documentazione
COMMENT ON COLUMN sip_trunks.outbound_caller_id IS 'Default outbound caller ID number for this trunk';
COMMENT ON COLUMN sip_trunks.inbound_dids IS 'Array of DID numbers assigned to this trunk';
COMMENT ON COLUMN sip_trunks.failover_trunk_id IS 'Backup trunk to use if primary fails';
COMMENT ON COLUMN sip_trunks.max_concurrent_calls IS 'Maximum concurrent calls allowed on this trunk';
COMMENT ON COLUMN sip_trunks.codec_prefs IS 'Preferred codec list (comma-separated)';

