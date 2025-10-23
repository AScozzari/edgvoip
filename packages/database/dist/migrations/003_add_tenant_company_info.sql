-- Migration: Aggiungere campi dati aziendali al tenant
-- Data: 2024-01-XX
-- Descrizione: Aggiunge colonne per dati aziendali, referente e logo al tenant

-- Aggiungere colonne dati aziendali al tenant
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_vat VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_city VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_country VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_email VARCHAR(255);

-- Referente aziendale
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);

-- Logo aziendale
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- Aggiornare sip_domain per tenant esistenti con nuovo pattern
UPDATE tenants SET sip_domain = slug || '.edgvoip.it' 
WHERE sip_domain IS NULL OR sip_domain LIKE '%.93.93.113.13';

-- Aggiornare tenant specifici
UPDATE tenants SET sip_domain = 'demo.edgvoip.it' WHERE slug = 'demo';
UPDATE tenants SET sip_domain = 'edgvoip.edgvoip.it' WHERE slug = 'edgvoip';

-- Aggiungere commenti per documentazione
COMMENT ON COLUMN tenants.company_name IS 'Ragione sociale dell''azienda';
COMMENT ON COLUMN tenants.company_vat IS 'Partita IVA o codice fiscale';
COMMENT ON COLUMN tenants.company_address IS 'Indirizzo completo dell''azienda';
COMMENT ON COLUMN tenants.company_city IS 'Città dell''azienda';
COMMENT ON COLUMN tenants.company_country IS 'Paese dell''azienda';
COMMENT ON COLUMN tenants.company_phone IS 'Telefono principale dell''azienda';
COMMENT ON COLUMN tenants.company_email IS 'Email principale dell''azienda';
COMMENT ON COLUMN tenants.contact_name IS 'Nome del referente aziendale';
COMMENT ON COLUMN tenants.contact_email IS 'Email del referente aziendale';
COMMENT ON COLUMN tenants.contact_phone IS 'Telefono del referente aziendale';
COMMENT ON COLUMN tenants.company_logo_url IS 'URL del logo aziendale';
