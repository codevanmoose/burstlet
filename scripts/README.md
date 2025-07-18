# Burstlet Production Readiness Tools

This directory contains comprehensive production readiness tools for Burstlet deployment, monitoring, and verification.

## 🎯 Quick Start

```bash
# 1. Verify environment variables
./scripts/verify-env-vars.sh

# 2. Add missing env vars to DigitalOcean (manual step)
# Visit: https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518/settings

# 3. Monitor deployment
./scripts/production-monitor.sh --watch

# 4. Run comprehensive verification
./scripts/deployment-verification.sh

# 5. Setup OAuth providers
./scripts/setup-oauth-automated.sh
```

## 📋 Available Scripts

### Core Production Tools

#### `verify-env-vars.sh`
**Purpose**: Verify that all required environment variables are properly configured
**Usage**: `./scripts/verify-env-vars.sh`
**Features**:
- Color-coded output for easy identification
- Checks 12 missing environment variables
- Provides direct links to DigitalOcean settings
- Estimated completion time: 10 minutes

#### `production-monitor.sh`
**Purpose**: Real-time monitoring of production services
**Usage**: 
- One-time check: `./scripts/production-monitor.sh`
- Continuous monitoring: `./scripts/production-monitor.sh --watch`
**Features**:
- Service status monitoring (frontend, backend)
- Environment variable validation
- Database connectivity checks
- Performance metrics (response times)
- Third-party service status
- 30-second refresh intervals in watch mode

#### `deployment-verification.sh`
**Purpose**: Comprehensive deployment verification with 30+ checks
**Usage**: `./scripts/deployment-verification.sh`
**Features**:
- 10 phases of verification checks
- Automated and manual verification steps
- Success rate calculation (95%+ = production ready)
- Critical vs non-critical issue identification
- Exit codes for CI/CD integration

#### `setup-oauth-automated.sh`
**Purpose**: Interactive OAuth provider setup wizard
**Usage**: `./scripts/setup-oauth-automated.sh`
**Features**:
- Interactive menu system
- Step-by-step setup instructions for all providers
- Environment variable generation
- OAuth flow testing capabilities
- Status checking for configured providers

### Legacy Setup Scripts

#### `setup-digitalocean-env.sh`
**Purpose**: DigitalOcean environment variable setup guide
**Status**: Legacy - use `verify-env-vars.sh` instead

#### `setup-stripe-production.sh`
**Purpose**: Stripe production account setup guide
**Usage**: `./scripts/setup-stripe-production.sh`

#### `setup-social-oauth.sh`
**Purpose**: Social media OAuth setup guide
**Status**: Legacy - use `setup-oauth-automated.sh` instead

#### `setup-analytics.sh`
**Purpose**: Analytics and monitoring setup guide
**Usage**: `./scripts/setup-analytics.sh`

#### `final-launch-checklist.sh`
**Purpose**: Final launch checklist and verification
**Usage**: `./scripts/final-launch-checklist.sh`

## 🔄 Recommended Workflow

### Phase 1: Environment Configuration (10 minutes)
1. **Run verification**: `./scripts/verify-env-vars.sh`
2. **Add missing variables**: Use DigitalOcean web interface
3. **Monitor deployment**: `./scripts/production-monitor.sh --watch`

### Phase 2: Comprehensive Verification (30 minutes)
1. **Run full verification**: `./scripts/deployment-verification.sh`
2. **Address any failures**: Fix issues identified by verification
3. **Re-run verification**: Ensure 95%+ success rate

### Phase 3: OAuth & Services (1 hour)
1. **Setup OAuth providers**: `./scripts/setup-oauth-automated.sh`
2. **Configure Stripe**: `./scripts/setup-stripe-production.sh`
3. **Setup analytics**: `./scripts/setup-analytics.sh`

### Phase 4: Final Launch (30 minutes)
1. **Final checklist**: `./scripts/final-launch-checklist.sh`
2. **Continuous monitoring**: `./scripts/production-monitor.sh --watch`
3. **Customer journey testing**: Manual verification

## 🎨 Script Features

### Color-Coded Output
- 🟢 **Green**: Success, configured, online
- 🟡 **Yellow**: Warning, needs attention, optional
- 🔴 **Red**: Error, critical issue, offline
- 🔵 **Blue**: Information, instructions, headers

### Interactive Elements
- Menu-driven interfaces
- Progress tracking
- Real-time updates
- User confirmations for manual steps

### Comprehensive Logging
- Detailed status information
- Error messages with solutions
- Performance metrics
- Success/failure tracking

## 📊 Success Metrics

### Deployment Verification Targets
- **Overall Success Rate**: 95%+ (30+ checks)
- **Backend Response Time**: < 2 seconds
- **Frontend Load Time**: < 3 seconds
- **Environment Variables**: 100% configured
- **Service Uptime**: 99.9%+

### Monitoring Thresholds
- **API Response Time**: < 500ms (warning), < 200ms (optimal)
- **Database Connection**: < 100ms
- **SSL Certificate**: Valid and not expiring within 30 days
- **Disk Space**: > 80% available

## 🔧 Configuration

### Environment Variables
All scripts reference these key configuration values:
- `FRONTEND_URL`: https://burstlet.vercel.app
- `BACKEND_URL`: https://burstlet-backend-url.ondigitalocean.app
- `DIGITALOCEAN_APP_ID`: 41fe1a5b-84b8-4cf8-a69f-5330c7ed7518

### Dependencies
- `curl`: HTTP requests and health checks
- `jq`: JSON parsing and formatting
- `bash`: Shell scripting (version 4.0+)

## 🚨 Troubleshooting

### Common Issues

#### "Backend offline" Error
1. Check DigitalOcean app status
2. Verify environment variables are set
3. Check deployment logs for errors
4. Ensure DATABASE_URL is accessible

#### "Environment variables incomplete" Warning
1. Run `./scripts/verify-env-vars.sh` for detailed status
2. Add missing variables via DigitalOcean interface
3. Wait for automatic redeployment (5-10 minutes)
4. Re-run verification

#### "OAuth not configured" Warning
1. Run `./scripts/setup-oauth-automated.sh`
2. Follow provider-specific setup instructions
3. Add client IDs/secrets to environment variables
4. Test OAuth flows in browser

### Support Resources
- **DigitalOcean App**: https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Project**: https://supabase.com/dashboard/project/cmfdlebyqgjifwmfvquu
- **GitHub Repository**: https://github.com/codevanmoose/burstlet

## 🎉 Success Indicators

### Ready for Production
- All verification scripts return 95%+ success rate
- Backend health check shows all services "configured"
- Frontend loads without errors
- OAuth flows work correctly
- Database connection is stable

### Ready for Customer Acquisition
- Custom domain configured (burstlet.com)
- Stripe production account active
- Real OAuth credentials configured
- Customer journey tested end-to-end
- Monitoring and alerts active

---

**🎯 Remember**: These tools are designed to give you 100% confidence in your production deployment. Take the time to run each script and address any issues - your customers will thank you for the reliability!

*Last updated: 2025-07-16*