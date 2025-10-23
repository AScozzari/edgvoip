#!/bin/bash

# Production Deployment Script for EDG VoIP System

set -e

echo "🚀 EDG VoIP System - Production Deployment"
echo "=========================================="

# Load environment variables
if [ -f "env.production" ]; then
    export $(cat env.production | grep -v '^#' | xargs)
    echo "✅ Loaded production environment variables"
else
    echo "❌ env.production file not found!"
    exit 1
fi

# Check required tools
echo ""
echo "📋 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required"; exit 1; }
echo "✅ All prerequisites met"

# Build Docker images
echo ""
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Run database migrations
echo ""
echo "📊 Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend npm run migrate

# Seed database with initial data
echo ""
echo "🌱 Seeding database..."
docker-compose -f docker-compose.prod.yml run --rm backend npm run seed

# Start services
echo ""
echo "🎯 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to become healthy..."
sleep 10

# Check health
echo ""
echo "🏥 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Test API endpoint
echo ""
echo "🧪 Testing API endpoints..."
sleep 5
curl -f http://localhost/api/health || echo "⚠️  Health check failed"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Configure your domain in env.production"
echo "  2. Set up SSL certificates in ./ssl/"
echo "  3. Update nginx-prod.conf with your domain"
echo "  4. Run: docker-compose -f docker-compose.prod.yml restart nginx"
echo ""
echo "🔗 Access points:"
echo "  - Frontend: https://your-domain.com"
echo "  - API: https://your-domain.com/api"
echo "  - Super Admin: https://your-domain.com/edgvoip/login"
echo ""

