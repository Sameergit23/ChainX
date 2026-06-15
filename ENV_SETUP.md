# Environment Variables Setup Guide

This guide will show you how to set up all required environment variables for ChainX.

## 📁 Step 1: Create or Update `.env.local` File

Create a file named `.env.local` in the **root directory** of your project (same level as `package.json`).

**Location:** `D:\ChainX\.env.local`

## 📝 Step 2: Add Environment Variables

Open `.env.local` and add the following variables:

```env
# Supabase Public Credentials (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (Required for Admin Operations)
# ⚠️ WARNING: Keep this secret! Never commit to Git!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔑 Step 3: Get Your Supabase Credentials

### For `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Find:
   - **Project URL** → Copy to `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Copy to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### For `SUPABASE_SERVICE_ROLE_KEY`:

1. In the same **Settings** → **API** page
2. Scroll down to find **service_role secret** key
3. ⚠️ **IMPORTANT**: This key has admin privileges - keep it secret!
4. Copy to `SUPABASE_SERVICE_ROLE_KEY`

**Example:**
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0ODUyMDY0MCwiZXhwIjoxOTY0MDk2NjQwfQ.xxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQ4NTIwNjQwLCJleHAiOjE5NjQwOTY2NDB9.yyyyyyyyyyyyy
```

## ✅ Step 4: Verify Your Setup

After adding variables:

1. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

2. **Check the console** - You should see:
   ```
   Supabase URL: Present
   Supabase Anon Key: Present
   ```

3. **Test the application** - Try registering a new user

## 📋 Complete `.env.local` Template

Copy and paste this template, then fill in your actual values:

```env
# ============================================
# ChainX Environment Variables
# ============================================

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Email/WhatsApp/SMS Service Keys (for credential sending)
# RESEND_API_KEY=re_xxxxxxxxxxxxx
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
# TWILIO_AUTH_TOKEN=your_twilio_auth_token
# TWILIO_WHATSAPP_NUMBER=+14155238886
```

## 🛡️ Security Best Practices

1. **Never commit `.env.local` to Git:**
   - ✅ It's already in `.gitignore`
   - ✅ Never share your service role key publicly

2. **Use different keys for different environments:**
   - Development: `.env.local`
   - Production: Set in your hosting platform (Vercel, Netlify, etc.)

3. **Service Role Key:**
   - ⚠️ Has admin privileges - can bypass RLS
   - ⚠️ Only use in server-side code (API routes)
   - ⚠️ Never expose to client-side

## 🔍 Troubleshooting

### Issue: "Supabase environment variables not configured"
**Solution:**
- Check that `.env.local` is in the project root
- Restart the development server
- Verify variable names are exact (case-sensitive)
- Check for extra spaces or quotes

### Issue: "SUPABASE_SERVICE_ROLE_KEY is not set"
**Solution:**
- Add the variable to `.env.local`
- Get it from Supabase Dashboard → Settings → API → service_role secret
- Restart the server

### Issue: Variables not loading
**Solution:**
- Make sure file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- No spaces around the `=` sign
- Restart Next.js dev server completely

## 📍 File Location Reference

Your `.env.local` file should be here:
```
D:\ChainX\
├── .env.local          ← Create/Edit this file
├── app\
├── components\
├── lib\
├── package.json
└── ...
```

## 🚀 Next Steps

After setting environment variables:

1. ✅ Restart dev server
2. ✅ Run SQL scripts (003_add_verification_schema.sql)
3. ✅ Create storage bucket
4. ✅ Test registration flow
5. ✅ Set up admin user

See `VERIFICATION_SYSTEM_SETUP.md` for complete setup instructions.

