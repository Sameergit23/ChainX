# Quick Fix for RLS Policy Error

## 🔴 Error Message
```
new row violates row-level security policy
```

## ✅ Quick Solution

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Copy & Run This SQL

Copy the entire contents of `scripts/004_fix_rls_policies.sql` and run it.

**OR** run this simplified version:

```sql
-- Fix Profiles UPDATE policy
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Fix Verification Queue INSERT policy
DROP POLICY IF EXISTS "verification_queue_insert_user" ON public.verification_queue;
CREATE POLICY "verification_queue_insert_user" ON public.verification_queue 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Fix Verification Queue SELECT policy
DROP POLICY IF EXISTS "verification_queue_select_admin" ON public.verification_queue;
CREATE POLICY "verification_queue_select_admin" ON public.verification_queue 
  FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_active = TRUE)
    OR auth.uid() = user_id
  );
```

### Step 3: Test Again
Try registering a new user. The error should be gone!

## 🎯 What This Fixes

1. **Profile Updates**: Users can now update their own profile during registration
2. **Verification Queue**: Users can add themselves to the verification queue
3. **Admins**: Admins can still access everything they need

## 🔍 If Still Getting Errors

Check which table is causing the error:
- **profiles** → Make sure UPDATE policy is correct (both USING and WITH CHECK)
- **verification_queue** → Make sure INSERT policy exists
- **credential_logs** → Only admins should insert here
- **admin_users** → First admin must be created manually (see below)

## 🚨 Creating First Admin User

If you get RLS errors when creating the first admin:

```sql
-- Temporarily disable RLS
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Insert first admin (replace with actual UUID from auth.users)
INSERT INTO public.admin_users (id, email, full_name, role, is_active)
VALUES (
  'your-user-uuid-here',  -- Get from Authentication > Users in Supabase
  'admin@chainx.com',
  'Admin User',
  'super_admin',
  TRUE
);

-- Re-enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
```

## 📝 How to Get User UUID

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find your admin user (or create one)
3. Copy the UUID from the user row
4. Use it in the INSERT statement above

