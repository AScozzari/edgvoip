-- Migration 023: Enhance Extensions Table
-- Add FreeSWITCH specific fields for extensions

-- Aggiungere colonne per FreeSWITCH integration
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS context VARCHAR(100);
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS caller_id_number VARCHAR(50);
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS voicemail_pin VARCHAR(20);
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS pickup_group VARCHAR(50);
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS limit_max INT DEFAULT 3;

-- Aggiornare context per extensions esistenti basandosi sul tenant
UPDATE extensions e 
SET context = 'tenant-' || t.slug || '-internal'
FROM tenants t 
WHERE e.tenant_id = t.id AND e.context IS NULL;

-- Aggiungere caller_id_number default (uguale a extension se non presente)
UPDATE extensions 
SET caller_id_number = extension 
WHERE caller_id_number IS NULL;

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_extensions_context ON extensions(context);
CREATE INDEX IF NOT EXISTS idx_extensions_pickup_group ON extensions(pickup_group) WHERE pickup_group IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_extensions_caller_id ON extensions(caller_id_number);

-- Commenti per documentazione
COMMENT ON COLUMN extensions.context IS 'FreeSWITCH dialplan context (e.g., tenant-demo-internal)';
COMMENT ON COLUMN extensions.caller_id_number IS 'Outbound caller ID number for this extension';
COMMENT ON COLUMN extensions.voicemail_pin IS 'PIN for accessing voicemail box';
COMMENT ON COLUMN extensions.pickup_group IS 'Call pickup group identifier';
COMMENT ON COLUMN extensions.limit_max IS 'Maximum concurrent calls allowed for this extension';

