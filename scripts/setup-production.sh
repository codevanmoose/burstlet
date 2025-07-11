#!/bin/bash
# Complete production setup script for Burstlet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="burstlet-production"

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup function
main() {
    log "🚀 Starting Burstlet Production Setup"
    log "===================================="
    
    # Check prerequisites
    log "Checking prerequisites..."
    
    if ! command_exists railway; then
        error "Railway CLI is required. Install with: npm install -g @railway/cli"
        exit 1
    fi
    
    if ! command_exists git; then
        error "Git is required"
        exit 1
    fi
    
    success "Prerequisites check passed"
    
    # Generate secrets
    log "Generating production secrets..."
    ./scripts/generate-secrets.sh > .env.production.secrets
    success "Secrets generated and saved to .env.production.secrets"
    
    # Create Railway project (if not logged in, prompt user)
    log "Setting up Railway project..."
    if ! railway whoami >/dev/null 2>&1; then
        warning "Not logged in to Railway"
        echo "Please run 'railway login' and then re-run this script"
        exit 1
    fi
    
    # Initialize Railway project
    log "Initializing Railway project..."
    if [ ! -f "railway.toml" ]; then
        railway init --name "$PROJECT_NAME" || {
            warning "Railway project may already exist or init failed"
        }
    fi
    
    # Set up environment variables template
    log "Creating environment setup instructions..."
    cat > PRODUCTION_SETUP.md << 'EOF'
# Burstlet Production Setup Instructions

## 1. Environment Variables Setup

Set these environment variables in Railway dashboard:

### Core Application
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set LOG_LEVEL=info
```

### Database (Supabase)
```bash
railway variables set DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
railway variables set SUPABASE_URL="https://[PROJECT_REF].supabase.co"
railway variables set SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
railway variables set SUPABASE_SERVICE_KEY="[YOUR_SERVICE_KEY]"
```

### Authentication Secrets (use generated values from .env.production.secrets)
```bash
railway variables set JWT_SECRET="[GENERATED_SECRET]"
railway variables set CSRF_SECRET="[GENERATED_SECRET]"
```

### Frontend URL
```bash
railway variables set FRONTEND_URL="https://burstlet-gilt.vercel.app"
railway variables set CORS_ORIGIN="https://burstlet-gilt.vercel.app"
```

### API Keys (replace with actual keys)
```bash
railway variables set OPENAI_API_KEY="sk-your-openai-key"
railway variables set HAILUOAI_API_KEY="your-hailuoai-key"
railway variables set MINIMAX_API_KEY="your-minimax-key"
railway variables set RESEND_API_KEY="re_your-resend-key"
```

## 2. Deploy to Railway

```bash
# Deploy the application
railway up

# Check deployment status
railway status

# View logs
railway logs
```

## 3. Set up Custom Domain (Optional)

```bash
# Add custom domain
railway domain add api.burstlet.com

# Update environment variables with custom domain
railway variables set BACKEND_URL="https://api.burstlet.com"
```

## 4. Verify Deployment

```bash
# Check health endpoint
curl https://[your-railway-url]/health

# Check API endpoint
curl https://[your-railway-url]/api
```

## 5. Set up Monitoring

- Configure Sentry for error tracking
- Set up uptime monitoring
- Configure log aggregation

## Security Checklist

- ✅ All secrets generated and set securely
- ✅ HTTPS enforced
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Security headers configured
- ✅ Input validation enabled
- ✅ SQL injection protection active
- ✅ XSS protection enabled

## Next Steps

1. Set up production database (Supabase)
2. Configure Stripe for payments
3. Set up social media app credentials
4. Configure email service (Resend)
5. Set up monitoring and alerting
EOF
    
    success "Production setup instructions created: PRODUCTION_SETUP.md"
    
    # Build the application
    log "Building application..."
    cd backend
    npm ci
    npm run build
    cd ..
    success "Application built successfully"
    
    # Create deployment verification script
    log "Creating deployment verification script..."
    cat > scripts/verify-deployment.sh << 'EOF'
#!/bin/bash
# Verify production deployment

set -e

BACKEND_URL=$1
if [ -z "$BACKEND_URL" ]; then
    echo "Usage: $0 <backend-url>"
    exit 1
fi

echo "🔍 Verifying deployment at $BACKEND_URL"

# Health check
echo "Testing health endpoint..."
curl -f "$BACKEND_URL/health" | jq .

# API check
echo "Testing API endpoint..."
curl -f "$BACKEND_URL/api" | jq .

# Metrics check
echo "Testing metrics endpoint..."
curl -f "$BACKEND_URL/metrics" >/dev/null && echo "✅ Metrics endpoint working"

echo "✅ All verification tests passed!"
EOF
    
    chmod +x scripts/verify-deployment.sh
    success "Deployment verification script created"
    
    # Final instructions
    log ""
    log "🎯 Production Setup Complete!"
    log "=========================="
    log ""
    log "Next steps:"
    log "1. Review PRODUCTION_SETUP.md for detailed instructions"
    log "2. Check .env.production.secrets for generated secrets"
    log "3. Set up environment variables in Railway"
    log "4. Deploy with: railway up"
    log "5. Verify deployment with: ./scripts/verify-deployment.sh <url>"
    log ""
    success "Burstlet is ready for production deployment! 🚀"
}

# Parse command line arguments
case "${1:-help}" in
    "help"|"--help"|"-h")
        echo "Usage: $0"
        echo ""
        echo "Sets up Burstlet for production deployment including:"
        echo "- Generating secure secrets"
        echo "- Creating Railway project"
        echo "- Building application"
        echo "- Creating setup documentation"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac