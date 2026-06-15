-- ============================================
-- Quick Fix for RLS Policy Errors
-- Run this in Supabase SQL Editor
-- ============================================

-- Fix 1: Profiles UPDATE policy (most common issue)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)      -- Can update if you own the row
  WITH CHECK (auth.uid() = id); -- New values must still be your row

-- Fix 2: Verification Queue INSERT policy (allows users to add themselves to queue)
DROP POLICY IF EXISTS "verification_queue_insert_user" ON public.verification_queue;

CREATE POLICY "verification_queue_insert_user" ON public.verification_queue 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);  -- Can only insert if user_id matches your auth.uid()

-- Fix 3: Verification Queue SELECT policy (allow users to see their own entry)
DROP POLICY IF EXISTS "verification_queue_select_admin" ON public.verification_queue;

CREATE POLICY "verification_queue_select_admin" ON public.verification_queue 
  FOR SELECT 
  USING (
    -- Admins can see all
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
    OR
    -- Users can see their own
    auth.uid() = user_id
  );

-- Fix 4: Credential Logs INSERT (for admin operations)
DROP POLICY IF EXISTS "credential_logs_insert_admin" ON public.credential_logs;

CREATE POLICY "credential_logs_insert_admin" ON public.credential_logs 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
    OR
    -- Allow if inserting for own user (though this shouldn't normally happen)
    auth.uid() = user_id
  );

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'verification_queue', 'credential_logs')
ORDER BY tablename, policyname;
