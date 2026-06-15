# Fix Storage RLS Error - "new row violates row-level security policy"

## 🔴 Error Message
```
File upload failed: new row violates row-level security policy
```

## ✅ Solution

The error occurs because storage policies are not set up. Follow these steps:

### Step 1: Create Storage Bucket (If Not Created)

1. Go to **Supabase Dashboard** → Your Project
2. Click **Storage** in left sidebar
3. Click **New Bucket** or **Create Bucket**
4. Configure:
   - **Name**: `user-documents` (must be exactly this)
   - **Public bucket**: ✅ **Enable** (check the box)
   - **File size limit**: 5242880 (5MB) or leave default
5. Click **Create bucket**

### Step 2: Run Storage Policies SQL

1. In Supabase Dashboard, go to **SQL Editor**
2. Open a **New Query**
3. Copy and paste this entire script:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- Policy 1: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

-- Policy 2: Allow public read (anyone can view files via URL)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-documents');

-- Policy 3: Allow authenticated users to read
CREATE POLICY "Allow authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-documents');

-- Policy 4: Allow authenticated users to update
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-documents')
WITH CHECK (bucket_id = 'user-documents');

-- Policy 5: Allow authenticated users to delete
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-documents');
```

4. Click **Run** (or press F5)

### Step 3: Verify Setup

1. Go to **Storage** → `user-documents` bucket
2. Click **Policies** tab
3. You should see 5 policies listed:
   - Allow authenticated uploads (INSERT)
   - Allow public reads (SELECT)
   - Allow authenticated read (SELECT)
   - Users can update own documents (UPDATE)
   - Users can delete own documents (DELETE)

### Step 4: Test Again

1. Go back to registration page
2. Try uploading files again
3. Should work now! ✅

## 🔍 Troubleshooting

### Still Getting Error?

**Check 1: Bucket Exists?**
- Go to Storage → Check if `user-documents` is in the list
- If not visible, create it (Step 1)

**Check 2: Bucket is Public?**
- Click on `user-documents` bucket
- Go to Settings
- Ensure "Public bucket" is **enabled** ✅
- Click Save

**Check 3: Policies Created?**
- Storage → `user-documents` → Policies tab
- Should see policies listed
- If empty, run Step 2 SQL again

**Check 4: User is Authenticated?**
- The code now creates account FIRST, then uploads
- This ensures user is authenticated when uploading
- Check browser console for authentication errors

### Alternative: Check Existing Policies

Run this to see what policies exist:

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
```

## 🎯 Quick Test

After running policies, test with this:

1. Register a new user (or use existing account)
2. Go to registration form Step 3
3. Upload a small test image (< 1MB)
4. Should upload successfully!

## 📝 Notes

- **Public bucket** is recommended for development
- For production, consider private bucket with signed URLs
- File size limit is set in bucket settings (default 5MB)
- Supported formats: JPEG, JPG, PNG (validated in code)

