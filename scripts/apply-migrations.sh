#!/bin/bash

# Apply Multi-Tenant Migrations to Database
# Usage: ./apply-migrations.sh

set -e

echo "🔧 Multi-Tenant Migrations Deployment"
echo "======================================"
echo ""

# Database connection string
DB_URL=${DATABASE_URL:-"postgresql://voip_system_user:bnEJC8RNhtIh@dpg-d07rv4u8ii6s73e8p5t0-a.frankfurt-postgres.render.com:5432/voip_system?sslmode=require"}

echo "📊 Applying consolidated migrations..."
echo ""

# Apply consolidated migration
psql "$DB_URL" -f packages/database/src/migrations/apply-all-multi-tenant.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migrations applied successfully!"
  echo ""
  echo "📋 Verifying tables created:"
  psql "$DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('dialplan_rules', 'inbound_routes', 'outbound_routes', 'time_conditions') ORDER BY table_name;"
  
  echo ""
  echo "🔍 Checking tenant structure:"
  psql "$DB_URL" -c "SELECT id, slug, is_master, context_prefix, sip_domain FROM tenants ORDER BY is_master DESC, slug;"
  
  echo ""
  echo "🎉 Multi-Tenant System Ready!"
else
  echo ""
  echo "❌ Migration failed!"
  exit 1
fi

