#!/bin/bash

# W3 VoIP Development Startup Script
# This script starts all necessary services for development

set -e

echo "🚀 Starting W3 VoIP Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On Ubuntu/Debian: sudo systemctl start postgresql"
    echo "   On macOS: brew services start postgresql"
    exit 1
fi

# Check if FreeSWITCH is running (optional for development)
if ! systemctl is-active --quiet freeswitch 2>/dev/null; then
    echo "⚠️  FreeSWITCH is not running. VoIP functionality will be limited."
    echo "   To start FreeSWITCH: sudo systemctl start freeswitch"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build shared package
echo "🔨 Building shared package..."
cd packages/shared
npm run build
cd ../..

# Build database package
echo "🗄️  Building database package..."
cd packages/database
npm run build
cd ../..

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your configuration before continuing."
    echo "   Required: DATABASE_URL, JWT_SECRET"
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
cd packages/database
npm run migrate
cd ../..

# Build backend
echo "🔨 Building backend..."
cd packages/backend
npm run build
cd ../..

# Build frontend
echo "🔨 Building frontend..."
cd packages/frontend
npm run build
cd ../..

echo "✅ All packages built successfully!"
echo ""
echo "🎯 To start the development servers:"
echo "   Terminal 1: npm run dev:backend"
echo "   Terminal 2: npm run dev:frontend"
echo ""
echo "🌐 Access points:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3000/api"
echo "   API Health: http://localhost:3000/api/health"
echo ""
echo "📚 Documentation:"
echo "   README.md - Project overview"
echo "   INSTALLATION.md - Detailed setup guide"
echo ""
echo "🔧 Troubleshooting:"
echo "   - Check logs: npm run logs"
echo "   - Restart services: npm run restart"
echo "   - Clean build: npm run clean && npm run build"
echo ""
echo "Happy coding! 🎉"

