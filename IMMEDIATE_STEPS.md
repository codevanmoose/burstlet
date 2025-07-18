# Immediate Steps to Complete Burstlet Setup

## Step 1: Get Your Supabase Database Password

You need to either:
- **Remember it**: Check your password manager for "Supabase" or "Burstlet"
- **Reset it**: Go to https://supabase.com/dashboard/project/cmfdlebyqgjifwmfvquu/settings/database and click "Reset database password"

## Step 2: Open the Environment Variables File

Open this file: `/scripts/digitalocean-env-vars.txt`

Replace `YOUR_PASSWORD_HERE` with your actual Supabase password in the DATABASE_URL line.

## Step 3: Add Variables to DigitalOcean

1. Go to: https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518/settings
2. Click **"Environment Variables"** tab
3. Click **"Edit"** button
4. Add each variable from the file:
   - Click **"Add Variable"**
   - Copy the variable name (before the =)
   - Copy the value (after the =)
   - For SECRET variables, check **"Encrypt"**
   - Click the checkmark

## Step 4: Priority Variables (Add These First)

These are the MUST-HAVE variables to get the app working:

1. **DATABASE_URL** (SECRET) - With your actual password
2. **SUPABASE_URL** - Already filled in the file
3. **SUPABASE_SERVICE_KEY** (SECRET) - Already filled in the file
4. **SUPABASE_ANON_KEY** - Already filled in the file
5. **REDIS_URL** (SECRET) - Use `redis://localhost:6379` for now
6. **JWT_SECRET** (SECRET) - Already filled in the file
7. **FRONTEND_URL** - Already filled in the file

## Step 5: Save and Deploy

After adding the variables:
1. Click **"Save"** at the bottom
2. The app will automatically redeploy (takes 5-10 minutes)

## Step 6: Update Vercel Frontend

While waiting for DigitalOcean:
1. Go to: https://vercel.com/dashboard
2. Click on "burstlet" project
3. Go to Settings → Environment Variables
4. Add: **NEXT_PUBLIC_API_URL** = `https://burstlet-api-wyn4p.ondigitalocean.app/api`
5. Redeploy the frontend

## Step 7: Verify Everything Works

After both deployments complete:
```bash
# Check backend health
curl https://burstlet-api-wyn4p.ondigitalocean.app/health

# Should show all services as true
```

## What You Need RIGHT NOW:

1. **Your Supabase database password**
2. **10 minutes to add the variables**
3. **That's it!**

The other API keys (OpenAI, Stripe, etc.) can be added later when you have them.