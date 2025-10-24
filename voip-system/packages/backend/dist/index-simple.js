"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_2 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const voip_routes_1 = __importDefault(require("./routes/voip-routes"));
const sip_test_routes_1 = __importDefault(require("./routes/sip-test-routes"));
const w3_voip_routes_1 = __importDefault(require("./routes/w3-voip-routes"));
const cdr_activity_routes_1 = __importDefault(require("./routes/cdr-activity-routes"));
const logs_1 = __importDefault(require("./routes/logs"));
const sip_trunks_1 = __importDefault(require("./routes/sip-trunks"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.API_PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'edg-voip-secret-key-2024';
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));
app.use((0, express_2.json)());
// Test users with different roles
const testUsers = [
    {
        email: 'superadmin@edgvoip.local',
        password: 'superadmin123',
        id: '1',
        name: 'Super Administrator',
        role: 'super_admin',
        tenant_id: 'bfb2e4dc-55f4-4240-8c7d-0fc8c7ecadd8'
    },
    {
        email: 'tenantadmin@edgvoip.local',
        password: 'tenantadmin123',
        id: '2',
        name: 'Tenant Administrator',
        role: 'tenant_admin',
        tenant_id: 'bfb2e4dc-55f4-4240-8c7d-0fc8c7ecadd8'
    },
    {
        email: 'user@edgvoip.local',
        password: 'user123',
        id: '3',
        name: 'Regular User',
        role: 'tenant_user',
        tenant_id: 'bfb2e4dc-55f4-4240-8c7d-0fc8c7ecadd8'
    }
];
// Simple authentication endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    // Find user by credentials
    const user = testUsers.find(u => u.email === email && u.password === password);
    if (user) {
        // Create a proper JWT token
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            tenant_id: user.tenant_id,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    tenantId: user.tenant_id,
                    role: user.role
                }
            },
            message: 'Login successful'
        });
    }
    else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});
// VoIP routes
app.use('/api/voip', voip_routes_1.default);
// SIP Test routes
app.use('/api/sip-test', sip_test_routes_1.default);
// W3 VoIP routes (CRUD for real database tables)
app.use('/api/w3-voip', w3_voip_routes_1.default);
// CDR and Activity Log routes
app.use('/api/cdr-activity', cdr_activity_routes_1.default);
// Logs routes
app.use('/api/logs', logs_1.default);
// SIP Trunks routes
app.use('/api/sip-trunks', sip_trunks_1.default);
// ===== MOCK ENDPOINTS (Database integration pending) =====
// Stores endpoints
app.get('/api/stores', (req, res) => {
    res.json({
        success: true,
        data: [],
        pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
        }
    });
});
app.get('/api/stores/:id', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Store not found'
    });
});
app.post('/api/stores', (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Store creation not yet implemented'
    });
});
// Calls status endpoint
app.get('/api/calls/status', (req, res) => {
    res.json({
        success: true,
        data: {
            freeswitch: {
                connected: false,
                message: 'FreeSWITCH integration pending'
            },
            timestamp: new Date().toISOString()
        }
    });
});
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        }
    });
});
// Helper function to generate SIP domain from tenant name
function generateSipDomain(tenantName) {
    return `${tenantName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')}.edgvoip.local`;
}
// Helper function to validate SIP domain format
function validateSipDomain(sipDomain) {
    const regex = /^[a-z0-9-]+\.edgvoip\.local$/;
    return regex.test(sipDomain) && sipDomain.length <= 253;
}
// Mock tenants data
const mockTenants = [
    {
        id: 'tenant-1',
        name: 'Demo Tenant',
        domain: 'demo.local',
        sip_domain: 'demo-tenant.edgvoip.local',
        edg_suite_id: 'demo-001',
        created_at: new Date().toISOString()
    }
];
// Mock API endpoints for testing
app.get('/api/tenants', (req, res) => {
    res.json({
        success: true,
        data: {
            tenants: mockTenants
        }
    });
});
// Create tenant endpoint
app.post('/api/tenants', (req, res) => {
    const { name, domain, edg_suite_id } = req.body;
    if (!name || !domain || !edg_suite_id) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: name, domain, edg_suite_id'
        });
    }
    // Generate SIP domain
    const sip_domain = generateSipDomain(name);
    // Validate SIP domain format
    if (!validateSipDomain(sip_domain)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid SIP domain format generated'
        });
    }
    // Check for uniqueness (in production, check database)
    const existingTenant = mockTenants.find(t => t.sip_domain === sip_domain);
    if (existingTenant) {
        return res.status(409).json({
            success: false,
            message: 'SIP domain already exists'
        });
    }
    // Create new tenant
    const newTenant = {
        id: `tenant-${Date.now()}`,
        name,
        domain,
        sip_domain,
        edg_suite_id,
        created_at: new Date().toISOString()
    };
    mockTenants.push(newTenant);
    res.status(201).json({
        success: true,
        data: newTenant,
        message: 'Tenant created successfully'
    });
});
app.get('/api/stores', (req, res) => {
    res.json({
        success: true,
        data: {
            stores: [
                {
                    id: 'store-1',
                    name: 'Demo Store',
                    store_id: 'store-001',
                    tenant_id: 'tenant-1',
                    created_at: new Date().toISOString()
                }
            ]
        }
    });
});
app.get('/api/extensions', (req, res) => {
    res.json({
        success: true,
        data: {
            extensions: [
                {
                    id: 'ext-1',
                    extension_number: '1001',
                    name: 'Demo Extension',
                    tenant_id: 'tenant-1',
                    status: 'active',
                    created_at: new Date().toISOString()
                }
            ]
        }
    });
});
app.get('/api/cdr', (req, res) => {
    res.json({
        success: true,
        data: {
            cdr: [
                {
                    id: 'cdr-1',
                    call_uuid: 'call-123',
                    caller_id_number: '+1234567890',
                    destination_number: '+0987654321',
                    start_time: new Date().toISOString(),
                    duration: 120,
                    hangup_cause: 'NORMAL_CLEARING',
                    direction: 'outbound'
                }
            ]
        }
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 W3 VoIP Backend running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 Login endpoint: http://localhost:${PORT}/api/auth/login`);
});
exports.default = app;
//# sourceMappingURL=index-simple.js.map