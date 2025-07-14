#!/bin/bash
# Update environment variables in batch for DigitalOcean app

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

log "Creating complete app spec with all environment variables..."

# Create a complete app spec with all env vars
cat > backend/updated-app-spec.yaml << 'EOF'
features:
- buildpack-stack=ubuntu-22
ingress:
  rules:
  - component:
      name: api
    match:
      path:
        prefix: /
name: burstlet-api
region: nyc
services:
- name: api
  build_command: npm ci --production=false && npm run build
  run_command: npm start
  environment_slug: node-js
  source_dir: backend
  github:
    repo: codevanmoose/burstlet
    branch: main
    deploy_on_push: true
  http_port: 3001
  instance_count: 1
  instance_size_slug: apps-s-1vcpu-1gb
  envs:
  # Existing env vars (keeping encrypted values)
  - key: NODE_ENV
    scope: RUN_AND_BUILD_TIME
    value: production
  - key: PORT
    scope: RUN_AND_BUILD_TIME
    value: "3001"
  - key: DATABASE_URL
    scope: RUN_TIME
    type: SECRET
    value: EV[1:J2nVWx6PEdVOLh/vvyLNtlTE26P0sCj9:gby+8IqvhyidkBgseresrg==]
  - key: SUPABASE_URL
    scope: RUN_TIME
    type: SECRET
    value: EV[1:oE1ePcPhxkgpKcbR9Ov6maUVu22xxc/v:zpj8vHzBywKqx0AyGDN1VQ==]
  - key: SUPABASE_SERVICE_KEY
    scope: RUN_TIME
    type: SECRET
    value: EV[1:pBvkf/w2Op4AbS8fnO2lLPuA9gfCCyTM:ms2qdC2ZkIBYfltVFFcC5g==]
  - key: JWT_SECRET
    scope: RUN_TIME
    type: SECRET
    value: EV[1:YDUQwMOEw5nh/y+4W9WQY99rQRuhgjOK:qRgJ1AKD2QGZ0rgehvt8hw==]
  - key: RESEND_API_KEY
    scope: RUN_TIME
    type: SECRET
    value: EV[1:wuYTS5eg6AGKLcMu9UHGXBgRxiXAKXIh:GbsJFGer8m256TXQslr18Q==]
  - key: OPENAI_API_KEY
    scope: RUN_TIME
    type: SECRET
    value: EV[1:wHED/xiLTo9DQKoLKmYL0Zggg5yPnnVx:VlV3n51FuDdyiXzA5p3gvg==]
  - key: HAILUOAI_API_KEY
    scope: RUN_TIME
    type: SECRET
    value: EV[1:+tSwhHAExvo6462rsU7VJJebVTqS1HZ7:aGLd9w1O0DUFafQAThEYCA==]
  - key: MINIMAX_API_KEY
    scope: RUN_TIME
    type: SECRET
    value: EV[1:O2RuQ/0vXUhh8rLHGCcdBa8fGa7G6qJj:aKXKPfT8T9cKCGfLGnD2ng==]
  - key: STRIPE_SECRET_KEY
    scope: RUN_TIME
    type: SECRET
    value: EV[1:j/bGc3f6e8VKH+zGZPHPP6uVgcUXCBv/:ENJu5lG+mqZ2SaWOSsE2Cg==]
  - key: STRIPE_WEBHOOK_SECRET
    scope: RUN_TIME
    type: SECRET
    value: EV[1:LI4V5o7d3Z3aZFgkROaQHzJgV7tOl7Zy:B14eEKEqXQNXMmB7eL9IpA==]
  - key: YOUTUBE_CLIENT_SECRET
    scope: RUN_TIME
    type: SECRET
    value: EV[1:Ky0GhETGCMCgMOQcrLXBBr8VqvWx3mNy:ybE1LKqkkXP5JdSZTKdO/A==]
  - key: TIKTOK_CLIENT_SECRET
    scope: RUN_TIME
    type: SECRET
    value: EV[1:BjMo4ykfJxFvJDYkX+dHtl8N6wnCGcGV:bN8DDfnl2Uu8JnBJv9qTGQ==]
  - key: INSTAGRAM_CLIENT_SECRET
    scope: RUN_TIME
    type: SECRET
    value: EV[1:fDRUxN7nHGOu4QLlv8rRHJJH5TZrQtCU:k7y5O7kDJK7OoahcbQM6Ig==]
  - key: TWITTER_CLIENT_SECRET
    scope: RUN_TIME
    type: SECRET
    value: EV[1:X7p2aKs7iEWJIrGcXlOPFBa5hPmH20nh:Y/LSXLjZF1M3wcuxGyAmWQ==]
  # New env vars
  - key: CSRF_SECRET
    value: "FfVCH60pzK6oNfabfPPH00eyomn8hDoM"
    scope: RUN_TIME
    type: SECRET
  - key: ADMIN_OVERRIDE_TOKEN
    value: "0VCLj55hHvinycPTGMdY8rfsAugdCMft"
    scope: RUN_TIME
    type: SECRET
  - key: SESSION_SECRET
    value: "52BoIp4PVyHESnbjZUTb2wbvMQzVuYha"
    scope: RUN_TIME
    type: SECRET
  - key: ENCRYPTION_KEY
    value: "28e404e25b30f35d4a3cd2b91c304993"
    scope: RUN_TIME
    type: SECRET
  - key: FRONTEND_URL
    value: "https://burstlet.vercel.app"
    scope: RUN_TIME
  - key: SUPABASE_ANON_KEY
    value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    scope: RUN_TIME
  - key: STORAGE_BUCKET
    value: "burstlet-media"
    scope: RUN_TIME
  - key: REDIS_URL
    value: "redis://localhost:6379"
    scope: RUN_TIME
  - key: YOUTUBE_CLIENT_ID
    value: "placeholder-add-real-id"
    scope: RUN_TIME
  - key: TIKTOK_CLIENT_ID
    value: "placeholder-add-real-id"
    scope: RUN_TIME
  - key: INSTAGRAM_CLIENT_ID
    value: "placeholder-add-real-id"
    scope: RUN_TIME
  - key: TWITTER_CLIENT_ID
    value: "placeholder-add-real-id"
    scope: RUN_TIME
EOF

log "Updating app with complete spec..."
doctl apps update $APP_ID --spec backend/updated-app-spec.yaml

if [ $? -eq 0 ]; then
    success "Environment variables updated successfully!"
    log "The app will now redeploy with the new configuration."
    log ""
    log "Monitor deployment at:"
    log "https://cloud.digitalocean.com/apps/$APP_ID"
    log ""
    warning "Note: Some API keys are still placeholders and need real values:"
    echo "  - All social media OAuth credentials"
    echo "  - Consider updating AI service API keys if they're outdated"
else
    error "Failed to update app spec"
    exit 1
fi