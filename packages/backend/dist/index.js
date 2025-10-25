"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
// Load environment variables
dotenv_1.default.config();
// Validate required environment variables
function validateEnvironment() {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
        console.error('💡 Please set these in your .env file');
        process.exit(1);
    }
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.error('❌ JWT_SECRET must be at least 32 characters long');
        process.exit(1);
    }
    console.log('✅ Environment variables validated');
}
// Validate environment on startup
validateEnvironment();
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
// Get CORS origin from environment or use restrictive default
const corsOrigin = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'];
const io = new socket_io_1.Server(server, {
    cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
    }
});
exports.io = io;
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET; // Validated above
exports.JWT_SECRET = JWT_SECRET;
// Security middleware
app.use(security_1.securityHeaders);
app.use(security_1.requestId);
app.use(security_1.securityEventLogger);
// CORS configuration - Secure, only allowed origins
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin)
            return callback(null, true);
        // Check if origin is in allowed list
        if (corsOrigin.includes(origin) || corsOrigin.includes('*')) {
            callback(null, true);
        }
        else {
            console.warn(`🚫 CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
// Compression
app.use((0, compression_1.default)());
// Request logging
app.use((0, morgan_1.default)('combined'));
app.use(logger_1.requestLogger);
// Debug middleware for login requests
app.use((req, res, next) => {
    if (req.path.includes('/login')) {
        console.log('🔍 Login Request Debug:');
        console.log('  Path:', req.path);
        console.log('  Method:', req.method);
        console.log('  Content-Type:', req.headers['content-type']);
        console.log('  Headers:', JSON.stringify(req.headers, null, 2));
    }
    next();
});
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Input sanitization
app.use(security_1.sanitizeInput);
// Request size limiting
app.use((0, security_1.requestSizeLimit)('10mb'));
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
// Body parser error handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        console.error('❌ Body parser error:', err.message);
        console.error('❌ Request path:', req.path);
        console.error('❌ Content-Type:', req.headers['content-type']);
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_JSON',
                message: 'Invalid JSON in request body'
            }
        });
    }
    next(err);
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
            console.warn('⚠️ Database health check returned false, but continuing anyway');
        }
        else {
            console.log('✅ Database health check passed');
        }
    }
    catch (error) {
        console.error('⚠️ Database connection failed:', error);
        console.warn('⚠️ Continuing despite health check failure (database may recover)');
    }
}
// Start server
async function startServer() {
    try {
        // Check database health
        await checkDatabaseHealth();
        // Start periodic health check (every 30 seconds)
        (0, database_1.startPeriodicHealthCheck)(30000);
        // Start HTTP server
        server.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`🚀 W3 VoIP System API running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 CORS Origins: ${corsOrigin.join(', ')}`);
            console.log(`📡 Socket.IO enabled for real-time updates`);
            // Log initial pool stats
            const stats = (0, database_1.getPoolStats)();
            console.log(`🔌 Database pool: ${stats.totalCount} total, ${stats.idleCount} idle, ${stats.waitingCount} waiting`);
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
// Handle uncaught exceptions (but don't crash on database connection errors)
process.on('uncaughtException', (error) => {
    // Database connection errors - log but don't crash (pool will handle reconnection)
    const dbErrorCodes = ['57P01', '57P02', '57P03', '08003', '08006', '08P01', 'ECONNREFUSED', 'ECONNRESET'];
    const isDbError = dbErrorCodes.includes(error?.code) ||
        error?.message?.includes('terminating connection') ||
        error?.message?.includes('Connection terminated') ||
        error?.message?.includes('server closed the connection');
    if (isDbError) {
        console.error('⚠️ Database connection error (non-fatal):', error.message);
        console.error('⚠️ Error code:', error.code);
        console.error('⚠️ Connection pool will handle recovery automatically');
        return;
    }
    // For other critical errors, log and exit
    console.error('❌ Uncaught Exception:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    // Database connection errors - log but don't crash
    const dbErrorCodes = ['57P01', '57P02', '57P03', '08003', '08006', '08P01', 'ECONNREFUSED', 'ECONNRESET'];
    const isDbError = dbErrorCodes.includes(reason?.code) ||
        reason?.message?.includes('terminating connection') ||
        reason?.message?.includes('Connection terminated') ||
        reason?.message?.includes('server closed the connection');
    if (isDbError) {
        console.error('⚠️ Database connection promise rejection (non-fatal):', reason.message);
        console.error('⚠️ Error code:', reason.code);
        console.error('⚠️ Connection pool will handle recovery automatically');
        return;
    }
    // For other critical rejections, log and exit
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    if (reason?.stack) {
        console.error('Stack trace:', reason.stack);
    }
    process.exit(1);
});
// Start the server
startServer();
//# sourceMappingURL=index.js.map