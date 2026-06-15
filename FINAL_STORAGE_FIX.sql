-- ============================================
-- FINAL FIX: Storage Upload Errors
-- Copy and paste this ENTIRE block into Supabase SQL Editor
-- ============================================

-- Remove any existing policies
DROP POLICY IF EXISTS "storage_insert_user_documents" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_user_documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Create INSERT policy (allows authenticated users to upload)
CREATE POLICY "storage_insert_user_documents"
ON storage.objects 
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

-- Create SELECT policy (allows reading files)
CREATE POLICY "storage_select_user_documents"
ON storage.objects 
FOR SELECT
TO public
USING (bucket_id = 'user-documents');

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%user_documents%'
ORDER BY cmd;

-- You should see 2 rows: one for INSERT, one for SELECT

