#!/bin/sh

# =============================================================================
# Backend Entrypoint Script
# =============================================================================

set -e

echo "🚀 Starting EDG VoIP Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
until nc -z database 5432; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
until nc -z redis 6379; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready"

# Wait for FreeSWITCH to be ready
echo "⏳ Waiting for FreeSWITCH..."
until nc -z freeswitch 8021; do
  echo "FreeSWITCH is unavailable - sleeping"
  sleep 2
done
echo "✅ FreeSWITCH is ready"

# Run database migrations if needed
echo "📊 Running database migrations..."
if [ -f "dist/migrate.js" ]; then
    node dist/migrate.js
fi

# Start the application
echo "🎯 Starting backend server..."
exec "$@"
