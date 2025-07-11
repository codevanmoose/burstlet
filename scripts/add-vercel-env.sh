#!/bin/bash
# Script to add environment variables to Vercel

cd frontend

# Supabase
echo "Adding Supabase environment variables..."
echo "https://cmfdlebyqgjifwmfvquu.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZmRsZWJ5cWdqaWZ3bWZ2cXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1Mzg2OTksImV4cCI6MjA1MjExNDY5OX0.ujXfI6IbDOdJFn9YNqImT9x5Q7XyQ0cBxRp5LdcAvDM" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# NextAuth
echo "Adding NextAuth environment variables..."
openssl rand -base64 32 | vercel env add NEXTAUTH_SECRET production
echo "https://burstlet-gilt.vercel.app" | vercel env add NEXTAUTH_URL production

# API URL
echo "Adding API URL..."
echo "https://api.burstlet.com" | vercel env add NEXT_PUBLIC_API_URL production

# App URL
echo "Adding App URL..."
echo "https://burstlet-gilt.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production

# Google OAuth (placeholder - needs real values)
echo "Adding Google OAuth placeholders..."
echo "your-google-client-id" | vercel env add GOOGLE_CLIENT_ID production
echo "your-google-client-secret" | vercel env add GOOGLE_CLIENT_SECRET production

# Stripe (placeholder - needs real values)
echo "Adding Stripe placeholders..."
echo "pk_live_your-stripe-publishable-key" | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

echo "Environment variables added successfully!"
echo "Note: You need to update the following with real values:"
echo "  - GOOGLE_CLIENT_ID"
echo "  - GOOGLE_CLIENT_SECRET"
echo "  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo ""
echo "You may also need to update NEXT_PUBLIC_API_URL when backend is deployed"