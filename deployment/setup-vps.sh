#!/bin/bash
###########################################
# W3 VoIP System - VPS Setup Script
# 
# This script installs FreeSWITCH, PostgreSQL,
# Node.js and configures all services for
# production deployment on Debian/Ubuntu
###########################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

print_info "Starting W3 VoIP System VPS Setup..."

###########################################
# 1. System Update & Dependencies
###########################################
print_info "Updating system packages..."
apt-get update
apt-get upgrade -y

print_info "Installing basic dependencies..."
apt-get install -y \
    curl \
    wget \
    gnupg2 \
    lsb-release \
    ca-certificates \
    apt-transport-https \
    software-properties-common \
    build-essential \
    git \
    vim \
    htop \
    net-tools

###########################################
# 2. Install Node.js 20.x
###########################################
print_info "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_info "Node.js $NODE_VERSION installed"
print_info "NPM $NPM_VERSION installed"

###########################################
# 3. Install PostgreSQL
###########################################
print_info "Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
systemctl start postgresql
systemctl enable postgresql

print_info "PostgreSQL installed and started"

###########################################
# 4. Install FreeSWITCH
###########################################
print_info "Installing FreeSWITCH..."

# Add FreeSWITCH repository (SignalWire)
wget --http-user=signalwire --http-password=pat_tDkhM9WGu2xGwKsWFpWCLxH9 \
  -O /usr/share/keyrings/signalwire-freeswitch-repo.gpg \
  https://freeswitch.signalwire.com/repo/deb/debian-release/signalwire-freeswitch-repo.gpg

echo "deb [signed-by=/usr/share/keyrings/signalwire-freeswitch-repo.gpg] \
  https://freeswitch.signalwire.com/repo/deb/debian-release/ $(lsb_release -sc) main" \
  > /etc/apt/sources.list.d/freeswitch.list

apt-get update

# Install FreeSWITCH and essential modules
apt-get install -y \
    freeswitch-meta-all \
    freeswitch-mod-xml-curl \
    freeswitch-mod-event-socket \
    freeswitch-mod-opus \
    freeswitch-mod-g729 \
    freeswitch-mod-amr \
    freeswitch-mod-voicemail \
    freeswitch-mod-conference \
    freeswitch-mod-fifo \
    freeswitch-mod-callcenter \
    freeswitch-mod-ivr \
    freeswitch-mod-native-file \
    freeswitch-mod-local-stream \
    freeswitch-mod-tone-stream \
    freeswitch-mod-db \
    freeswitch-mod-curl \
    freeswitch-mod-xml-cdr

# Create FreeSWITCH user if not exists
if ! id -u freeswitch > /dev/null 2>&1; then
    adduser --disabled-password --quiet --system \
        --home /var/lib/freeswitch --gecos "FreeSWITCH" \
        --ingroup daemon freeswitch
fi

# Set correct permissions
chown -R freeswitch:daemon /etc/freeswitch
chown -R freeswitch:daemon /var/lib/freeswitch
chown -R freeswitch:daemon /var/log/freeswitch
chown -R freeswitch:daemon /usr/share/freeswitch

print_info "FreeSWITCH installed"

###########################################
# 5. Configure FreeSWITCH
###########################################
print_info "Configuring FreeSWITCH..."

# Copy configuration files from deployment directory
if [ -d "/var/www/voip-system/deployment/freeswitch" ]; then
    cp /var/www/voip-system/deployment/freeswitch/event_socket.conf.xml \
       /etc/freeswitch/autoload_configs/
    
    cp /var/www/voip-system/deployment/freeswitch/xml_curl.conf.xml \
       /etc/freeswitch/autoload_configs/
    
    cp /var/www/voip-system/deployment/freeswitch/sofia.conf.xml \
       /etc/freeswitch/autoload_configs/
    
    cp /var/www/voip-system/deployment/freeswitch/modules.conf.xml \
       /etc/freeswitch/autoload_configs/
    
    print_info "FreeSWITCH configuration files copied"
