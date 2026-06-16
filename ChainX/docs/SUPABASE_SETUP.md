# Supabase Setup Guide

Single source of truth for ChainX backend setup. Replaces all the older fix-attempt docs (delete those once this is in).

---

## 1. Create the Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose the Mumbai (`ap-south-1`) region for India-based latency.
3. From **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` (keep this server-only)

Paste these into `.env.local` in your project root.

---

## 2. Run Migrations (in order)

Open Supabase Dashboard → SQL Editor → New Query. Paste and run each file from `scripts/`:

| Order | File | What it does |
|---|---|---|
| 1 | `001_create_tables.sql` | Core tables: profiles, jobs, applications, notifications, penalties, tatkal_jobs |
| 2 | `002_create_trigger.sql` | Auto-create profile on signup |
| 3 | `003_add_verification_schema.sql` | KYC fields, verification queue, admin users |
| 4 | `004_fix_rls_policies.sql` | RLS policy refinements |
| 5 | `005_create_storage_policies.sql` | Initial storage policies (superseded by step 8) |
| 6 | `008_add_payment_and_compliance.sql` | Escrow, payouts, TDS ledger, GST invoices, GPS attendance |

After step 6, you should have ~14 tables + 2 sequences + 3 helper functions.

---

## 3. Create the Storage Bucket

1. Go to **Storage → Create new bucket**.
2. Name: `user-documents`
3. Public: **No** (private bucket)
4. File size limit: 5 MB
5. Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`

---

## 4. Storage RLS Policies

The KYC document upload uses the **service role key** from a Next.js API route (`/api/upload-document`), which bypasses RLS entirely. This is the simplest, most reliable approach — no need to chase RLS edge cases.

Run this minimal policy once to allow public read of uploaded documents (so admin can preview):

```sql
-- Allow authenticated users to read documents in the user-documents bucket
DROP POLICY IF EXISTS "storage_select_user_documents" ON storage.objects;
CREATE POLICY "storage_select_user_documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'user-documents');
```

**Why this works:** Uploads go through your API route with the service role key (bypasses RLS). Reads go through Supabase signed URLs which respect this single policy. No more 14 fix files needed.

---

## 5. Create First Admin User

After signing up your first admin account in the app, promote them in SQL:

```sql
INSERT INTO public.admin_users (id, email, full_name, role, is_active)
VALUES (
  '<paste-user-uuid-from-auth.users>',
  'admin@chainx.in',
  'Admin Name',
  'super_admin',
  TRUE
);
```

You can find the UUID in **Authentication → Users**.

---

## 6. Verify Setup

Run this query to confirm everything is in place:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected output:

- admin_users
- credential_logs
- escrow_payments
- gst_invoices
- job_applications
- jobs
- notifications
- penalties
- profiles
- tatkal_jobs
- tds_ledger
- verification_queue
- worker_payouts

---

## 7. Common Issues

**"Storage upload returns RLS error"** → You're uploading directly from the client. Don't. Use the `/api/upload-document` route which uses the service role key.

**"Profile not created on signup"** → Check the trigger from `002_create_trigger.sql` is installed. Re-run it.

**"Can't see verification queue as admin"** → You haven't added your user to `admin_users`. See step 5.

**"Razorpay order creation fails"** → Check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env.local`. Use test keys (`rzp_test_...`) during development.

---

## 8. Files Safe to Delete

Once this guide is in your repo, delete these (they were exploratory fix attempts):

```
CHECK_ENV_VARS.md
ENV_SETUP.md
FINAL_FIX_STORAGE.md
FINAL_STORAGE_FIX.sql
FIX_STORAGE_ERROR_NOW.md
QUICK_FIX_STORAGE_POLICIES.sql
RLS_FIX_GUIDE.md
RLS_QUICK_FIX.md
STORAGE_COMPLETE_FIX.md
STORAGE_ERROR_FIX.md
STORAGE_QUICK_FIX.md
STORAGE_SETUP.md
SUPABASE_SETUP.md  (old version in repo root)
URGENT_FIX.md
VERIFICATION_SYSTEM_SETUP.md
scripts/006_diagnose_storage.sql
scripts/007_fix_storage_rls_complete.sql
```

A clean repo is a hireable repo.
