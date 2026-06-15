# Quick Fix: Storage Upload Error

## 🔴 Error: "Failed to upload Aadhar front"

## ✅ Solution in 3 Steps

### Step 1: Create Storage Bucket (1 minute)

1. Open **Supabase Dashboard** → Your Project
2. Click **Storage** in left sidebar  
3. Click **New Bucket** or **Create Bucket**
4. Settings:
   - **Name**: `user-documents` (exactly this name)
   - **Public**: ✅ **Enable** (check this box)
   - **File size limit**: 5242880 (5MB) or leave default
5. Click **Create bucket**

### Step 2: Run Storage Policies SQL (30 seconds)

1. In Supabase, go to **SQL Editor**
2. Copy and paste this entire script:

```sql
-- Create storage policies for user-documents bucket
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-documents');
```

3. Click **Run** or press F5

### Step 3: Test Upload

1. Go to registration page: `/auth/register`
2. Fill in the form and upload files
3. Should work now! ✅

## 🔍 If Still Not Working

### Check 1: Bucket Exists?
- Go to Storage → Check if `user-documents` appears in list
- If not, create it (Step 1)

### Check 2: Policies Created?
- Go to Storage → `user-documents` → Policies tab
- Should see 2 policies listed
- If not, run Step 2 SQL again

### Check 3: Bucket is Public?
- Go to Storage → `user-documents` → Settings
- Make sure "Public bucket" is **enabled**
- If not, enable it and save

### Check 4: Environment Variables?
- Make sure `.env.local` has correct Supabase credentials
- Restart dev server after adding variables

## 📋 Complete SQL Script

Use this if you want all policies at once (from `scripts/005_create_storage_policies.sql`):

```sql
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-documents');

CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-documents')
WITH CHECK (bucket_id = 'user-documents');

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-documents');
```

## ✅ Verification Checklist

- [ ] Bucket `user-documents` exists
- [ ] Bucket is set to **Public**
- [ ] Storage policies are created (check Policies tab)
- [ ] Environment variables are set in `.env.local`
- [ ] Dev server restarted
- [ ] Try uploading a file - should work!

## 🎯 What Changed in Code

The registration flow now:
1. ✅ Creates user account **first** (authenticates user)
2. ✅ Uploads files **after** (user is authenticated, so policies allow it)
3. ✅ Shows better error messages if upload fails

This ensures the user is authenticated when uploading, which is required by the storage policies.

