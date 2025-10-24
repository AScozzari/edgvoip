#!/bin/bash
# Script da eseguire sul VPS per deployare da questo archivio

set -e

echo "🚀 EDG VoIP Deployment Script"
echo "================================"

# Download archivio (sostituisci URL con link pubblico del file)
echo "📦 Downloading code archive..."
cd /opt/edgvoip

# Estrai
echo "📂 Extracting files..."
tar -xzf edgvoip-deploy.tar.gz

# Installa dipendenze root
echo "📚 Installing root dependencies..."
npm install

# Build database package
echo "🔨 Building database package..."
cd packages/database
npm install
npm run build
cd ../..

# Build backend
echo "🔨 Building backend..."
cd packages/backend
npm install
cd ../..

# Build frontend
echo "🔨 Building frontend..."
cd packages/frontend
npm install
npm run build
cd ../..

echo "✅ Build completato!"
echo "Prossimo step: Configurare .env e avviare i servizi"
