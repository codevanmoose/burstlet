# 📋 Burstlet Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

### Code Preparation
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Code linted (`npm run lint`)
- [ ] Visual regression tests updated (`npm run test:visual`)
- [ ] Environment variables documented
- [ ] API documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json

### Security Review
- [ ] No hardcoded secrets or API keys
- [ ] Environment variables properly typed
- [ ] API endpoints have proper authentication
- [ ] Rate limiting configured
- [ ] CORS origins restricted
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] HTTPS enforced

## Deployment Steps

### 1. Supabase Setup ✅
- [ ] Project created
- [ ] Database password saved securely
- [ ] Connection pooling enabled
- [ ] RLS policies created
- [ ] Storage buckets configured
- [ ] Backup schedule enabled
- [ ] API keys copied

### 2. Vercel Frontend ✅
- [ ] GitHub repo connected
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] Custom domain configured
- [ ] Preview deployments enabled
- [ ] Analytics enabled
- [ ] Edge functions region set

### 3. DigitalOcean Backend ✅
- [ ] App created from GitHub
- [ ] Web service configured
- [ ] Worker service added
- [ ] Redis database created
- [ ] Environment variables set
- [ ] Health checks configured
- [ ] Auto-deploy enabled
- [ ] Monitoring enabled

### 4. Stripe Setup ✅
- [ ] Products created (Starter, Pro, Enterprise)
- [ ] Prices configured
- [ ] Webhook endpoint added
- [ ] Webhook events selected
- [ ] Test mode verified working
- [ ] Live mode keys ready
- [ ] Customer portal configured

### 5. OAuth Providers ✅
- [ ] Google Cloud project created
- [ ] Google OAuth credentials configured
- [ ] YouTube API enabled
- [ ] TikTok app created
- [ ] Instagram app configured
- [ ] Twitter app set up
- [ ] All redirect URIs added
- [ ] Scopes verified

### 6. Domain & DNS ✅
- [ ] Domain purchased/transferred
- [ ] DNS records configured
- [ ] SSL certificates active
- [ ] www redirect working
- [ ] API subdomain configured
- [ ] Email records (SPF, DKIM)

## Post-Deployment Verification

### Functional Testing
- [ ] User registration working
- [ ] Google OAuth login successful
- [ ] Video generation creates job
- [ ] Queue processing active
- [ ] File uploads working
- [ ] Social media posting verified
- [ ] Analytics tracking data
- [ ] Billing checkout flow works
- [ ] Webhooks receiving events

### Performance Testing
- [ ] Frontend Lighthouse score > 90
- [ ] API response time < 200ms
- [ ] Database queries optimized
- [ ] CDN caching working
- [ ] Image optimization active
- [ ] Bundle size acceptable

### Monitoring Setup
- [ ] Uptime monitoring active
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Log aggregation working
- [ ] Alerts configured
- [ ] Backup verification scheduled

## First Week Tasks

### Day 1
- [ ] Monitor error logs
- [ ] Check queue processing
- [ ] Verify backup completed
- [ ] Review initial metrics

### Day 2-3
- [ ] First user feedback collected
- [ ] Performance bottlenecks identified
- [ ] Security scan completed
- [ ] Cost tracking started

### Day 4-7
- [ ] Usage patterns analyzed
- [ ] Scaling needs assessed
- [ ] Documentation updated
- [ ] Team training completed

## Rollback Plan

If issues arise:

1. **Frontend Rollback**:
   - Vercel: Instant rollback to previous deployment
   - Command: Use Vercel dashboard

2. **Backend Rollback**:
   - DigitalOcean: Redeploy previous commit
   - Database: Restore from backup if needed

3. **Emergency Contacts**:
   - DevOps Lead: [contact]
   - Database Admin: [contact]
   - Security Team: [contact]

## Launch Communication

### Internal
- [ ] Team notified of go-live
- [ ] Support team briefed
- [ ] Documentation shared
- [ ] Access credentials distributed

### External
- [ ] Beta users notified
- [ ] Social media announcement
- [ ] Email campaign scheduled
- [ ] Press release ready

## Success Metrics

Track these KPIs post-launch:

- **User Acquisition**: Daily signups
- **Activation Rate**: Users who generate first content
- **Performance**: Average response times
- **Reliability**: Uptime percentage
- **Revenue**: MRR growth
- **Support**: Ticket volume and resolution time

---

## Notes Section

_Add any deployment-specific notes here_

```
Date: 
Deployed by: 
Version: 
Issues encountered: 
Resolutions: 
```

---

🎯 **Remember**: Take your time, test thoroughly, and celebrate the launch! 🎉