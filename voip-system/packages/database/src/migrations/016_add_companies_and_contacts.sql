-- Migration 016: Add companies and tenant contacts tables
-- For multi-tenant management with company information and contact details

-- Tabella companies per ragioni sociali del tenant
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  legal_name VARCHAR(255) NOT NULL,
  vat_number VARCHAR(50),
  tax_code VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Italy',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella contacts per referenti tenant
CREATE TABLE IF NOT EXISTS tenant_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_companies_tenant ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_primary ON companies(tenant_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON tenant_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON tenant_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_primary ON tenant_contacts(tenant_id, is_primary) WHERE is_primary = true;

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_tenant_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

CREATE TRIGGER update_tenant_contacts_updated_at
  BEFORE UPDATE ON tenant_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_contacts_updated_at();

-- RLS Policies per isolamento tenant (da implementare dopo setup ruoli)
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tenant_contacts ENABLE ROW LEVEL SECURITY;
