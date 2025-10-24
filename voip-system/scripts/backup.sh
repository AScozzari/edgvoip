#!/bin/bash

# Automated Backup Script for EDG VoIP System

set -e

BACKUP_DIR="/var/backups/voip"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "💾 EDG VoIP System - Automated Backup"
echo "====================================="
echo "Timestamp: $TIMESTAMP"

# Create backup directory
mkdir -p $BACKUP_DIR

# Load environment
if [ -f "env.production" ]; then
    export $(cat env.production | grep -v '^#' | xargs)
fi

# Backup PostgreSQL database
echo ""
echo "📊 Backing up PostgreSQL database..."
docker exec voip-postgres-prod pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > $BACKUP_DIR/postgres_$TIMESTAMP.sql.gz
echo "✅ Database backup completed: postgres_$TIMESTAMP.sql.gz"

# Backup FreeSWITCH recordings
echo ""
echo "🎙️  Backing up call recordings..."
docker run --rm -v voip_freeswitch_recordings:/recordings -v $BACKUP_DIR:/backup alpine \
    tar czf /backup/recordings_$TIMESTAMP.tar.gz -C /recordings .
echo "✅ Recordings backup completed: recordings_$TIMESTAMP.tar.gz"

# Backup FreeSWITCH configuration
echo ""
echo "⚙️  Backing up FreeSWITCH configuration..."
tar czf $BACKUP_DIR/freeswitch_conf_$TIMESTAMP.tar.gz docker/freeswitch/conf/
echo "✅ Configuration backup completed: freeswitch_conf_$TIMESTAMP.tar.gz"

# Backup environment and configs
echo ""
echo "📝 Backing up environment files..."
tar czf $BACKUP_DIR/configs_$TIMESTAMP.tar.gz \
    env.production \
    docker-compose.prod.yml \
    nginx/nginx-prod.conf
echo "✅ Configuration files backup completed: configs_$TIMESTAMP.tar.gz"

# Remove old backups
echo ""
echo "🗑️  Removing backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "✅ Old backups removed"

# Calculate backup size
BACKUP_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
echo ""
echo "✅ Backup completed successfully!"
echo "📦 Total backup size: $BACKUP_SIZE"
echo "📁 Backup location: $BACKUP_DIR"
echo ""
echo "Files created:"
ls -lh $BACKUP_DIR/*_$TIMESTAMP.*

