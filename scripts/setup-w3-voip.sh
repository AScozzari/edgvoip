#!/bin/bash

# W3 VoIP System Setup Script
# Complete installation and configuration for local development

set -e

echo "🚀 Setting up W3 VoIP System..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Create project directory
PROJECT_DIR="$HOME/w3-voip"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo "📁 Project directory: $PROJECT_DIR"

# Clone or setup the monorepo
if [ ! -d "packages" ]; then
    echo "📦 Setting up monorepo structure..."
    mkdir -p packages/{backend,frontend,shared,database}
    
    # Initialize root package.json
    cat > package.json <<EOF
{
  "name": "w3-voip",
  "version": "1.0.0",
  "description": "W3 VoIP System - Enterprise Multi-tenant VoIP Platform",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd packages/backend && npm run dev",
    "dev:frontend": "cd packages/frontend && npm run dev",
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend",
    "build:shared": "cd packages/shared && npm run build",
    "build:backend": "cd packages/backend && npm run build",
    "build:frontend": "cd packages/frontend && npm run build",
    "test": "npm run test:shared && npm run test:backend && npm run test:frontend",
    "test:shared": "cd packages/shared && npm test",
    "test:backend": "cd packages/backend && npm test",
    "test:frontend": "cd packages/frontend && npm test",
    "db:migrate": "cd packages/database && npm run migrate",
    "db:seed": "cd packages/database && npm run seed",
    "db:reset": "cd packages/database && npm run reset",
    "install:all": "npm install && npm run install:packages",
    "install:packages": "cd packages/shared && npm install && cd ../database && npm install && cd ../backend && npm install && cd ../frontend && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.0.0"
  }
}
EOF
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Setup environment files
echo "🔧 Setting up environment configuration..."

# Backend environment
cat > packages/backend/.env <<EOF
# Database Configuration
DATABASE_URL=postgresql://w3voip:w3voip123@localhost:5432/w3voip
DB_HOST=localhost
DB_PORT=5432
DB_NAME=w3voip
DB_USER=w3voip
DB_PASSWORD=w3voip123

# JWT Configuration
JWT_SECRET=w3voip-super-secret-jwt-key-$(openssl rand -hex 16)
JWT_EXPIRES_IN=24h

# FreeSWITCH Configuration
FREESWITCH_HOST=localhost
FREESWITCH_PORT=8021
FREESWITCH_PASSWORD=ClueCon

# Webhook Configuration
WEBHOOK_SECRET=w3voip-webhook-secret-$(openssl rand -hex 16)
W3_SUITE_WEBHOOK_URL=http://localhost:3001/api/voip/webhook
W3_SUITE_WEBHOOK_SECRET=w3suite-webhook-secret-$(openssl rand -hex 16)

# API Configuration
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=5

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/w3-voip.log
EOF

# Database environment
cat > packages/database/.env <<EOF
# Database Configuration
DATABASE_URL=postgresql://w3voip:w3voip123@localhost:5432/w3voip
DB_HOST=localhost
DB_PORT=5432
DB_NAME=w3voip
DB_USER=w3voip
DB_PASSWORD=w3voip123

# Migration Configuration
MIGRATIONS_PATH=src/migrations
SEEDS_PATH=src/seeds
EOF

# Frontend environment
cat > packages/frontend/.env <<EOF
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws

# Application Configuration
VITE_APP_NAME=W3 VoIP System
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Enterprise Multi-tenant VoIP Platform

# Development Configuration
VITE_DEV_MODE=true
VITE_DEBUG=true
EOF

# Create PostgreSQL database and user
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE w3voip;" 2>/dev/null || echo "Database w3voip already exists"
sudo -u postgres psql -c "CREATE USER w3voip WITH PASSWORD 'w3voip123';" 2>/dev/null || echo "User w3voip already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE w3voip TO w3voip;" 2>/dev/null || echo "Privileges already granted"
sudo -u postgres psql -c "ALTER USER w3voip CREATEDB;" 2>/dev/null || echo "User already has CREATEDB privilege"

# Run database migrations
echo "🔄 Running database migrations..."
cd packages/database
npm run migrate
cd ../..

# Create systemd service for W3 VoIP
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/w3-voip.service > /dev/null <<EOF
[Unit]
Description=W3 VoIP System
After=network.target postgresql.service freeswitch.service

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create log directory
mkdir -p logs

# Create startup script
cat > start-w3-voip.sh <<EOF
#!/bin/bash
echo "🚀 Starting W3 VoIP System..."

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL is not running. Starting PostgreSQL..."
    sudo systemctl start postgresql
fi

# Check if FreeSWITCH is running
if ! systemctl is-active --quiet freeswitch; then
    echo "❌ FreeSWITCH is not running. Starting FreeSWITCH..."
    sudo systemctl start freeswitch
