# ⚠️ URGENT FIX: Storage Upload Error

## Current Error
```
File upload failed: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This means the API route is returning an HTML error page instead of JSON.

## ✅ QUICK FIX (Choose One)

### Option 1: Fix Storage Policies (BEST - No API Route Needed)

This makes client-side uploads work, so you don't need the API route at all.

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run this SQL:**

```sql
DROP POLICY IF EXISTS "storage_insert_user_documents" ON storage.objects;

CREATE POLICY "storage_insert_user_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');
```

3. **Verify it worked:**
   - Go to Storage → `user-documents` → Policies tab
   - You should see `storage_insert_user_documents` policy

4. **Refresh browser and try registration again**

✅ **This should work immediately!** No API route needed.

---

### Option 2: Fix API Route (If Option 1 Doesn't Work)

The API route is failing because `SUPABASE_SERVICE_ROLE_KEY` is missing.

1. **Get Service Role Key:**
   - Supabase Dashboard → Settings → API
   - Find **`service_role`** key (the long one, NOT `anon` key)
   - Copy it

2. **Add to `.env.local`** (in project root):
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   (Replace with your actual key)

3. **RESTART SERVER:**
   ```bash
   # Stop server (Ctrl+C in terminal)
   npm run dev
   ```

4. **Refresh browser and try again**

---

## 🔍 Verify Which Solution You Need

**Check your terminal** where `npm run dev` is running:

- If you see: `Missing Supabase env vars: { hasServiceKey: false }`
  → **Use Option 2** (add service role key)

- If uploads fail with "row-level security policy"
  → **Use Option 1** (add storage policies)

---

## 🎯 Recommended: Use Option 1

Option 1 (storage policies) is better because:
- ✅ Works without API route
- ✅ More secure (client-side RLS)
- ✅ Simpler (no service role key needed)
- ✅ Faster (no server round-trip)

Just run the SQL and you're done!

