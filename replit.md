# W3 VoIP System - Replit Configuration

## Overview
W3 VoIP System is an Enterprise Multi-tenant VoIP Platform built with:
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Express + TypeScript + Socket.IO
- **Database**: PostgreSQL (Replit Neon)
- **Architecture**: Monorepo with shared types

## Project Structure
```
packages/
  ├── frontend/      # React frontend application (Port 5000)
  ├── backend/       # Express API server (Port 3001)
  ├── shared/        # Shared TypeScript types
  └── database/      # Database migrations and utilities
```

## Environment Configuration

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection (automatically set by Replit)
- `PORT`: 3001 (backend API)
- `CORS_ORIGIN`: Replit dev domain (auto-configured)
- `FREESWITCH_MOCK`: true (for development without FreeSWITCH)
- `JWT_SECRET`: Authentication secret key

### Frontend (.env)
- `VITE_API_BASE_URL`: Points to backend API through Replit proxy

## Development Setup

### Running the Application
The application runs automatically via Replit workflows:
- **Backend Server**: Port 3001 (API and Socket.IO)
- **Frontend Server**: Port 5000 (Vite dev server)

### Database
- PostgreSQL database is managed by Replit
- Migrations are in `packages/database/src/migrations/`
- Run migrations: `cd packages/database && npm run migrate`

### Multi-Tenant System
The VoIP system is multi-tenant. Access via:
- URL pattern: `/{tenantSlug}/login`
- Default tenant: `edg-voip`
- Login URL: `/edg-voip/login`

Demo credentials are shown on the login page.

## Recent Changes (October 23, 2025)

### Production Fixes (LATEST - Ready for Deploy)
1. **CRITICAL FIX**: JSON.parse error for PostgreSQL JSONB fields
   - **Issue**: PostgreSQL JSONB returns objects in production but strings in development
   - **File**: `packages/backend/src/services/extension.service.ts`
   - **Solution**: Type check before parsing: `typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings`
   - **Occurrences**: 6 locations fixed
   - **Impact**: Extensions now visible in frontend after fix

2. **Database Connection Timeout Fix**
   - **File**: `packages/database/src/index.ts`
   - **Changes**:
     - `connectionTimeoutMillis`: 2000ms → 10000ms (10 seconds)
     - Added `keepAlive: true` for persistent connections
     - Added `keepAliveInitialDelayMillis: 10000`
   - **Reason**: Prevent timeout errors on network connections to production database

3. **Login Error Handling Improvements**
   - **File**: `packages/backend/src/index.ts`
   - **Changes**:
     - Added proper SyntaxError handler for malformed JSON (400 response)
     - Added debug logging for login requests (path, headers, content-type)
     - Re-enabled security middleware (sanitizeInput, requestSizeLimit)
   - **Reason**: Better error messages for login failures and enhanced security

4. **Deployment Workflow Established**
   - **Strategy**: Git-based deployment (Replit → Git → Production Server)
   - **Server**: 93.93.113.13
   - **Document**: See `DEPLOYMENT.md` for full procedure
   - **Critical Rule**: Never modify files directly on production server

### Initial Replit Setup
1. Installed all monorepo dependencies
2. Created PostgreSQL database using Replit's Neon integration
3. Fixed database migrations for Replit/Neon compatibility:
   - Removed Supabase-specific role references (`postgres`, `authenticated`)
   - Fixed duplicate trigger definitions
   - Corrected role constraints (`admin` → `tenant_admin`)
4. Configured Vite for Replit proxy compatibility:
   - Port 5000 with host 0.0.0.0
   - HMR configured for WSS on port 443
5. Updated CORS to allow all origins in development
6. Built shared and backend packages
7. Ran all database migrations successfully

### Key Configuration Updates
- Backend: Changed CORS to `origin: true` for development
- Frontend: Updated vite.config.ts for port 5000 and proper HMR
- Database: Fixed Windows line endings and Supabase compatibility issues

## Architecture Decisions

### Database Migration Strategy
- Migrations adapted from Supabase to standard PostgreSQL/Neon
- Used idempotent SQL patterns where possible (`IF NOT EXISTS`, `DROP IF EXISTS`)
- Avoided role-specific policies for broader compatibility

### Development Environment
- FreeSWITCH runs in mock mode (no actual SIP server needed)
- All CORS restrictions relaxed for development
- Database migrations run automatically on setup

## Deployment Configuration
- **Type**: VM (stateful, always-on)
- **Build**: Compiles all packages (shared, backend, frontend)
- **Run**: Starts both backend server and frontend preview server

## User Preferences
(None recorded yet)

## Notes
- The system includes CDR (Call Detail Records), IVR, queues, ring groups, and conference rooms
- Row-level security (RLS) is enabled for tenant isolation
- Socket.IO provides real-time updates for call events
- Mock FreeSWITCH service allows testing without a real PBX
