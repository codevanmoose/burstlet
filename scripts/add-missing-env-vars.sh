#!/bin/bash
# Add missing environment variables to DigitalOcean app

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log "Adding missing environment variables to DigitalOcean app..."

# Add missing secrets that aren't already in the app
log "Adding CSRF_SECRET..."
doctl apps update $APP_ID --spec - << EOF
envs:
- key: CSRF_SECRET
  value: "FfVCH60pzK6oNfabfPPH00eyomn8hDoM"
  scope: RUN_TIME
  type: SECRET
EOF

log "Adding ADMIN_OVERRIDE_TOKEN..."
doctl apps update $APP_ID --spec - << EOF
envs:
- key: ADMIN_OVERRIDE_TOKEN
  value: "0VCLj55hHvinycPTGMdY8rfsAugdCMft"
  scope: RUN_TIME
  type: SECRET
EOF

log "Adding SESSION_SECRET..."
doctl apps update $APP_ID --spec - << EOF
envs:
- key: SESSION_SECRET
  value: "52BoIp4PVyHESnbjZUTb2wbvMQzVuYha"
  scope: RUN_TIME
  type: SECRET
EOF

log "Adding ENCRYPTION_KEY..."
doctl apps update $APP_ID --spec - << EOF
envs:
- key: ENCRYPTION_KEY
  value: "28e404e25b30f35d4a3cd2b91c304993"
  scope: RUN_TIME
  type: SECRET
EOF

log "Adding FRONTEND_URL..."
doctl apps update $APP_ID --spec - << EOF
envs:
- key: FRONTEND_URL
  value: "https://burstlet.vercel.app"
  scope: RUN_TIME
EOF

log "Adding SUPABASE_ANON_KEY..."
doctl apps update $APP_ID --spec - << EOF
envs:
- key: SUPABASE_ANON_KEY
  value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
  scope: RUN_TIME
EOF

log "Adding STORAGE_BUCKET..."
doctl apps update $APP_ID --spec - << EOF
envs:
- key: STORAGE_BUCKET
  value: "burstlet-media"
  scope: RUN_TIME
EOF

log "Adding REDIS_URL (placeholder)..."
doctl apps update $APP_ID --spec - << EOF
envs:
- key: REDIS_URL
  value: "redis://localhost:6379"
  scope: RUN_TIME
EOF

# Add placeholder OAuth client IDs (public, not secret)
log "Adding OAuth Client IDs (placeholders)..."
doctl apps update $APP_ID --spec - << EOF
envs:
- key: YOUTUBE_CLIENT_ID
  value: "placeholder-add-real-id"
  scope: RUN_TIME
EOF

doctl apps update $APP_ID --spec - << EOF
envs:
- key: TIKTOK_CLIENT_ID
  value: "placeholder-add-real-id"
  scope: RUN_TIME
EOF

doctl apps update $APP_ID --spec - << EOF
envs:
- key: INSTAGRAM_CLIENT_ID
  value: "placeholder-add-real-id"
  scope: RUN_TIME
EOF

doctl apps update $APP_ID --spec - << EOF
envs:
- key: TWITTER_CLIENT_ID
  value: "placeholder-add-real-id"
  scope: RUN_TIME
EOF

success "Environment variables added!"

warning "The following still need real values:"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - YOUTUBE_CLIENT_SECRET"
echo "  - TIKTOK_CLIENT_SECRET"
echo "  - INSTAGRAM_CLIENT_SECRET"
echo "  - TWITTER_CLIENT_SECRET"
echo ""
echo "These are already set but may need updating:"
echo "  - OPENAI_API_KEY"
echo "  - HAILUOAI_API_KEY"
echo "  - MINIMAX_API_KEY"
echo "  - RESEND_API_KEY"

log "Check deployment status at:"
log "https://cloud.digitalocean.com/apps/$APP_ID"