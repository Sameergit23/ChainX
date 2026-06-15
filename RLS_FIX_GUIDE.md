# Fix RLS Policy Error Guide

## Problem
You're getting: **"new row violates row-level security policy"**

This happens when:
- User tries to update their profile during registration
- User tries to insert into verification_queue
- RLS policies are too restrictive

## Solution: Run the Fix SQL Script

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Fix Script
Copy and paste the entire contents of `scripts/004_fix_rls_policies.sql` and run it.

**OR** run these commands one by one:

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

-- Fix Verification Queue SELECT policy (allow users to see their own)
DROP POLICY IF EXISTS "verification_queue_select_admin" ON public.verification_queue;

CREATE POLICY "verification_queue_select_admin" ON public.verification_queue 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
    OR
    auth.uid() = user_id
  );
```

### Step 3: Test Registration
Try registering a new user again. The error should be resolved.

## Common RLS Issues & Fixes

### Issue 1: Profile Update Fails
**Error:** "new row violates row-level security policy for table profiles"

**Fix:** Ensure UPDATE policy has both USING and WITH CHECK:
```sql
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)      -- Check existing row
  WITH CHECK (auth.uid() = id); -- Check new row values
```

### Issue 2: Verification Queue Insert Fails
**Error:** "new row violates row-level security policy for table verification_queue"

**Fix:** Add INSERT policy:
```sql
CREATE POLICY "verification_queue_insert_user" ON public.verification_queue 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

### Issue 3: Trigger Works But Manual Update Fails
The trigger function uses `SECURITY DEFINER` so it bypasses RLS.
But when your app code tries to UPDATE the profile, it uses the user's session, so RLS applies.

**Solution:** Make sure UPDATE policy allows the user to update their own row.

## Verification

After running the fix:
1. Try registering a new user
2. Check Supabase logs for any RLS errors
3. Verify profile was updated with all details
4. Verify verification_queue entry was created

If you still get errors, check which table is causing the issue and ensure that table has appropriate INSERT/UPDATE policies.

