# ChainX Supabase Setup Guide

## 🚀 Setting Up Real Authentication

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up/Login to your account
3. Click "New Project"
4. Enter project name: "ChainX"
5. Set a strong database password
6. Choose a region close to you
7. Click "Create new project"

### Step 2: Get Your Credentials
1. In your Supabase dashboard, click the gear icon (Settings)
2. Click "API" in the left sidebar
3. Copy your "Project URL" and "anon public" key

### Step 3: Configure Environment Variables
Create a file named `.env.local` in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Set Up Database Tables
Run the SQL scripts in your Supabase SQL editor:
1. Go to SQL Editor in Supabase dashboard
2. Run the scripts from `scripts/001_create_tables.sql`
3. Run the scripts from `scripts/002_create_trigger.sql`

### Step 5: Configure Authentication
1. Go to Authentication > Settings in Supabase
2. Enable "Enable email confirmations" if desired
3. Set up your site URL: http://localhost:3000
4. Add redirect URLs: http://localhost:3000/auth/sign-up-success

### Step 6: Test Real Authentication
1. Restart your development server: `npm run dev`
2. Go to http://localhost:3000/auth/sign-up
3. Create a real account
4. Test login with real credentials

## 🎯 What You'll Get
- ✅ Real user registration and login
- ✅ Email verification (optional)
- ✅ Password reset functionality
- ✅ User profiles and data persistence
- ✅ Real-time features working
- ✅ Cross-app communication with real data

## 🔧 Troubleshooting
- Make sure `.env.local` is in your project root
- Restart the development server after adding environment variables
- Check Supabase dashboard for any errors
- Verify your project URL and API key are correct
