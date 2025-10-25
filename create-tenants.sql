-- Crea tenant demo
INSERT INTO tenants (id, slug, name, domain, sip_domain, status, created_at, updated_at) 
VALUES (
    gen_random_uuid(), 
    'demo', 
    'Demo Tenant',
    'edgvoip.it',
    'demo.edgvoip.it', 
    'active',
    NOW(), 
    NOW()
) 
ON CONFLICT (slug) DO UPDATE 
SET domain = 'edgvoip.it', sip_domain = 'demo.edgvoip.it', status = 'active'
RETURNING id, slug, name, domain, sip_domain;

-- Crea tenant acme
INSERT INTO tenants (id, slug, name, domain, sip_domain, status, created_at, updated_at) 
VALUES (
    gen_random_uuid(), 
    'acme', 
    'ACME Corporation',
    'edgvoip.it',
    'acme.edgvoip.it',
    'active',
    NOW(), 
    NOW()
) 
ON CONFLICT (slug) DO UPDATE 
SET domain = 'edgvoip.it', sip_domain = 'acme.edgvoip.it', status = 'active'
RETURNING id, slug, name, domain, sip_domain;

-- Mostra tutti i tenant
SELECT slug, name, domain, sip_domain, status FROM tenants ORDER BY created_at;
