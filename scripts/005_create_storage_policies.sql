-- ============================================
-- Storage Bucket Policies for user-documents
-- ============================================
-- 
-- Prerequisites:
-- 1. Create bucket named "user-documents" in Supabase Storage
-- 2. Set it as public (or configure policies below)
-- 3. Run this script to set up RLS policies
--
-- IMPORTANT: Run this AFTER creating the bucket in Storage UI
-- ============================================

-- Enable RLS on storage.objects if not already enabled
-- (Usually enabled by default, but ensuring it's on)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files to user-documents bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

-- Policy 2: Allow public read access (since bucket should be public)
-- This allows anyone to view uploaded files via public URL
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-documents');

-- Policy 3: Allow authenticated users to read files
CREATE POLICY "Allow authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-documents');

-- Policy 4: Allow authenticated users to update files
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-documents')
WITH CHECK (bucket_id = 'user-documents');

-- Policy 5: Allow authenticated users to delete files
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-documents');

-- Verify policies were created
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
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%user-documents%' OR policyname LIKE '%authenticated%' OR policyname LIKE '%public%')
ORDER BY policyname;

