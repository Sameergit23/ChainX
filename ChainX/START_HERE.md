# 🚀 ChainX — Complete Merged Build

This folder contains your **complete ChainX project** with all original code + the new escrow / TDS / GST / GPS check-in features merged in.

**File count:** 146 files (your original 149 minus the 16 outdated fix files plus the 13 new patch files).

---

## What's new in this build vs your previous version

✅ Razorpay escrow integration (contractor funds job before it goes live)
✅ TDS auto-deduction (1%, Section 194C) with ledger
✅ GST invoice auto-generation (18% on platform fee)
✅ Worker payout details page (PAN + UPI/Bank)
✅ Worker earnings dashboard with TDS history
✅ GPS check-in / check-out for workers
✅ All currency converted from `$` to `₹`
✅ Clean repo (16 outdated fix files removed)
✅ Proper README and Supabase setup guide
✅ `package.json` renamed from `my-v0-project` → `chainx`

---

## How to use this folder

### Option A: Push to GitHub, then re-clone (your plan)

1. **Backup your old folder first** — rename `D:\ChainXX` to `D:\ChainXX-old-backup` (just in case).

2. **Extract this zip** and rename the extracted folder to `ChainXX`. Place it at `D:\ChainXX`.

3. **Open PowerShell in `D:\ChainXX`:**
   ```powershell
   cd D:\ChainXX
   ```

4. **Set up git to point to your GitHub repo:**
   ```powershell
   git init
   git remote add origin https://github.com/Sameergit23/ChainX.git
   git branch -M main
   git fetch origin
   ```

5. **Force-push the complete build to GitHub:**
   ```powershell
   git add .
   git commit -m "Complete rebuild: escrow, TDS, GST, GPS check-in, worker payouts"
   git push -f origin main
   ```
   ⚠ The `-f` (force) flag overwrites the GitHub repo with this clean version. This is what you want.

6. **Delete `D:\ChainXX-old-backup`** (if you don't need it anymore).

7. **Delete `D:\ChainXX`** and clone fresh:
   ```powershell
   cd D:\
   rmdir /s /q ChainXX
   git clone https://github.com/Sameergit23/ChainX.git ChainXX
   cd ChainXX
   npm install
   ```

8. **You now have a fresh clone with everything working.** 🎉

---

### Option B: Just use this folder directly (faster)

1. Delete `D:\ChainXX` entirely.
2. Extract this zip → rename to `ChainXX` → place at `D:\ChainXX`.
3. Open PowerShell:
   ```powershell
   cd D:\ChainXX
   npm install
   ```
4. Set up environment (see below).
5. Run: `npm run dev`

Push to GitHub later when you're confident it works.

---

## Required setup (do this before `npm run dev`)

### 1. Create `.env.local`

Copy `.env.example` to `.env.local` and fill in real values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

CHAINX_PLATFORM_FEE_PERCENT=4
CHAINX_TDS_PERCENT=1
CHAINX_GST_PERCENT=18
CHAINX_REGISTERED_STATE=Madhya Pradesh
```

- Supabase keys: from your Supabase dashboard → Settings → API
- Razorpay test keys: https://dashboard.razorpay.com/app/keys (sign up, no KYC needed for test mode)

### 2. Run the new database migration

In Supabase SQL Editor, paste contents of `scripts/008_add_payment_and_compliance.sql` and click Run.

If you've never run any migrations before, run them in order: `001`, `002`, `003`, `004`, `005`, `008`.

### 3. Install and run

```powershell
npm install
npm run dev
```

Open http://localhost:3000

### 4. Test the escrow flow

- Sign up as a contractor → post a job
- Use Razorpay test card: `4111 1111 1111 1111` / any future expiry / any 3-digit CVV
- Watch the `escrow_payments` table in Supabase flip from `created` → `funded`
- Sign up as a worker → set up payout details → apply for the job

---

## Folder structure

```
ChainXX/
├── app/                       Next.js pages (worker, contractor, auth, admin)
│   ├── api/
│   │   ├── payments/          ← NEW: Razorpay escrow APIs
│   │   ├── worker/            ← NEW: GPS check-in/out APIs
│   │   ├── admin/
│   │   ├── upload-document/
│   │   └── send-credentials/
│   ├── contractor/
│   │   └── post-job/          ← UPDATED: ₹ currency + escrow
│   └── worker/
│       ├── earnings/          ← NEW
│       ├── payout-details/    ← NEW
│       └── my-applications/   ← UPDATED: GPS check-in
├── components/                React UI components
│   └── gps-check-in.tsx       ← NEW
├── lib/
│   ├── supabase/
│   └── razorpay/              ← NEW: client + escrow logic
├── scripts/                   Supabase SQL migrations (001-005, 008)
├── docs/                      Setup guides
├── README.md                  Project overview
└── .env.example               Environment variable template
```

---

## If something goes wrong

Tell Claude:
1. Which step failed (1, 2, 3, etc.)
2. The exact error message

You'll get it fixed.

---

Built with you by Claude • Indore, India • Ship it 🚀
