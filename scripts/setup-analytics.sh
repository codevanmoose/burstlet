#!/bin/bash
# Analytics and Monitoring Setup for Burstlet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

log "📊 Analytics and Monitoring Setup for Burstlet"
log "=============================================="

echo
log "🎯 Step 1: Google Analytics 4 Setup"
echo "=========================================="
echo "1. Go to Google Analytics: https://analytics.google.com/"
echo "2. Create a new property:"
echo "   - Property name: Burstlet"
echo "   - Country: United States (or your location)"
echo "   - Currency: USD"
echo "   - Industry category: Software"
echo "3. Create a Web data stream:"
echo "   - Website URL: https://burstlet.com"
echo "   - Stream name: Burstlet Website"
echo "4. Copy the Measurement ID (G-XXXXXXXXXX)"
echo "5. Add to frontend environment variables:"
echo "   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX"
echo

log "📈 Step 2: Conversion Tracking Setup"
echo "=========================================="
echo "Configure these events in Google Analytics:"
echo
echo "🎯 Key Events to Track:"
echo "   • sign_up (User registration)"
echo "   • trial_start (Free trial activation)"
echo "   • purchase (Subscription upgrade)"
echo "   • content_create (Video/content generation)"
echo "   • platform_connect (Social media connection)"
echo "   • content_publish (Content posted to platforms)"
echo
echo "💰 E-commerce Events:"
echo "   • begin_checkout (Pricing page visit)"
echo "   • add_payment_info (Payment method added)"
echo "   • purchase (Successful subscription)"
echo "   • refund (Subscription cancellation)"
echo

log "🔥 Step 3: Facebook/Meta Pixel Setup"
echo "=========================================="
echo "1. Go to Meta Business Manager: https://business.facebook.com/"
echo "2. Create a new pixel:"
echo "   - Pixel name: Burstlet Conversion Tracking"
echo "   - Website URL: https://burstlet.com"
echo "3. Copy the Pixel ID"
echo "4. Add to frontend environment variables:"
echo "   NEXT_PUBLIC_FACEBOOK_PIXEL_ID=XXXXXXXXXXXXXXX"
echo
echo "🎯 Meta Events to Track:"
echo "   • PageView (All page visits)"
echo "   • Lead (Trial signup)"
echo "   • Purchase (Subscription conversion)"
echo "   • CompleteRegistration (Account creation)"
echo "   • InitiateCheckout (Pricing page visit)"
echo

log "🔍 Step 4: Google Ads Conversion Tracking"
echo "=========================================="
echo "1. Go to Google Ads: https://ads.google.com/"
echo "2. Navigate to Tools → Conversions"
echo "3. Create conversion actions:"
echo "   - Trial Signup (Leads)"
echo "   - Subscription Purchase (Sales)"
echo "   - Content Creation (Engagement)"
echo "4. Copy conversion IDs and labels"
echo "5. Add to frontend environment variables:"
echo "   NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXXX"
echo "   NEXT_PUBLIC_TRIAL_CONVERSION_LABEL=XXXXXXXXXXXX"
echo "   NEXT_PUBLIC_PURCHASE_CONVERSION_LABEL=XXXXXXXXXXXX"
echo

log "🐛 Step 5: Error Tracking (Sentry)"
echo "=========================================="
echo "1. Go to Sentry: https://sentry.io/"
echo "2. Create a new project:"
echo "   - Platform: Next.js"
echo "   - Project name: Burstlet Frontend"
echo "3. Create another project:"
echo "   - Platform: Node.js"
echo "   - Project name: Burstlet Backend"
echo "4. Copy the DSN URLs"
echo "5. Add to environment variables:"
echo "   Frontend: NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx"
echo "   Backend: SENTRY_DSN=https://xxx@sentry.io/xxx"
echo

log "📱 Step 6: User Behavior Analytics (Hotjar)"
echo "=========================================="
echo "1. Go to Hotjar: https://www.hotjar.com/"
echo "2. Create a new site:"
echo "   - Site URL: https://burstlet.com"
echo "   - Industry: SaaS"
echo "3. Copy the Site ID"
echo "4. Add to frontend environment variables:"
echo "   NEXT_PUBLIC_HOTJAR_ID=XXXXXXX"
echo "   NEXT_PUBLIC_HOTJAR_VERSION=6"
echo
echo "🎯 Hotjar Features to Enable:"
echo "   • Heatmaps (Landing page, pricing page)"
echo "   • Session recordings (User journey analysis)"
echo "   • Surveys (Exit intent, NPS)"
echo "   • Funnels (Registration to conversion)"
echo

log "💬 Step 7: Customer Support (Intercom)"
echo "=========================================="
echo "1. Go to Intercom: https://www.intercom.com/"
echo "2. Create a new workspace:"
echo "   - Workspace name: Burstlet"
echo "   - Website: https://burstlet.com"
echo "3. Get the App ID from Settings → Installation"
echo "4. Add to frontend environment variables:"
echo "   NEXT_PUBLIC_INTERCOM_APP_ID=xxxxxxxx"
echo
echo "🛠️ Intercom Setup:"
echo "   • Enable live chat widget"
echo "   • Set up automated responses"
echo "   • Create help articles"
echo "   • Configure user data sync"
echo

