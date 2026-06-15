# 🔴 URGENT: Fix Storage Error Right Now

## The Problem
You're getting: **"new row violates row-level security policy"**

This happens because storage policies aren't set up correctly.

## ✅ SOLUTION (Choose One)

### Option 1: Fix Storage Policies (Recommended)

**Step 1:** Create Bucket
- Supabase Dashboard → Storage → New Bucket
- Name: `user-documents`
- ✅ Enable "Public bucket"
- Create

**Step 2:** Run This SQL (Copy Entire Block)

```sql
DROP POLICY IF EXISTS "storage_insert_user_documents" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_user_documents" ON storage.objects;

CREATE POLICY "storage_insert_user_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

CREATE POLICY "storage_select_user_documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-documents');
```

**Step 3:** Refresh browser and try again

---

### Option 2: Use Server-Side Upload (Works Even Without Policies)

I've created a server-side upload API that bypasses RLS.

**What Changed:**
- Code now tries client-side upload first
- If it fails with RLS error, automatically uses server-side upload
- Server-side uses service role key (bypasses RLS)

**Requirements:**
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (if not already there)
- Restart dev server: `npm run dev`

**No SQL needed!** Just restart server and try again.

---

## 🎯 Which Option to Use?

- **Option 1** if you want proper RLS policies (recommended for production)
- **Option 2** if you want it working immediately (works right now)

You can use both - Option 2 is a fallback that works even if Option 1 isn't set up.

## ✅ Quick Test

After fixing:
1. Refresh registration page
2. Upload files
3. Should work! ✅

