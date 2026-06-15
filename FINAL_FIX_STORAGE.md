# 🔴 FINAL FIX: Storage Upload Errors

## Root Cause

The error "Unexpected token '<', \"<!DOCTYPE \"..." means the API route `/api/upload-document` is returning HTML (error page) instead of JSON.

## ✅ Two Solutions (Choose One)

### Solution 1: Fix Storage Policies (RECOMMENDED)

If storage policies are set up correctly, uploads work without the API route.

**Steps:**
1. Go to Supabase Dashboard → Storage → `user-documents` bucket
2. Click **Policies** tab
3. Go to **SQL Editor**
4. Run this SQL:

```sql
DROP POLICY IF EXISTS "storage_insert_user_documents" ON storage.objects;

CREATE POLICY "storage_insert_user_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');
```

5. **Refresh browser** and try again

This is the **proper fix** and uploads will work client-side.

---

### Solution 2: Add Service Role Key (Fallback)

If Solution 1 doesn't work, add the service role key for server-side uploads.

**Steps:**
1. Get Service Role Key:
   - Supabase Dashboard → Settings → API
   - Copy `service_role` key (NOT `anon` key)

2. Add to `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **Restart server** (important!):
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

4. **Refresh browser** and try again

---

## What I Changed

1. **Sign in after signup**: Establishes session immediately so client-side uploads work
2. **Better error messages**: Now tells you exactly what's wrong
3. **Automatic fallback**: Tries client-side first, then server-side if needed

---

## Test

1. Fill out registration form
2. Upload files
3. Should work! ✅

If you still get errors:
- Check browser console for specific error messages
- Check terminal where `npm run dev` is running for server errors
- Verify storage bucket `user-documents` exists and is **Public**
- Verify storage policies are created (Solution 1)

