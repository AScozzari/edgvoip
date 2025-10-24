"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
// Load environment variables
dotenv_1.default.config();
// Import middleware
const security_1 = require("./middleware/security");
const logger_1 = require("./utils/logger");
const response_1 = require("./utils/response");
// Import routes
const routes_1 = __importDefault(require("./routes"));
// Import database
const database_1 = require("@w3-voip/database");
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://192.168.172.234:3000',
        methods: ['GET', 'POST']
    }
});
exports.io = io;
const PORT = process.env.PORT || 3001;
// SICUREZZA: JWT_SECRET deve essere configurato in produzione
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('❌ ERRORE CRITICO: JWT_SECRET non configurato in produzione!');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'edg-voip-secret-key-2024-DEVELOPMENT-ONLY';
// Security middleware
app.use(security_1.securityHeaders);
app.use(security_1.requestId);
app.use(security_1.securityEventLogger);
// CORS configuration - SICUREZZA: lista whitelist di origini permesse
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://192.168.172.234:3000'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permetti richieste senza origin (es. Postman, curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Tenant-Slug']
}));
// Compression
app.use((0, compression_1.default)());
// Request logging
app.use((0, morgan_1.default)('combined'));
app.use(logger_1.requestLogger);
// Debug middleware removed
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Input sanitization (temporarily disabled for testing)
// app.use(sanitizeInput);
// Content type validation (temporarily disabled for testing)
// app.use(validateContentType(['application/json']));
// Request size limiting (temporarily disabled for testing)
// app.use(requestSizeLimit('10mb'));
// Rate limiting
app.use('/api', security_1.apiRateLimit);
// API routes
app.use('/api', routes_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        data: {
            message: 'W3 VoIP System API',
            version: process.env.npm_package_version || '1.0.0',
            timestamp: new Date().toISOString(),
            endpoints: {
                health: '/api/health',
                tenants: '/api/tenants',
                stores: '/api/stores',
                extensions: '/api/extensions'
            }
        }
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found'
        }
    });
});
// Error handling middleware
app.use(response_1.errorHandler);
// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    // Join tenant room for real-time updates
    socket.on('join-tenant', (tenantId) => {
        socket.join(`tenant:${tenantId}`);
        console.log(`Client ${socket.id} joined tenant: ${tenantId}`);
    });
    // Leave tenant room
    socket.on('leave-tenant', (tenantId) => {
        socket.leave(`tenant:${tenantId}`);
        console.log(`Client ${socket.id} left tenant: ${tenantId}`);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
// Make io available to other modules
app.set('io', io);
// Database health check
async function checkDatabaseHealth() {
    try {
        const isHealthy = await (0, database_1.healthCheck)();
        if (!isHealthy) {
            console.error('❌ Database health check failed');
            process.exit(1);
        }
        console.log('✅ Database health check passed');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}
// Start server
async function startServer() {
    try {
        // Check database health
        await checkDatabaseHealth();
        // Start HTTP server
        server.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`🚀 W3 VoIP System API running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://192.168.172.234:3000'}`);
            console.log(`📡 Socket.IO enabled for real-time updates`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Start the server
startServer();
//# sourceMappingURL=index.js.map