fi

# Start W3 VoIP System
echo "✅ Starting W3 VoIP System..."
npm run dev
EOF

chmod +x start-w3-voip.sh

# Create stop script
cat > stop-w3-voip.sh <<EOF
#!/bin/bash
echo "🛑 Stopping W3 VoIP System..."
pkill -f "npm run dev" || true
pkill -f "node.*backend" || true
pkill -f "vite.*frontend" || true
echo "✅ W3 VoIP System stopped"
EOF

chmod +x stop-w3-voip.sh

# Create status script
cat > status-w3-voip.sh <<EOF
#!/bin/bash
echo "📊 W3 VoIP System Status:"
echo ""
echo "🔧 Services:"
systemctl is-active postgresql && echo "  ✅ PostgreSQL: Running" || echo "  ❌ PostgreSQL: Stopped"
systemctl is-active freeswitch && echo "  ✅ FreeSWITCH: Running" || echo "  ❌ FreeSWITCH: Stopped"
systemctl is-active nginx && echo "  ✅ Nginx: Running" || echo "  ❌ Nginx: Stopped"
echo ""
echo "🌐 Web Services:"
curl -s http://localhost:3000/api/health > /dev/null && echo "  ✅ Backend API: Running" || echo "  ❌ Backend API: Stopped"
curl -s http://localhost:5173 > /dev/null && echo "  ✅ Frontend: Running" || echo "  ❌ Frontend: Stopped"
curl -s http://localhost > /dev/null && echo "  ✅ FusionPBX: Running" || echo "  ❌ FusionPBX: Stopped"
echo ""
echo "📞 VoIP Services:"
netstat -tlnp | grep :5060 > /dev/null && echo "  ✅ SIP Internal: Running" || echo "  ❌ SIP Internal: Stopped"
netstat -tlnp | grep :5080 > /dev/null && echo "  ✅ SIP External: Running" || echo "  ❌ SIP External: Stopped"
netstat -tlnp | grep :8021 > /dev/null && echo "  ✅ Event Socket: Running" || echo "  ❌ Event Socket: Stopped"
EOF

chmod +x status-w3-voip.sh

# Create README
cat > README.md <<EOF
# W3 VoIP System

Enterprise Multi-tenant VoIP Platform for W3 Suite integration.

## Quick Start

1. **Start the system:**
   \`\`\`bash
   ./start-w3-voip.sh
   \`\`\`

2. **Check status:**
   \`\`\`bash
   ./status-w3-voip.sh
   \`\`\`

3. **Stop the system:**
   \`\`\`bash
   ./stop-w3-voip.sh
   \`\`\`

## Web Interfaces

- **W3 VoIP Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api
- **FusionPBX Admin:** http://localhost (admin/admin123)

## API Endpoints

- **Health Check:** GET /api/health
- **Tenants:** /api/tenants
- **Stores:** /api/stores
- **Extensions:** /api/extensions
- **Calls:** /api/calls
- **CDR:** /api/cdr
- **Webhooks:** /api/webhooks

## Database

- **Host:** localhost:5432
- **Database:** w3voip
- **Username:** w3voip
- **Password:** w3voip123

## FreeSWITCH

- **Event Socket:** localhost:8021 (ClueCon)
- **SIP Internal:** localhost:5060
- **SIP External:** localhost:5080

## Development

\`\`\`bash
# Install dependencies
npm run install:all

# Run migrations
npm run db:migrate

# Start development
npm run dev

# Build for production
npm run build
\`\`\`

## Configuration

Environment files are located in each package:
- \`packages/backend/.env\`
- \`packages/database/.env\`
- \`packages/frontend/.env\`

## Logs

- **Application logs:** \`logs/w3-voip.log\`
- **FreeSWITCH logs:** \`/var/log/freeswitch/\`
- **System logs:** \`journalctl -u w3-voip\`
EOF

echo ""
echo "✅ W3 VoIP System setup completed!"
echo ""
echo "📁 Project location: $PROJECT_DIR"
echo ""
echo "🚀 To start the system:"
echo "   cd $PROJECT_DIR"
echo "   ./start-w3-voip.sh"
echo ""
echo "📊 To check status:"
echo "   ./status-w3-voip.sh"
echo ""
echo "🌐 Web interfaces will be available at:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:3000/api"
echo "   - FusionPBX: http://localhost"
echo ""
echo "🔧 Configuration files:"
echo "   - Backend: packages/backend/.env"
echo "   - Database: packages/database/.env"
echo "   - Frontend: packages/frontend/.env"
echo ""
echo "📚 Documentation: README.md"
echo ""
echo "🎉 W3 VoIP System is ready for development!"