else
    print_warn "Configuration files not found in /var/www/voip-system/deployment/freeswitch"
    print_warn "Please copy configuration files manually"
fi

# Enable and start FreeSWITCH
systemctl enable freeswitch
systemctl start freeswitch

print_info "FreeSWITCH configured and started"

###########################################
# 6. Setup PostgreSQL Database
###########################################
print_info "Setting up PostgreSQL database..."

# Check if database already exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='voip_production'")

if [ "$DB_EXISTS" = "1" ]; then
    print_warn "Database voip_production already exists, skipping creation"
else
    # Create database and user
    sudo -u postgres psql <<EOF
CREATE USER voip_user WITH PASSWORD 'VoipSecure2025!';
CREATE DATABASE voip_production OWNER voip_user;
GRANT ALL PRIVILEGES ON DATABASE voip_production TO voip_user;
\c voip_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF
    
    print_info "Database voip_production created"
fi

###########################################
# 7. Setup Application
###########################################
print_info "Setting up application..."

# Create application directory if not exists
mkdir -p /var/www/voip-system

# Set environment variables file
cat > /var/www/voip-system/.env <<EOF
# Database Configuration
DATABASE_URL=postgresql://voip_user:VoipSecure2025!@localhost:5432/voip_production

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=$(openssl rand -hex 32)

# CORS Origin
CORS_ORIGIN=*

# FreeSWITCH ESL Configuration
FREESWITCH_ESL_HOST=127.0.0.1
FREESWITCH_ESL_PORT=8021
FREESWITCH_ESL_PASSWORD=ClueCon

# Application Port
PORT=5000

# Node Environment
NODE_ENV=production
EOF

print_info "Environment file created at /var/www/voip-system/.env"
print_warn "IMPORTANT: Edit /var/www/voip-system/.env and change default values!"

###########################################
# 8. Create systemd service for backend
###########################################
print_info "Creating systemd service for backend..."

cat > /etc/systemd/system/voip-backend.service <<EOF
[Unit]
Description=W3 VoIP System Backend API
After=network.target postgresql.service freeswitch.service
Wants=postgresql.service freeswitch.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/voip-system/packages/backend
EnvironmentFile=/var/www/voip-system/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=voip-backend

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable voip-backend

print_info "Backend systemd service created"

###########################################
# 9. Firewall Configuration
###########################################
print_info "Configuring firewall..."

# Install ufw if not present
if ! command -v ufw &> /dev/null; then
    apt-get install -y ufw
fi

# Configure UFW
ufw --force enable
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow SIP (FreeSWITCH)
ufw allow 5060/udp
ufw allow 5060/tcp
ufw allow 5080/udp
ufw allow 5080/tcp

# Allow RTP (FreeSWITCH media)
ufw allow 16384:32768/udp

# Allow backend API
ufw allow 5000/tcp

# Reload firewall
ufw reload

print_info "Firewall configured"

###########################################
# 10. Final Steps
###########################################
print_info "Setup complete!"
echo ""
print_info "Next steps:"
echo "  1. Edit /var/www/voip-system/.env with your configuration"
echo "  2. Copy your application code to /var/www/voip-system/"
echo "  3. Run database migrations: cd /var/www/voip-system/packages/database && npm run migrate"
echo "  4. Start the backend: systemctl start voip-backend"
echo "  5. Check status: systemctl status voip-backend"
echo "  6. Check FreeSWITCH: systemctl status freeswitch"
echo "  7. View logs: journalctl -u voip-backend -f"
echo ""
print_info "FreeSWITCH CLI: /usr/bin/fs_cli"
print_info "Database: psql -U voip_user -d voip_production"
echo ""
print_warn "SECURITY REMINDERS:"
echo "  - Change default passwords in /var/www/voip-system/.env"
echo "  - Change FreeSWITCH ESL password in /etc/freeswitch/autoload_configs/event_socket.conf.xml"
echo "  - Configure SSL certificates for production"
echo "  - Restrict CORS_ORIGIN to specific domains"
echo ""
print_info "Setup script finished successfully!"
