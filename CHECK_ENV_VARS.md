# ⚠️ Check Your Environment Variables

## The Error You're Seeing

"Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"

This means the API route is returning HTML (error page) instead of JSON. This usually happens when:
1. **Environment variable is missing** (`SUPABASE_SERVICE_ROLE_KEY`)
2. API route is crashing
3. Route doesn't exist (404)

## ✅ Quick Fix

### Step 1: Check `.env.local` file

Make sure you have ALL three variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 2: Get Service Role Key

1. Go to **Supabase Dashboard**
2. Click **Settings** (gear icon)
3. Click **API**
4. Find **`service_role`** key (NOT `anon` key!)
5. Copy it and add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Restart Server

After adding `SUPABASE_SERVICE_ROLE_KEY`:
1. Stop server (Ctrl+C)
2. Run `npm run dev` again
3. Try registration again

## 🔍 Verify It's Working

Check your terminal where `npm run dev` is running. If you see errors about missing env vars, that's the problem.

If you still see errors after adding the key, check:
- No spaces around `=` in `.env.local`
- File is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- Server was restarted after adding the key