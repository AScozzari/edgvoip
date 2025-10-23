#!/bin/bash

# FusionPBX Installation Script for Ubuntu/Debian
# W3 VoIP System - Local Development Environment

set -e

echo "🚀 Installing FusionPBX for W3 VoIP System..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
    nginx \
    php8.1-fpm \
    php8.1-cli \
    php8.1-common \
    php8.1-curl \
    php8.1-gd \
    php8.1-mbstring \
    php8.1-mysql \
    php8.1-pgsql \
    php8.1-xml \
    php8.1-zip \
    php8.1-json \
    php8.1-bcmath \
    php8.1-intl \
    php8.1-soap \
    php8.1-xmlrpc \
    php8.1-dev \
    postgresql \
    postgresql-contrib \
    git \
    curl \
    wget \
    unzip \
    build-essential

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer

# Create PostgreSQL database and user
sudo -u postgres psql -c "CREATE DATABASE fusionpbx;"
sudo -u postgres psql -c "CREATE USER fusionpbx WITH PASSWORD 'fusionpbx123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fusionpbx TO fusionpbx;"
sudo -u postgres psql -c "ALTER USER fusionpbx CREATEDB;"

# Download and install FusionPBX
cd /var/www
sudo git clone https://github.com/fusionpbx/fusionpbx.git
sudo chown -R www-data:www-data /var/www/fusionpbx
sudo chmod -R 755 /var/www/fusionpbx

# Install FusionPBX dependencies
cd /var/www/fusionpbx
sudo -u www-data composer install --no-dev

# Configure PHP
sudo sed -i 's/;cgi.fix_pathinfo=1/cgi.fix_pathinfo=0/' /etc/php/8.1/fpm/php.ini
sudo sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 100M/' /etc/php/8.1/fpm/php.ini
sudo sed -i 's/post_max_size = 8M/post_max_size = 100M/' /etc/php/8.1/fpm/php.ini
sudo sed -i 's/max_execution_time = 30/max_execution_time = 300/' /etc/php/8.1/fpm/php.ini
sudo sed -i 's/max_input_time = 60/max_input_time = 300/' /etc/php/8.1/fpm/php.ini
sudo sed -i 's/memory_limit = 128M/memory_limit = 256M/' /etc/php/8.1/fpm/php.ini

# Configure Nginx
sudo tee /etc/nginx/sites-available/fusionpbx > /dev/null <<EOF
server {
    listen 80;
    server_name localhost;
    root /var/www/fusionpbx;
    index index.php index.html index.htm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle PHP files
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Deny access to backup files
    location ~ ~$ {
        deny all;
    }

    # Handle static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Main location block
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }
}
EOF

# Enable FusionPBX site
sudo ln -sf /etc/nginx/sites-available/fusionpbx /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# Start and enable services
sudo systemctl start php8.1-fpm
sudo systemctl enable php8.1-fpm
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create FusionPBX configuration
sudo tee /var/www/fusionpbx/app/config.php > /dev/null <<EOF
<?php
// Database configuration
\$db_type = 'pgsql';
\$db_host = 'localhost';
\$db_port = '5432';
\$db_name = 'fusionpbx';
\$db_username = 'fusionpbx';
\$db_password = 'fusionpbx123';

// Application configuration
\$app_path = '/var/www/freeswitch';
\$app_logs = '/var/log/freeswitch';
\$app_temp = '/tmp';
\$app_www = '/var/www/fusionpbx';

// Security
\$app_encryption_key = '$(openssl rand -hex 32)';
\$app_password_hash = 'bcrypt';

// Multi-tenant configuration
\$app_multi_tenant = true;
\$app_domain_separator = '.';

// FreeSWITCH configuration
\$switch_event_socket_ip = '127.0.0.1';
\$switch_event_socket_port = '8021';
\$switch_event_socket_password = 'ClueCon';

// Recording configuration
\$app_recording_path = '/var/lib/freeswitch/recordings';
\$app_recording_enabled = true;
\$app_gdpr_compliance = true;

// API configuration
\$app_api_enabled = true;
\$app_api_key_required = true;
\$app_webhook_enabled = true;
\$app_webhook_secret = '$(openssl rand -hex 32)';
?>
EOF

# Set permissions
sudo chown www-data:www-data /var/www/fusionpbx/app/config.php
sudo chmod 600 /var/www/fusionpbx/app/config.php

# Create initial admin user
sudo -u www-data php /var/www/fusionpbx/core/install/install.php \
    --db_type=pgsql \
    --db_host=localhost \
    --db_port=5432 \
    --db_name=fusionpbx \
    --db_username=fusionpbx \
    --db_password=fusionpbx123 \
    --admin_username=admin \
    --admin_password=admin123 \
    --admin_email=admin@localhost

# Create W3 VoIP specific configuration
sudo mkdir -p /var/www/fusionpbx/app/w3-voip
sudo tee /var/www/fusionpbx/app/w3-voip/config.php > /dev/null <<EOF
<?php
// W3 VoIP System Integration Configuration
\$w3_voip_config = [
    'api_url' => 'http://localhost:3000/api',
    'webhook_url' => 'http://localhost:3000/api/webhooks',
    'tenant_isolation' => true,
    'domain_mapping' => true,
    'recording_consent' => true,
    'gdpr_compliance' => true,
    'multi_store_support' => true,
    'extension_auto_provision' => true,
    'trunk_auto_register' => true
];
?>
EOF

# Set permissions
sudo chown -R www-data:www-data /var/www/fusionpbx/app/w3-voip
sudo chmod -R 755 /var/www/fusionpbx/app/w3-voip

# Create systemd service for FusionPBX
sudo tee /etc/systemd/system/fusionpbx.service > /dev/null <<EOF
[Unit]
Description=FusionPBX Web Interface
After=network.target postgresql.service freeswitch.service

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/var/www/fusionpbx
ExecStart=/usr/bin/php /var/www/fusionpbx/core/start.php
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable FusionPBX service
sudo systemctl daemon-reload
sudo systemctl enable fusionpbx

# Check status
echo "✅ FusionPBX installation completed!"
echo "📊 Service Status:"
sudo systemctl status nginx --no-pager
sudo systemctl status php8.1-fpm --no-pager
sudo systemctl status postgresql --no-pager

echo ""
echo "🌐 FusionPBX Web Interface:"
echo "   - URL: http://localhost"
echo "   - Username: admin"
echo "   - Password: admin123"
echo ""
echo "🗄️ Database Configuration:"
echo "   - Host: localhost"
echo "   - Port: 5432"
echo "   - Database: fusionpbx"
echo "   - Username: fusionpbx"
echo "   - Password: fusionpbx123"
echo ""
echo "🔧 Configuration files:"
echo "   - Main config: /var/www/fusionpbx/app/config.php"
echo "   - W3 VoIP config: /var/www/fusionpbx/app/w3-voip/config.php"
echo "   - Nginx config: /etc/nginx/sites-available/fusionpbx"
echo ""
echo "🚀 FusionPBX is ready for W3 VoIP System integration!"

