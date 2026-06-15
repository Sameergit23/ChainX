# Supabase Storage Setup Guide

## 🔴 Error: "Failed to upload Aadhar front"

This error occurs because the storage bucket doesn't exist or isn't configured properly.

## ✅ Solution: Create Storage Bucket

### Step 1: Create the Bucket

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Storage** in the left sidebar
4. Click **Create Bucket** (or **New Bucket**)
5. Configure:
   - **Name**: `user-documents`
   - **Public bucket**: ✅ **Enable** (recommended for now)
   - **File size limit**: 5MB (or your preferred limit)
   - **Allowed MIME types**: Leave empty or add: `image/jpeg,image/jpg,image/png`
6. Click **Create bucket**

### Step 2: Set Up Storage Policies (RLS)

Go to **Storage** → **Policies** → Select `user-documents` bucket

#### Policy 1: Allow authenticated users to upload

```sql
-- Allow users to upload their own files
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
  OR
  (storage.foldername(name))[1] IN ('aadhar-front', 'aadhar-back', 'photos')
);
```

#### Policy 2: Allow users to read their files

```sql
-- Allow users to read files (public bucket, so this might not be needed)
CREATE POLICY "Users can read documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-documents');
```

#### Policy 3: Allow users to update/delete their files

```sql
-- Allow users to update/delete their own files
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
  OR
  (storage.foldername(name))[1] IN ('aadhar-front', 'aadhar-back', 'photos')
);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Alternative: Simpler Policy (Recommended for Development)

If you want to allow all authenticated users to upload (for development):

```sql
-- Simple policy: Allow authenticated users to upload any file to user-documents
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

-- Allow everyone to read (since it's public bucket)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-documents');
```

### Step 3: Test the Upload

1. Try registering a new user
2. Upload the Aadhar documents
3. Check if files appear in Storage → `user-documents` bucket

## 🔧 Troubleshooting

### Issue: "Bucket not found"
**Solution:** 
- Make sure bucket name is exactly `user-documents` (lowercase, with hyphen)
- Check it's created in the correct project

### Issue: "new row violates row-level security policy" (Storage)
**Solution:**
- Go to Storage → Policies
- Make sure RLS is enabled
- Add the policies above
- Policies must allow `authenticated` users or `public` (depending on your bucket settings)

### Issue: "Upload failed: Status 403"
**Solution:**
- Check storage policies are correct
- Make sure bucket is public OR policies allow authenticated users
- Verify user is authenticated before uploading

### Issue: "Upload failed: Status 413" (File too large)
**Solution:**
- Check file size (should be < 5MB)
- Increase bucket file size limit in bucket settings
- Compress images before upload

### Issue: "Storage client not available"
**Solution:**
- Make sure Supabase credentials are set in `.env.local`
- Restart development server
- Check if mock client is being used (should have real credentials)

## 📝 Quick Setup Script

Run this in Supabase SQL Editor to create all policies at once:

```sql
-- Enable RLS on storage.objects if not already enabled
-- (This is usually enabled by default)

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- Create upload policy (authenticated users)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

-- Create read policy (public or authenticated)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-documents');

-- Create update policy
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-documents');

-- Create delete policy
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-documents');
```

## ✅ Verification

After setup:
1. ✅ Bucket `user-documents` exists
2. ✅ Bucket is public (or has proper policies)
3. ✅ Storage policies are created
4. ✅ Try uploading a file - should work!

## 🚨 Important Notes

1. **Public vs Private**: 
   - Public buckets: Files are accessible via public URL
   - Private buckets: Require signed URLs and proper policies

2. **File Organization**: 
   - Current structure: `aadhar-front/file.jpg`, `aadhar-back/file.jpg`, `photos/file.jpg`
   - Consider organizing by user: `{user_id}/aadhar-front.jpg` for better isolation

3. **Security**: 
   - For production, make bucket private and use signed URLs
   - Add file type validation on server side
   - Implement virus scanning for uploaded files

