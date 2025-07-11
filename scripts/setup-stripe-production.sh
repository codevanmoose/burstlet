#!/bin/bash
# Stripe Production Setup Guide for Burstlet

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

log "🔐 Stripe Production Setup for Burstlet"
log "======================================"

echo
warning "⚠️  IMPORTANT: This guide requires manual setup in Stripe Dashboard"
echo

log "📋 Step 1: Create Stripe Account"
echo "1. Go to https://dashboard.stripe.com/"
echo "2. Create a new account or login to existing account"
echo "3. Complete business verification for production access"
echo

log "💳 Step 2: Create Products and Prices"
echo "Navigate to Products → Create product for each plan:"
echo
echo "🚀 Starter Plan:"
echo "   - Name: Starter Plan"
echo "   - Description: Perfect for individuals and small creators"
echo "   - Price: \$29/month (price_starter)"
echo "   - Features: 100 video generations, 500 blog posts, Basic support"
echo
echo "💼 Professional Plan:"
echo "   - Name: Professional Plan" 
echo "   - Description: For growing businesses and content teams"
echo "   - Price: \$99/month (price_pro)"
echo "   - Features: 500 videos, Unlimited blogs, Priority support, Analytics"
echo
echo "🏢 Enterprise Plan:"
echo "   - Name: Enterprise Plan"
echo "   - Description: For large organizations with advanced needs"
echo "   - Price: \$299/month (price_enterprise)"
echo "   - Features: Unlimited everything, Dedicated support, Custom integrations"
echo

log "🔗 Step 3: Configure Webhooks"
echo "Navigate to Developers → Webhooks → Add endpoint:"
echo
echo "Endpoint URL: https://your-app-url.ondigitalocean.app/api/billing/webhook"
echo "Events to listen for:"
echo "   ✓ customer.subscription.created"
echo "   ✓ customer.subscription.updated"
echo "   ✓ customer.subscription.deleted"
echo "   ✓ invoice.payment_succeeded"
echo "   ✓ invoice.payment_failed"
echo "   ✓ customer.created"
echo "   ✓ customer.updated"
echo "   ✓ payment_method.attached"
echo

log "🔑 Step 4: Get API Keys"
echo "Navigate to Developers → API keys:"
echo "   - Copy Publishable key (starts with pk_live_)"
echo "   - Copy Secret key (starts with sk_live_)"
echo "   - Copy Webhook signing secret (starts with whsec_)"
echo

log "⚙️  Step 5: Configure Environment Variables"
echo
echo "Add these to your DigitalOcean App Platform environment variables:"
echo
echo "STRIPE_SECRET_KEY=sk_live_your_secret_key_here"
echo "STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here"
echo "STRIPE_PRICE_ID_STARTER=price_your_starter_price_id"
echo "STRIPE_PRICE_ID_PRO=price_your_pro_price_id"
echo "STRIPE_PRICE_ID_ENTERPRISE=price_your_enterprise_price_id"
echo

log "🌐 Frontend Environment Variables"
echo "Add to Vercel environment variables:"
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here"
echo

log "🧪 Step 6: Test Payment Flow"
echo "1. Use Stripe test cards:"
echo "   - Success: 4242 4242 4242 4242"
echo "   - Decline: 4000 0000 0000 0002"
echo "   - Authentication: 4000 0025 0000 3155"
echo
echo "2. Test subscription creation and cancellation"
echo "3. Verify webhook events are received"
echo "4. Check customer portal functionality"
echo

log "📊 Step 7: Configure Customer Portal"
echo "Navigate to Settings → Customer portal:"
echo "1. Enable customer portal"
echo "2. Configure allowed actions:"
echo "   ✓ Update payment method"
echo "   ✓ View billing history"
echo "   ✓ Cancel subscription"
echo "   ✓ Update subscription (upgrade/downgrade)"
echo "3. Set business information and branding"
echo

log "🚨 Step 8: Security Checklist"
echo "✓ Enable Radar for fraud detection"
echo "✓ Set up statement descriptors"
echo "✓ Configure tax collection (if applicable)"
echo "✓ Set up Connect (if needed for marketplace)"
echo "✓ Review and customize email receipts"
echo

log "📈 Step 9: Analytics and Reporting"
echo "✓ Enable Revenue Recognition (if applicable)"
echo "✓ Set up Sigma for custom reports"
echo "✓ Configure tax reporting"
echo "✓ Set up automatic payouts"
echo

warning "🔐 Security Best Practices:"
echo "✓ Never expose secret keys in frontend code"
echo "✓ Always validate webhooks with signing secret"
echo "✓ Use HTTPS for all webhook endpoints"
echo "✓ Store API keys as encrypted environment variables"
echo "✓ Regularly rotate API keys"
echo "✓ Monitor for suspicious activity"
echo

success "✅ Stripe setup checklist complete!"
echo
log "Next steps:"
log "1. Complete the manual setup in Stripe Dashboard"
log "2. Add environment variables to DigitalOcean and Vercel"
log "3. Test the complete payment flow"
log "4. Monitor webhook events in Stripe Dashboard"
log "5. Test subscription management in customer portal"

echo
log "🔗 Useful Links:"
echo "   Stripe Dashboard: https://dashboard.stripe.com/"
echo "   Webhooks Testing: https://stripe.com/docs/webhooks/test"
echo "   Test Cards: https://stripe.com/docs/testing#cards"
echo "   Customer Portal: https://stripe.com/docs/billing/subscriptions/customer-portal"