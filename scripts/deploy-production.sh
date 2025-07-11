#!/bin/bash
# Enhanced production deployment script with health checks and rollback

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
DEPLOYMENT_TIMEOUT=600    # 10 minutes
ROLLBACK_ON_FAILURE=true
BACKUP_BEFORE_DEPLOY=true

# Logging function
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service health
wait_for_health() {
    local url=$1
    local timeout=$2
    local start_time=$(date +%s)
    
    log "Waiting for service health at $url..."
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $timeout ]; then
            error "Health check timeout after ${timeout}s"
            return 1
        fi
        
        if curl -sf "$url/health" >/dev/null 2>&1; then
            success "Service is healthy!"
            return 0
        fi
        
        echo -n "."
        sleep 5
    done
}

# Function to run pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if we're in the right directory
    if [ ! -f "backend/package.json" ]; then
        error "Please run this script from the Burstlet root directory"
        exit 1
    fi
    
    # Check required environment variables
    local required_vars=("DATABASE_URL" "JWT_SECRET")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check Railway CLI
    if ! command_exists railway; then
        error "Railway CLI is not installed"
        exit 1
    fi
    
    # Check if logged in to Railway
    if ! railway whoami >/dev/null 2>&1; then
        error "Not logged in to Railway. Run 'railway login' first"
        exit 1
    fi
    
    success "Pre-deployment checks passed"
}

# Function to build and test locally
build_and_test() {
    log "Building and testing application..."
    
    cd backend
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --production=false
    
    # Run linting
    log "Running linter..."
    npm run lint || {
        warning "Linting issues found - continuing anyway"
    }
    
    # Run type checking
    log "Running type checks..."
    npm run type-check || {
        error "TypeScript errors found"
        return 1
    }
    
    # Build application
    log "Building application..."
    npm run build
    
    # Test build output
    if [ ! -f "dist/index-production.js" ]; then
        error "Build output not found"
        return 1
    fi
    
    cd ..
    success "Build and test completed"
}

# Function to create database backup
create_backup() {
    if [ "$BACKUP_BEFORE_DEPLOY" = true ]; then
        log "Creating database backup..."
        
        cd backend
        npm run db:backup || {
            warning "Backup failed - continuing anyway"
        }
        cd ..
    fi
}

# Function to deploy to Railway
deploy_to_railway() {
    log "Deploying to Railway..."
    
    cd backend
    
    # Deploy with Railway
    local deployment_start=$(date +%s)
    railway up --detach
    
    # Wait for deployment to complete
    local deployment_id
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - deployment_start))
        
        if [ $elapsed -gt $DEPLOYMENT_TIMEOUT ]; then
            error "Deployment timeout after ${DEPLOYMENT_TIMEOUT}s"
            return 1
        fi
        
        # Check deployment status
        local status=$(railway status --json | jq -r '.deployments[0].status' 2>/dev/null || echo "unknown")
        
        case $status in
            "SUCCESS")
                success "Deployment completed successfully"
                break
                ;;
            "FAILED"|"CRASHED")
                error "Deployment failed with status: $status"
                return 1
                ;;
            *)
                echo -n "."
                sleep 10
                ;;
        esac
    done
    
    cd ..
}

