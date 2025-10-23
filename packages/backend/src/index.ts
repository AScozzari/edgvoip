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
const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'edg-voip-secret-key-2024';

// Security middleware
app.use(securityHeaders);
app.use(requestId);
app.use(securityEventLogger);

// CORS configuration - Allow all origins in development
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Compression
app.use(compression());

// Request logging
app.use(morgan('combined'));
app.use(requestLogger);

// Debug middleware removed

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization (temporarily disabled for testing)
// app.use(sanitizeInput);

// Content type validation (temporarily disabled for testing)
// app.use(validateContentType(['application/json']));

// Request size limiting (temporarily disabled for testing)
// app.use(requestSizeLimit('10mb'));

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
      console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://192.168.172.234:3000'}`);
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

export { app, server, io };

