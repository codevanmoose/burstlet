#!/bin/bash
# Social Media OAuth Apps Setup Guide for Burstlet

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

log "📱 Social Media OAuth Apps Setup for Burstlet"
log "============================================="

echo
warning "⚠️  IMPORTANT: Each platform requires manual app creation and approval"
echo

log "🎬 YouTube OAuth App Setup"
echo "=========================================="
echo "1. Go to Google Cloud Console: https://console.cloud.google.com/"
echo "2. Create a new project or select existing project"
echo "3. Enable YouTube Data API v3:"
echo "   - Navigate to APIs & Services → Library"
echo "   - Search for 'YouTube Data API v3'"
echo "   - Click Enable"
echo "4. Create OAuth 2.0 credentials:"
echo "   - Go to APIs & Services → Credentials"
echo "   - Click 'Create Credentials' → 'OAuth 2.0 Client IDs'"
echo "   - Application type: Web application"
echo "   - Name: Burstlet YouTube Integration"
echo "   - Authorized redirect URIs:"
echo "     * https://your-domain.com/api/platforms/youtube/callback"
echo "     * https://burstlet.com/api/platforms/youtube/callback"
echo "5. Configure OAuth consent screen:"
echo "   - User Type: External"
echo "   - App name: Burstlet"
echo "   - User support email: support@burstlet.com"
echo "   - Scopes: YouTube Data API v3 (upload and manage videos)"
echo
echo "Required Environment Variables:"
echo "YOUTUBE_CLIENT_ID=your_client_id"
echo "YOUTUBE_CLIENT_SECRET=your_client_secret"
echo

log "🎵 TikTok OAuth App Setup"
echo "=========================================="
echo "1. Go to TikTok for Developers: https://developers.tiktok.com/"
echo "2. Create a new app:"
echo "   - App name: Burstlet"
echo "   - App description: AI-powered content creation and distribution"
echo "   - Category: Productivity"
echo "3. Configure app settings:"
echo "   - Platform: Web"
echo "   - Redirect URI: https://your-domain.com/api/platforms/tiktok/callback"
echo "4. Request permissions:"
echo "   - user.info.basic"
echo "   - video.upload"
echo "   - video.publish"
echo "5. Submit for review (may take 1-2 weeks)"
echo
echo "Required Environment Variables:"
echo "TIKTOK_CLIENT_ID=your_client_id"
echo "TIKTOK_CLIENT_SECRET=your_client_secret"
echo

log "📷 Instagram OAuth App Setup"
echo "=========================================="
echo "1. Go to Meta for Developers: https://developers.facebook.com/"
echo "2. Create a new app:"
echo "   - App type: Business"
echo "   - App name: Burstlet"
echo "   - Contact email: support@burstlet.com"
echo "3. Add Instagram Basic Display product:"
echo "   - Go to App Dashboard → Add Product"
echo "   - Select Instagram Basic Display → Set Up"
echo "4. Create Instagram App:"
echo "   - Display Name: Burstlet"
echo "   - Valid OAuth Redirect URIs:"
echo "     * https://your-domain.com/api/platforms/instagram/callback"
echo "5. Configure permissions:"
echo "   - instagram_graph_user_profile"
echo "   - instagram_graph_user_media"
echo "   - pages_show_list"
echo "   - pages_read_engagement"
echo "6. Submit for app review"
echo
echo "Required Environment Variables:"
echo "INSTAGRAM_CLIENT_ID=your_app_id"
echo "INSTAGRAM_CLIENT_SECRET=your_app_secret"
echo

