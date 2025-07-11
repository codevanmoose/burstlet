#!/bin/bash
# Generate secure secrets for production deployment

set -e

echo "🔐 Generating secure secrets for Burstlet production deployment"
echo "================================================================"

# Function to generate random string
generate_secret() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate hex string
generate_hex() {
    local length=$1
    openssl rand -hex $((length/2))
}

echo
echo "📝 Copy these secrets to your environment configuration:"
echo

echo "# Authentication Secrets"
echo "JWT_SECRET=$(generate_secret 64)"
echo "CSRF_SECRET=$(generate_secret 32)"
echo "ADMIN_OVERRIDE_TOKEN=$(generate_secret 32)"
echo

echo "# Session Secrets"
echo "SESSION_SECRET=$(generate_secret 32)"
echo "ENCRYPTION_KEY=$(generate_hex 32)"
echo

echo "# API Keys (replace with real values)"
echo "OPENAI_API_KEY=sk-your-openai-key-here"
echo "HAILUOAI_API_KEY=your-hailuoai-key-here"
echo "MINIMAX_API_KEY=your-minimax-key-here"
echo "RESEND_API_KEY=re_your-resend-key-here"
echo

echo "# Stripe Keys (replace with real values)"
echo "STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key"
echo "STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret"
echo

echo "# Social Media Keys (replace with real values)"
echo "YOUTUBE_CLIENT_SECRET=your-youtube-client-secret"
echo "TIKTOK_CLIENT_SECRET=your-tiktok-client-secret"
echo "INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret"
echo "TWITTER_CLIENT_SECRET=your-twitter-client-secret"
echo

echo "🔒 SECURITY NOTES:"
echo "- Store these secrets securely"
echo "- Never commit secrets to version control"
echo "- Use different secrets for each environment"
echo "- Rotate secrets regularly"
echo "- Replace placeholder API keys with real values"

echo
echo "✅ Secrets generated successfully!"