# Complete Fix for Storage RLS Errors

## 🔴 All 3 Errors Are Storage-Related

All errors show: **"new row violates row-level security policy"** in the uploadFile function.

This means the storage bucket policies are not set up correctly.

## ✅ Complete Fix (2 Steps)

### STEP 1: Create Storage Bucket in Supabase UI

1. Go to **Supabase Dashboard** → Your Project
2. Click **Storage** in the left sidebar (folder icon)
3. Click **New Bucket** button (top right)
4. Fill in the form:
   - **Name**: Type exactly `user-documents` (lowercase, with hyphen)
   - **Public bucket**: ✅ **CHECK THIS BOX** (very important!)
   - **File size limit**: 5242880 (5MB) or leave default
   - **Allowed MIME types**: Leave empty OR add `image/jpeg,image/jpg,image/png`
5. Click **Create bucket** button

✅ You should now see `user-documents` in your buckets list

### STEP 2: Run Storage Policies SQL

1. In Supabase Dashboard, click **SQL Editor** (database icon)
2. Click **New Query** button
3. Copy the ENTIRE contents of `scripts/005_create_storage_policies.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press F5)

**OR** copy and paste this directly:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- Policy 1: Allow authenticated users to upload (FIXES YOUR ERROR!)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

-- Policy 2: Allow public to read files
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

## 🔍 Verify Setup

After running the SQL:

1. Go to **Storage** → Click on `user-documents` bucket
2. Click **Policies** tab
3. You should see **5 policies** listed:
   - ✅ Allow authenticated uploads (INSERT)
   - ✅ Allow public reads (SELECT)
   - ✅ Allow authenticated read (SELECT)
   - ✅ Users can update own documents (UPDATE)
   - ✅ Users can delete own documents (DELETE)

## ✅ Test

1. **Refresh** your registration page in the browser
2. Try uploading files again
3. All 3 errors should be gone! ✅

## 🚨 If Still Getting Errors

### Check 1: Bucket Exists?
- Storage → Should see `user-documents` in the list
- If not visible, create it (Step 1)

### Check 2: Bucket is Public?
- Storage → `user-documents` → Settings
- "Public bucket" must be ✅ **ENABLED**
- If not, enable it and **Save**

### Check 3: Policies Created?
- Storage → `user-documents` → Policies tab
- Should see 5 policies
- If empty, run Step 2 SQL again

### Check 4: User is Authenticated?
The code creates the account first, then uploads files.
- Check browser console for auth errors
- Make sure Supabase credentials are in `.env.local`

### Check 5: Storage Client Available?
In browser console, you should see:
- `Supabase URL: Present`
- `Supabase Anon Key: Present`

If you see "Missing", add credentials to `.env.local` and restart server.

## 📝 Quick Diagnostic Query

Run this in SQL Editor to check what policies exist:

```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%user-documents%' OR policyname LIKE '%authenticated%')
ORDER BY policyname;
```

This will show you all storage policies. You should see at least the "Allow authenticated uploads" policy.

## 🎯 Most Common Issue

**Bucket exists but policies are missing** - Run Step 2 SQL to create policies.

**Policies exist but bucket is private** - Go to bucket Settings → Enable "Public bucket".