log "🐦 Twitter/X OAuth App Setup"
echo "=========================================="
echo "1. Go to Twitter Developer Portal: https://developer.twitter.com/"
echo "2. Apply for developer account (if not already approved)"
echo "3. Create a new project and app:"
echo "   - Project name: Burstlet Integration"
echo "   - App name: Burstlet"
echo "   - App description: AI-powered content creation and distribution platform"
echo "4. Configure app settings:"
echo "   - App permissions: Read and Write"
echo "   - Callback URLs:"
echo "     * https://your-domain.com/api/platforms/twitter/callback"
echo "   - Website URL: https://burstlet.com"
echo "5. Enable OAuth 2.0:"
echo "   - Type of App: Web App, Automated App or Bot"
echo "   - Callback URI: https://your-domain.com/api/platforms/twitter/callback"
echo "6. Get API keys and tokens:"
echo "   - API Key (Consumer Key)"
echo "   - API Secret Key (Consumer Secret)"
echo "   - Bearer Token"
echo "   - Access Token"
echo "   - Access Token Secret"
echo
echo "Required Environment Variables:"
echo "TWITTER_CLIENT_ID=your_api_key"
echo "TWITTER_CLIENT_SECRET=your_api_secret_key"
echo "TWITTER_BEARER_TOKEN=your_bearer_token"
echo

log "🔗 OAuth Redirect URLs Summary"
echo "=========================================="
echo "Make sure to add these redirect URLs to each platform:"
echo
echo "Production URLs:"
echo "https://burstlet.com/api/platforms/youtube/callback"
echo "https://burstlet.com/api/platforms/tiktok/callback"
echo "https://burstlet.com/api/platforms/instagram/callback"
echo "https://burstlet.com/api/platforms/twitter/callback"
echo
echo "Development URLs:"
echo "http://localhost:3000/api/platforms/youtube/callback"
echo "http://localhost:3000/api/platforms/tiktok/callback"
echo "http://localhost:3000/api/platforms/instagram/callback"
echo "http://localhost:3000/api/platforms/twitter/callback"
echo

log "📋 Environment Variables Summary"
echo "=========================================="
echo "Add these to your DigitalOcean App Platform:"
echo
echo "# YouTube"
echo "YOUTUBE_CLIENT_ID=your_youtube_client_id"
echo "YOUTUBE_CLIENT_SECRET=your_youtube_client_secret"
echo
echo "# TikTok"
echo "TIKTOK_CLIENT_ID=your_tiktok_client_id"
echo "TIKTOK_CLIENT_SECRET=your_tiktok_client_secret"
echo
echo "# Instagram"
echo "INSTAGRAM_CLIENT_ID=your_instagram_app_id"
echo "INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret"
echo
echo "# Twitter/X"
echo "TWITTER_CLIENT_ID=your_twitter_api_key"
echo "TWITTER_CLIENT_SECRET=your_twitter_api_secret"
echo "TWITTER_BEARER_TOKEN=your_twitter_bearer_token"
echo

log "⏰ Review and Approval Timeline"
echo "=========================================="
echo "Platform approval timelines (approximate):"
echo "✓ YouTube: Instant (Google Cloud project)"
echo "⏰ TikTok: 1-2 weeks review process"
echo "⏰ Instagram: 1-2 weeks review process"
echo "✓ Twitter: Usually instant for basic access"
echo

warning "🚨 Important Notes:"
echo "✓ Some platforms require business verification"
echo "✓ Apps may need to pass security review"
echo "✓ Rate limits apply to all APIs"
echo "✓ Terms of service compliance is required"
echo "✓ Some features require special permissions"
echo
echo "✓ Test with sandbox/development credentials first"
echo "✓ Keep API keys secure and never expose in frontend"
echo "✓ Monitor API usage and costs"
echo "✓ Have backup plans for API changes"
echo

success "✅ Social Media OAuth setup guide complete!"
echo
log "Next steps:"
log "1. Create apps on each platform following the guides above"
log "2. Add environment variables to DigitalOcean"
log "3. Test OAuth flows in development"
log "4. Submit for platform review where required"
log "5. Monitor API usage and compliance"

echo
log "🔗 Quick Links:"
echo "   Google Cloud Console: https://console.cloud.google.com/"
echo "   TikTok Developers: https://developers.tiktok.com/"
echo "   Meta for Developers: https://developers.facebook.com/"
echo "   Twitter Developer Portal: https://developer.twitter.com/"