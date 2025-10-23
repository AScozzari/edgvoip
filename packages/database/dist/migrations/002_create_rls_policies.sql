-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sip_trunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdr ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenants table
-- Only allow access to tenants that the current user belongs to
CREATE POLICY tenant_isolation_policy ON tenants
    FOR ALL
    TO PUBLIC
    USING (
        id = current_setting('app.current_tenant_id', true)::uuid
        OR current_setting('app.user_role', true) = 'super_admin'
    );

-- Create RLS policies for stores table
CREATE POLICY store_tenant_isolation_policy ON stores
    FOR ALL
    TO PUBLIC
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR current_setting('app.user_role', true) = 'super_admin'
    );

-- Create RLS policies for extensions table
CREATE POLICY extension_tenant_isolation_policy ON extensions
    FOR ALL
    TO PUBLIC
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR current_setting('app.user_role', true) = 'super_admin'
    );

-- Create RLS policies for sip_trunks table
CREATE POLICY sip_trunk_tenant_isolation_policy ON sip_trunks
    FOR ALL
    TO PUBLIC
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR current_setting('app.user_role', true) = 'super_admin'
    );

-- Create RLS policies for cdr table
CREATE POLICY cdr_tenant_isolation_policy ON cdr
    FOR ALL
    TO PUBLIC
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR current_setting('app.user_role', true) = 'super_admin'
    );

-- Create RLS policies for active_calls table
CREATE POLICY active_calls_tenant_isolation_policy ON active_calls
    FOR ALL
    TO PUBLIC
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR current_setting('app.user_role', true) = 'super_admin'
    );

-- Create RLS policies for audit_logs table
CREATE POLICY audit_logs_tenant_isolation_policy ON audit_logs
    FOR ALL
    TO PUBLIC
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR current_setting('app.user_role', true) = 'super_admin'
    );

-- Create function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID, user_role TEXT DEFAULT 'user')
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_uuid::text, true);
    PERFORM set_config('app.user_role', user_role, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clear tenant context
CREATE OR REPLACE FUNCTION clear_tenant_context()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', '', true);
    PERFORM set_config('app.user_role', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current tenant ID
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true)::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has access to tenant
CREATE OR REPLACE FUNCTION has_tenant_access(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        tenant_uuid = current_setting('app.current_tenant_id', true)::uuid
        OR current_setting('app.user_role', true) = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for GDPR data anonymization
CREATE OR REPLACE FUNCTION anonymize_tenant_data(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Anonymize CDR data
    UPDATE cdr 
    SET 
        caller_id_number = 'ANONYMIZED',
        caller_id_name = 'ANONYMIZED',
        callee_id_number = 'ANONYMIZED',
        callee_id_name = 'ANONYMIZED',
        recording_path = NULL,
        metadata = NULL
    WHERE tenant_id = tenant_uuid;
    
    -- Anonymize active calls
    UPDATE active_calls 
    SET 
        caller_number = 'ANONYMIZED',
        caller_name = 'ANONYMIZED',
        callee_number = 'ANONYMIZED',
        callee_name = 'ANONYMIZED'
    WHERE tenant_id = tenant_uuid;
    
    -- Anonymize audit logs
    UPDATE audit_logs 
    SET 
        user_id = NULL,
        ip_address = NULL,
        user_agent = NULL,
        details = NULL
    WHERE tenant_id = tenant_uuid;
    
    -- Log the anonymization action
    INSERT INTO audit_logs (tenant_id, action, resource_type, details)
    VALUES (tenant_uuid, 'data_anonymization', 'tenant', '{"reason": "gdpr_request", "timestamp": "' || NOW() || '"}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for data retention cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
    tenant_record RECORD;
BEGIN
    -- Loop through all tenants and clean up expired data based on their retention settings
    FOR tenant_record IN 
        SELECT id, (settings->>'data_retention_days')::INTEGER as retention_days
        FROM tenants 
        WHERE status = 'active'
    LOOP
        -- Clean up old CDR records
        DELETE FROM cdr 
        WHERE tenant_id = tenant_record.id 
        AND created_at < NOW() - INTERVAL '1 day' * COALESCE(tenant_record.retention_days, 365);
        
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_count := deleted_count + temp_count;
        
        -- Clean up old audit logs (keep for 7 years for compliance)
        DELETE FROM audit_logs 
        WHERE tenant_id = tenant_record.id 
        AND created_at < NOW() - INTERVAL '7 years';
        
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_count := deleted_count + temp_count;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for tenant statistics (with RLS)
CREATE VIEW tenant_stats AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.status as tenant_status,
    COUNT(DISTINCT s.id) as store_count,
    COUNT(DISTINCT e.id) as extension_count,
    COUNT(DISTINCT st.id) as trunk_count,
    COUNT(DISTINCT c.id) as total_calls,
    COUNT(DISTINCT ac.id) as active_calls,
    MAX(c.start_time) as last_call_time
FROM tenants t
LEFT JOIN stores s ON t.id = s.tenant_id
LEFT JOIN extensions e ON t.id = e.tenant_id
LEFT JOIN sip_trunks st ON t.id = st.tenant_id
LEFT JOIN cdr c ON t.id = c.tenant_id
LEFT JOIN active_calls ac ON t.id = ac.tenant_id
GROUP BY t.id, t.name, t.status;

-- Enable RLS on the view
ALTER VIEW tenant_stats SET (security_invoker = true);

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_tenants_rls ON tenants(id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_stores_rls ON stores(tenant_id, id);
CREATE INDEX IF NOT EXISTS idx_extensions_rls ON extensions(tenant_id, id);
CREATE INDEX IF NOT EXISTS idx_sip_trunks_rls ON sip_trunks(tenant_id, id);
CREATE INDEX IF NOT EXISTS idx_cdr_rls ON cdr(tenant_id, start_time);
CREATE INDEX IF NOT EXISTS idx_active_calls_rls ON active_calls(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_rls ON audit_logs(tenant_id, created_at);