log "⚡ Step 8: Uptime Monitoring (UptimeRobot)"
echo "=========================================="
echo "1. Go to UptimeRobot: https://uptimerobot.com/"
echo "2. Create monitors for:"
echo "   - Frontend: https://burstlet.com"
echo "   - Backend API: https://your-api-url/health"
echo "   - Key endpoints: /api/auth, /api/generation"
echo "3. Set up alerts:"
echo "   - Email notifications"
echo "   - Slack integration (optional)"
echo "   - SMS alerts for critical issues"
echo

log "📊 Step 9: Performance Monitoring (Web Vitals)"
echo "=========================================="
echo "1. Enable Core Web Vitals tracking in Google Analytics"
echo "2. Set up Google PageSpeed Insights monitoring"
echo "3. Configure alerts for:"
echo "   - Largest Contentful Paint (LCP) > 2.5s"
echo "   - First Input Delay (FID) > 100ms"
echo "   - Cumulative Layout Shift (CLS) > 0.1"
echo

log "🎛️ Step 10: Custom Analytics Dashboard"
echo "=========================================="
echo "Create a custom dashboard in Google Analytics with:"
echo
echo "📊 Key Metrics to Monitor:"
echo "   • User Acquisition:"
echo "     - New users per day/week/month"
echo "     - Traffic sources (organic, paid, social, referral)"
echo "     - Landing page performance"
echo
echo "   • Engagement:"
echo "     - Session duration"
echo "     - Pages per session"
echo "     - Bounce rate"
echo "     - Trial signup rate"
echo
echo "   • Conversion:"
echo "     - Trial to paid conversion rate"
echo "     - Revenue per user"
echo "     - Customer lifetime value"
echo "     - Churn rate"
echo
echo "   • Product Usage:"
echo "     - Videos generated per user"
echo "     - Platform connections"
echo "     - Content published"
echo "     - Feature adoption rates"
echo

log "🔔 Step 11: Alert Configuration"
echo "=========================================="
echo "Set up alerts for:"
echo
echo "🚨 Critical Alerts (Immediate):"
echo "   • Website down (< 99% uptime)"
echo "   • API errors (> 5% error rate)"
echo "   • Payment failures (> 2% failure rate)"
echo "   • Security incidents"
echo
echo "⚠️  Warning Alerts (1 hour):"
echo "   • Conversion rate drop (> 20% decrease)"
echo "   • High bounce rate (> 80%)"
echo "   • Slow page load (> 3 seconds)"
echo "   • User complaints/negative feedback"
echo
echo "📈 Growth Alerts (Daily):"
echo "   • Signup goals met/missed"
echo "   • Revenue targets"
echo "   • Usage milestones"
echo "   • Feature adoption rates"
echo

log "📋 Environment Variables Summary"
echo "=========================================="
echo "Add these to your frontend environment variables:"
echo
echo "# Analytics"
echo "NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX"
echo "NEXT_PUBLIC_FACEBOOK_PIXEL_ID=XXXXXXXXXXXXXXX"
echo "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXXX"
echo "NEXT_PUBLIC_TRIAL_CONVERSION_LABEL=XXXXXXXXXXXX"
echo "NEXT_PUBLIC_PURCHASE_CONVERSION_LABEL=XXXXXXXXXXXX"
echo
echo "# Error Tracking"
echo "NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx"
echo
echo "# User Behavior"
echo "NEXT_PUBLIC_HOTJAR_ID=XXXXXXX"
echo "NEXT_PUBLIC_HOTJAR_VERSION=6"
echo
echo "# Customer Support"
echo "NEXT_PUBLIC_INTERCOM_APP_ID=xxxxxxxx"
echo

warning "🔐 Security Notes:"
echo "✓ Only use 'NEXT_PUBLIC_' prefix for frontend variables"
echo "✓ Keep backend Sentry DSN private"
echo "✓ Never expose API keys or secrets"
echo "✓ Use environment-specific tracking IDs"
echo "✓ Test all tracking in development first"

success "✅ Analytics setup guide complete!"
echo
log "Next steps:"
log "1. Create accounts on all platforms"
log "2. Configure tracking codes and pixels"
log "3. Set up conversion events"
log "4. Test all tracking in development"
log "5. Deploy tracking codes to production"
log "6. Monitor and optimize based on data"

echo
log "🔗 Quick Links:"
echo "   Google Analytics: https://analytics.google.com/"
echo "   Meta Business: https://business.facebook.com/"
echo "   Google Ads: https://ads.google.com/"
echo "   Sentry: https://sentry.io/"
echo "   Hotjar: https://www.hotjar.com/"
echo "   Intercom: https://www.intercom.com/"
echo "   UptimeRobot: https://uptimerobot.com/"