#!/bin/bash

# Deploy Tenant Configuration to FreeSWITCH
# Usage: ./deploy-tenant.sh <TENANT_ID> <API_TOKEN>

set -e

TENANT_ID=$1
API_TOKEN=$2
API_URL=${API_URL:-"http://localhost:5000"}

if [ -z "$TENANT_ID" ]; then
  echo "❌ Error: TENANT_ID is required"
  echo "Usage: $0 <TENANT_ID> <API_TOKEN>"
  exit 1
fi

if [ -z "$API_TOKEN" ]; then
  echo "❌ Error: API_TOKEN is required"
  echo "Usage: $0 <TENANT_ID> <API_TOKEN>"
  exit 1
fi

echo "🚀 Deploying tenant configuration..."
echo "Tenant ID: $TENANT_ID"
echo "API URL: $API_URL"
echo ""

# Deploy tenant configuration
RESPONSE=$(curl -s -X POST "$API_URL/api/freeswitch-deploy/tenant/$TENANT_ID" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $RESPONSE"

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Tenant configuration deployed successfully!"
  
  # Optional: Reload FreeSWITCH
  echo ""
  echo "🔄 Reloading FreeSWITCH..."
  curl -s -X POST "$API_URL/api/freeswitch-deploy/reload" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json"
  
  echo "✅ FreeSWITCH reloaded!"
else
  echo "❌ Deployment failed!"
  exit 1
fi