# Function to update environment variables
update_environment() {
    log "Updating environment variables..."
    
    cd backend
    
    # Set critical environment variables
    railway variables set NODE_ENV=production
    railway variables set LOG_LEVEL=info
    
    # Database
    if [ -n "$DATABASE_URL" ]; then
        railway variables set DATABASE_URL="$DATABASE_URL"
    fi
    
    # Authentication
    if [ -n "$JWT_SECRET" ]; then
        railway variables set JWT_SECRET="$JWT_SECRET"
    fi
    
    # Generate random secrets if not provided
    if [ -z "$JWT_SECRET" ]; then
        local jwt_secret=$(openssl rand -base64 32)
        railway variables set JWT_SECRET="$jwt_secret"
        log "Generated new JWT_SECRET"
    fi
    
    cd ..
    success "Environment variables updated"
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd backend
    
    # Apply migrations
    DATABASE_URL="$DATABASE_URL" npm run db:push || {
        error "Database migration failed"
        return 1
    }
    
    # Seed database if needed
    if [ "$SEED_DATABASE" = true ]; then
        log "Seeding database..."
        DATABASE_URL="$DATABASE_URL" npm run db:seed || {
            warning "Database seeding failed - continuing anyway"
        }
    fi
    
    cd ..
    success "Database migrations completed"
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    cd backend
    
    # Get Railway URL
    local railway_url=$(railway domain 2>/dev/null)
    if [ -z "$railway_url" ]; then
        error "Could not get Railway URL"
        return 1
    fi
    
    local app_url="https://$railway_url"
    
    # Wait for health check
    if ! wait_for_health "$app_url" $HEALTH_CHECK_TIMEOUT; then
        error "Health check failed"
        return 1
    fi
    
    # Test API endpoints
    log "Testing API endpoints..."
    
    # Test health endpoint
    local health_response=$(curl -sf "$app_url/health" | jq -r '.status' 2>/dev/null || echo "failed")
    if [ "$health_response" != "healthy" ]; then
        error "Health endpoint check failed"
        return 1
    fi
    
    # Test API endpoint
    local api_response=$(curl -sf "$app_url/api" | jq -r '.name' 2>/dev/null || echo "failed")
    if [ "$api_response" != "Burstlet API" ]; then
        error "API endpoint check failed"
        return 1
    fi
    
    # Test metrics endpoint
    if ! curl -sf "$app_url/metrics" >/dev/null 2>&1; then
        warning "Metrics endpoint not responding"
    fi
    
    cd ..
    success "Deployment verification completed"
    
    # Export URL for other scripts
    export BACKEND_URL="$app_url"
    echo "$app_url" > .backend_url
}

# Function to update frontend
update_frontend() {
    log "Updating frontend configuration..."
    
    if [ -n "$BACKEND_URL" ]; then
        cd frontend
        
        # Update environment variable in Vercel
        echo "$BACKEND_URL" | vercel env add NEXT_PUBLIC_API_URL production || {
            warning "Failed to update frontend environment variable"
        }
        
        cd ..
        success "Frontend configuration updated"
    fi
}

# Function to rollback deployment
rollback_deployment() {
    if [ "$ROLLBACK_ON_FAILURE" = true ]; then
        warning "Initiating rollback..."
        
        cd backend
        
        # Get previous deployment
        local previous_deployment=$(railway deployments --json | jq -r '.[1].id' 2>/dev/null)
        
        if [ -n "$previous_deployment" ] && [ "$previous_deployment" != "null" ]; then
            log "Rolling back to deployment: $previous_deployment"
            railway rollback "$previous_deployment" || {
                error "Rollback failed - manual intervention required"
            }
        else
            error "No previous deployment found for rollback"
        fi
        
        cd ..
    fi
}

# Function to cleanup
cleanup() {
    log "Cleaning up temporary files..."
    rm -f .backend_url
}

# Main deployment function
main() {
    log "🚀 Starting Burstlet production deployment"
    log "========================================"
    
    # Trap errors for rollback
    trap 'error "Deployment failed"; rollback_deployment; cleanup; exit 1' ERR
    
    # Run deployment steps
    pre_deployment_checks
    build_and_test
    create_backup
    update_environment
    run_migrations
    deploy_to_railway
    verify_deployment
    update_frontend
    
    # Success
    success "🎉 Deployment completed successfully!"
    log ""
    log "Application URLs:"
    log "  Backend:  $BACKEND_URL"
    log "  Frontend: https://burstlet-gilt.vercel.app"
    log ""
    log "Monitoring URLs:"
    log "  Health:   $BACKEND_URL/health"
    log "  Metrics:  $BACKEND_URL/metrics"
    log "  Docs:     $BACKEND_URL/docs"
    log ""
    log "🎯 Production deployment complete!"
    
    cleanup
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-backup)
            BACKUP_BEFORE_DEPLOY=false
            shift
            ;;
        --no-rollback)
            ROLLBACK_ON_FAILURE=false
            shift
            ;;
        --seed)
            SEED_DATABASE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --no-backup     Skip database backup"
            echo "  --no-rollback   Disable automatic rollback on failure"
            echo "  --seed          Seed database after migration"
            echo "  --help          Show this help"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"