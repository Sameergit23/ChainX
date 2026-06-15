-- Diagnostic Script: Check Storage Setup
-- Run this to see what's configured

-- Check if bucket exists (will show in Storage UI, but checking policies)
SELECT 
  'Storage Policies Status' as check_type;

-- List all storage policies
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- Check if any policies allow INSERT for user-documents
SELECT 
  'INSERT Policies for user-documents' as check_type,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND cmd = 'INSERT'
  AND (with_check LIKE '%user-documents%' OR qual LIKE '%user-documents%')
ORDER BY policyname;

