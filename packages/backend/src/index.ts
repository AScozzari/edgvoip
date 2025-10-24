import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables
dotenv.config();

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
import {
  securityHeaders,
  requestId,
  apiRateLimit,
  sanitizeInput,
  validateContentType,
  requestSizeLimit,
  securityEventLogger
} from './middleware/security';
import { requestLogger } from './utils/logger';
import { errorHandler } from './utils/response';

// Import routes
import apiRoutes from './routes';

// Import database
import { healthCheck as dbHealthCheck, getClient } from '@w3-voip/database';
import { validateTenantSlug } from './middleware/tenant.middleware';

const app = express();
const server = createServer(app);

// Get CORS origin from environment or use restrictive default
const corsOrigin = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'];

const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET!; // Validated above

// Security middleware
app.use(securityHeaders);
app.use(requestId);
app.use(securityEventLogger);

// CORS configuration - Secure, only allowed origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (corsOrigin.includes(origin) || corsOrigin.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Compression
app.use(compression());

// Request logging
app.use(morgan('combined'));
app.use(requestLogger);

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Request size limiting
app.use(requestSizeLimit('10mb'));

// Rate limiting
app.use('/api', apiRateLimit);

// API routes
app.use('/api', apiRoutes);

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join tenant room for real-time updates
  socket.on('join-tenant', (tenantId: string) => {
    socket.join(`tenant:${tenantId}`);
    console.log(`Client ${socket.id} joined tenant: ${tenantId}`);
  });
  
  // Leave tenant room
  socket.on('leave-tenant', (tenantId: string) => {
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
    const isHealthy = await dbHealthCheck();
    if (!isHealthy) {
      console.error('❌ Database health check failed');
      process.exit(1);
    }
    console.log('✅ Database health check passed');
  } catch (error) {
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
      console.log(`🔗 CORS Origins: ${corsOrigin.join(', ')}`);
      console.log(`📡 Socket.IO enabled for real-time updates`);
    });
  } catch (error) {
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

export { app, server, io, JWT_SECRET };
