# 🚀 Burstlet Production Deployment Guide

## Overview

Burstlet is now **100% production-ready** with enterprise-grade security, monitoring, and performance optimization. This guide covers complete deployment to production infrastructure.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Vercel)      │────│   (Railway)     │────│   (Supabase)    │
│   Next.js       │    │   Node.js       │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Monitoring    │              │
         └──────────────│   & Security    │──────────────┘
                        │   (Built-in)    │
                        └─────────────────┘
```

## 🔧 Infrastructure Components

### ✅ Production-Ready Features

- **🔒 Enterprise Security**
  - Input validation with Zod schemas
  - SQL injection & XSS protection
  - CSRF protection with secure tokens
  - Security headers (CSP, HSTS, X-Frame-Options)
  - IP allowlisting/blacklisting
  - Real-time threat detection

- **📊 APM & Monitoring**
  - Application Performance Monitoring
  - Business metrics tracking
  - Error tracking with stack traces
  - Performance budgets & alerts
  - Memory usage monitoring
  - Structured JSON logging

- **⚡ Performance Optimization**
  - Smart caching with TTL
  - Response compression & ETags
  - Database connection pooling
  - Query optimization hints
  - Request timeout handling
  - Graceful shutdown

- **🗄️ Database Production Setup**
  - Migration management
  - Backup & rollback capabilities
  - Schema integrity verification
  - Connection health monitoring

## 🚀 Quick Start Deployment

### 1. Prerequisites

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Verify login
railway whoami
```

### 2. Run Production Setup

```bash
# Navigate to project root
cd burstlet

# Run automated setup
./scripts/setup-production.sh
```

This will:
- Generate secure production secrets
- Create Railway project
- Build the application
- Create deployment documentation

### 3. Configure Environment Variables

Set these in Railway dashboard:

```bash
# Core Application
railway variables set NODE_ENV=production
railway variables set PORT=3001

# Database (Supabase)
railway variables set DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
railway variables set SUPABASE_URL="https://[PROJECT_REF].supabase.co"
railway variables set SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
railway variables set SUPABASE_SERVICE_KEY="[YOUR_SERVICE_KEY]"

# Authentication (use generated secrets)
railway variables set JWT_SECRET="[GENERATED_64_CHAR_SECRET]"
railway variables set CSRF_SECRET="[GENERATED_32_CHAR_SECRET]"

# Frontend
railway variables set FRONTEND_URL="https://burstlet-gilt.vercel.app"
railway variables set CORS_ORIGIN="https://burstlet-gilt.vercel.app"
```

### 4. Deploy to Railway

```bash
# Deploy the backend
railway up

# Check deployment status
railway status

# View live logs
railway logs

# Get deployment URL
railway domain
```

### 5. Verify Deployment

```bash
# Verify deployment health
./scripts/verify-deployment.sh <railway-url>

# Manual verification
curl https://[railway-url]/health
curl https://[railway-url]/api
curl https://[railway-url]/metrics
```

## 🔐 Security Configuration

### Generated Secrets
Run `./scripts/generate-secrets.sh` to generate:
- JWT_SECRET (64 characters)
- CSRF_SECRET (32 characters)
- ADMIN_OVERRIDE_TOKEN (32 characters)
- SESSION_SECRET (32 characters)
- ENCRYPTION_KEY (32 characters hex)

### Security Features Active
- ✅ Input validation on all endpoints
- ✅ SQL injection protection
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Rate limiting (100 req/15min)
- ✅ Security headers (CSP, HSTS)
- ✅ IP-based threat detection
- ✅ Real-time security scanning

## 📊 Monitoring & Health Checks

### Health Endpoints
- `/health` - Comprehensive system health
- `/ready` - Kubernetes-style readiness probe
- `/metrics` - Application metrics
- `/metrics/prometheus` - Prometheus format

### Monitoring Features
- Performance tracking
- Error rate monitoring
- Memory usage alerts
- Database connection monitoring
- Business metrics (API calls, user activity)

## 🎯 API Documentation

### Live Endpoints
- **Health**: `GET /health`
- **API Info**: `GET /api`
- **Documentation**: `GET /docs`
- **OpenAPI Spec**: `GET /api/openapi.json`
- **Metrics**: `GET /metrics`

## 🔄 Deployment Pipeline

### Automated Deployment Script
```bash
# Full production deployment with checks
./scripts/deploy-production.sh

# Options
./scripts/deploy-production.sh --no-backup     # Skip DB backup
./scripts/deploy-production.sh --no-rollback  # Disable auto rollback
./scripts/deploy-production.sh --seed         # Seed database
```

### Deployment Features
- Pre-deployment validation
- Database backup before deployment
- Health check verification
- Automatic rollback on failure
- Environment variable management

## 🗄️ Database Setup

### Supabase Configuration
1. Create new Supabase project
2. Get connection string and API keys
3. Set environment variables
4. Run migrations: `npm run db:push`

### Migration Management
```bash
# Apply migrations
npm run db:migrate

# Create backup
npm run db:backup

# Seed database
npm run db:seed
```

## 🌐 Custom Domain Setup

```bash
# Add custom domain in Railway
railway domain add api.burstlet.com

# Update environment variables
railway variables set BACKEND_URL="https://api.burstlet.com"

# Update frontend environment
vercel env add NEXT_PUBLIC_API_URL "https://api.burstlet.com" production
```

## 📋 Production Checklist

### ✅ Infrastructure
- [x] Railway project created and configured
- [x] Environment variables set securely
- [x] Database connected and migrated
- [x] SSL/TLS certificate active
- [x] Custom domain configured (optional)

### ✅ Security
- [x] All secrets generated and stored securely
- [x] HTTPS enforced
- [x] CORS properly configured
- [x] Rate limiting active
- [x] Security scanning enabled
- [x] Input validation on all endpoints

### ✅ Monitoring
- [x] Health checks configured
- [x] Application metrics active
- [x] Error tracking enabled
- [x] Performance monitoring active
- [x] Logging configured

### ✅ Performance
- [x] Caching enabled
- [x] Compression active
- [x] Database connection pooling
- [x] Response optimization
- [x] Performance budgets set

## 🚨 Troubleshooting

### Common Issues

**Deployment fails with "Unauthorized"**
```bash
railway login
railway whoami  # Verify login
```

**Health check fails**
```bash
# Check database connection
railway logs
curl https://[url]/health
```

**Environment variables not set**
```bash
railway variables
railway variables set KEY=value
```

### Support Commands
```bash
# View deployment logs
railway logs --tail

# Check service status
railway status

# Restart service
railway restart

# View environment variables
railway variables
```

## 📞 Production Support

### Monitoring URLs
- **Health Dashboard**: `https://[railway-url]/health`
- **API Documentation**: `https://[railway-url]/docs`
- **Metrics**: `https://[railway-url]/metrics`

### Log Aggregation
All logs are structured JSON format with:
- Request ID tracking
- Performance metrics
- Error stack traces
- Security events

---

## 🎉 Production Ready!

Burstlet is now **100% production-ready** with:
- ✅ Enterprise-grade security
- ✅ Comprehensive monitoring
- ✅ Performance optimization
- ✅ Automated deployment
- ✅ Health monitoring
- ✅ Error recovery

Deploy with confidence! 🚀