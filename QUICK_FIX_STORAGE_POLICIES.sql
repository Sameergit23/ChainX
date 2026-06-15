-- QUICK FIX: Copy this entire file and run in Supabase SQL Editor
-- This will fix the storage RLS errors

-- Step 1: Remove any existing policies
DROP POLICY IF EXISTS "storage_insert_user_documents" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_user_documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read" ON storage.objects;

-- Step 2: Create INSERT policy (THIS FIXES YOUR ERROR!)
CREATE POLICY "storage_insert_user_documents"
ON storage.objects 
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

-- Step 3: Create SELECT policy (allows reading files)
CREATE POLICY "storage_select_user_documents"
ON storage.objects 
FOR SELECT
TO public
USING (bucket_id = 'user-documents');

-- Step 4: Verify it worked
SELECT 
  policyname,
  cmd as command,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (
    policyname LIKE '%user_documents%' 
    OR policyname LIKE '%storage_insert%'
    OR policyname LIKE '%storage_select%'
  )
ORDER BY cmd;

-- You should see 2 policies: one for INSERT, one for SELECT

