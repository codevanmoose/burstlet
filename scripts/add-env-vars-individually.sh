#!/bin/bash
# Add environment variables individually to DigitalOcean app

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

APP_ID="41fe1a5b-84b8-4cf8-a69f-5330c7ed7518"

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to add env var using app update
add_env_var() {
    local key=$1
    local value=$2
    local type=${3:-"GENERAL"}
    local scope=${4:-"RUN_TIME"}
    
    log "Adding $key..."
    
    # Get current app spec
    doctl apps spec get $APP_ID > /tmp/current-spec.yaml
    
    # Create a Python script to update the spec
    python3 << EOF
import yaml
import sys

with open('/tmp/current-spec.yaml', 'r') as f:
    spec = yaml.safe_load(f)

# Find the api service
for service in spec.get('services', []):
    if service.get('name') == 'api':
        if 'envs' not in service:
            service['envs'] = []
        
        # Check if env var already exists
        exists = False
        for env in service['envs']:
            if env.get('key') == '$key':
                exists = True
                break
        
        if not exists:
            new_env = {
                'key': '$key',
                'value': '$value',
                'scope': '$scope'
            }
            if '$type' == 'SECRET':
                new_env['type'] = 'SECRET'
            service['envs'].append(new_env)

with open('/tmp/updated-spec.yaml', 'w') as f:
    yaml.dump(spec, f, default_flow_style=False)
EOF
    
    # Apply the updated spec
    if doctl apps update $APP_ID --spec /tmp/updated-spec.yaml > /dev/null 2>&1; then
        success "$key added successfully"
        sleep 2  # Brief pause between updates
    else
        error "Failed to add $key"
    fi
}

log "🔧 Adding environment variables to DigitalOcean app"
log "App ID: $APP_ID"
log "=========================================================="

# Check if PyYAML is installed
if ! python3 -c "import yaml" 2>/dev/null; then
    log "Installing PyYAML..."
    pip3 install pyyaml --quiet
fi

# Add authentication secrets
log "Adding authentication secrets..."
add_env_var "CSRF_SECRET" "FfVCH60pzK6oNfabfPPH00eyomn8hDoM" "SECRET"
add_env_var "ADMIN_OVERRIDE_TOKEN" "0VCLj55hHvinycPTGMdY8rfsAugdCMft" "SECRET"
add_env_var "SESSION_SECRET" "52BoIp4PVyHESnbjZUTb2wbvMQzVuYha" "SECRET"
add_env_var "ENCRYPTION_KEY" "28e404e25b30f35d4a3cd2b91c304993" "SECRET"

# Add public configuration
log "Adding public configuration..."
add_env_var "FRONTEND_URL" "https://burstlet.vercel.app" "GENERAL"
add_env_var "SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" "GENERAL"
add_env_var "STORAGE_BUCKET" "burstlet-media" "GENERAL"
add_env_var "REDIS_URL" "redis://localhost:6379" "GENERAL"

# Add OAuth client IDs (placeholders)
log "Adding OAuth client IDs (placeholders)..."
add_env_var "YOUTUBE_CLIENT_ID" "placeholder-add-real-id" "GENERAL"
add_env_var "TIKTOK_CLIENT_ID" "placeholder-add-real-id" "GENERAL"
add_env_var "INSTAGRAM_CLIENT_ID" "placeholder-add-real-id" "GENERAL"
add_env_var "TWITTER_CLIENT_ID" "placeholder-add-real-id" "GENERAL"

# Clean up
rm -f /tmp/current-spec.yaml /tmp/updated-spec.yaml

success "✅ Environment variables configuration complete!"
log ""
log "The app will now redeploy with the new configuration."
log "Monitor deployment at: https://cloud.digitalocean.com/apps/$APP_ID"
log ""
warning "Note: OAuth credentials are still placeholders and need real values"