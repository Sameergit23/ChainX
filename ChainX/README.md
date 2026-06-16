# ChainX

**Killing the middleman in the labour market.**

ChainX is a hyperlocal job marketplace that connects contractors directly with skilled workers — no labour agents, no sub-contractors, no commissions stolen along the way. Workers get fair pay, contractors get verified talent, and every transaction is escrow-secured, TDS-compliant, and GST-invoiced.

Built for the Indian unorganised labour market — a ₹50+ lakh crore industry that is almost entirely offline.

---

## What ChainX Does

- **Direct hiring** — Contractors post jobs, verified workers apply or grab Tatkal (urgent) jobs instantly.
- **Escrow payments** — Contractor deposits wages into ChainX escrow; funds release to worker only after job completion is approved.
- **Aadhaar-verified profiles** — Manual KYC pipeline with admin review prevents fake accounts.
- **Auto TDS deduction** — 1% TDS under Section 194C deducted at source, Form 16A auto-generated.
- **GST invoicing** — Platform fee invoices with GSTIN, ready for contractor's books.
- **Tatkal jobs** — Urgent jobs with 1.5x (high urgency, 2hr window) or 2x (critical urgency, 1hr window) pay multipliers.
- **Penalty system** — No-shows lose rating points, building a trust score over time.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript |
| UI | Tailwind CSS, Radix UI, shadcn/ui |
| Backend | Next.js API routes |
| Database | Supabase (Postgres) with Row Level Security |
| Auth | Supabase Auth |
| Storage | Supabase Storage (KYC documents) |
| Payments | Razorpay (orders, escrow, payouts) |
| Compliance | Custom TDS / GST invoicing engine |

---

## Project Structure

```
ChainX/
├── app/
│   ├── page.tsx                    Landing page
│   ├── auth/                       Login, register, signup callbacks
│   ├── worker/                     Worker dashboard, jobs, applications
│   ├── contractor/                 Contractor dashboard, post-job, applications
│   ├── admin/verification/         Admin KYC review queue
│   ├── profile/                    User profile management
│   └── api/
│       ├── upload-document/        KYC document upload (service role)
│       ├── send-credentials/       Send login creds to verified users
│       ├── admin/                  Admin actions
│       └── payments/               Razorpay order, verify, release
├── components/                     Reusable React components
├── lib/
│   ├── supabase/                   Browser, server, middleware clients
│   ├── razorpay/                   Razorpay SDK wrappers, escrow logic
│   ├── realtime-service.ts         Supabase realtime subscriptions
│   └── cross-app-sync.ts           Worker ↔ contractor app sync
├── scripts/                        Supabase SQL migrations (run in order)
└── docs/                           Setup guides
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account (free tier works)
- Razorpay account (test mode for development)

### Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/Sameergit23/ChainX.git
   cd ChainX
   npm install
   ```

2. **Configure environment variables**

   Create `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

   CHAINX_PLATFORM_FEE_PERCENT=4
   CHAINX_TDS_PERCENT=1
   CHAINX_GST_PERCENT=18
   ```

3. **Run database migrations**

   In the Supabase SQL editor, run files in `scripts/` in order:

   ```
   001_create_tables.sql
   002_create_trigger.sql
   003_add_verification_schema.sql
   004_fix_rls_policies.sql
   005_create_storage_policies.sql
   008_add_payment_and_compliance.sql
   ```

   See [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for detailed setup.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

---

## Payment Flow

```
Contractor posts job
        ↓
Contractor deposits estimated wages into ChainX escrow (Razorpay order)
        ↓
Worker applies → contractor accepts
        ↓
Worker checks in (GPS) → works → checks out
        ↓
Contractor approves completion
        ↓
ChainX releases payment:
        ├── Worker receives:  wage − 1% TDS
        ├── Govt receives:    1% TDS (deposited, Form 16A generated)
        └── ChainX retains:   4% platform fee + 18% GST on fee
```

See [`docs/PAYMENT_FLOW.md`](docs/PAYMENT_FLOW.md) for full details.

---

## Compliance

- **TDS (Section 194C)** — 1% deducted at source on every worker payout. PAN-linked. Form 16A generated quarterly.
- **GST (18%)** — Charged on ChainX platform fee only, not on worker wages. Workers earning under ₹20 lakh annually remain GST-exempt.
- **KYC** — Aadhaar front + back + live photo, reviewed manually by admin team before activating worker accounts.
- **Audit trail** — Every transaction immutably logged with timestamps, location, and approver IDs.

See [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md).

---

## Roadmap

- ✅ MVP: Auth, KYC, job posting, applications, Tatkal jobs
- 🔄 In progress: Razorpay escrow integration, TDS/GST engine, GPS check-in
- 📍 Next: React Native mobile apps, dispute resolution, worker insurance, contractor BNPL

---

## Contributing

ChainX is currently in private development. Reach out to the project owner before submitting PRs.

---

## License

Proprietary © 2025 Sameer Akhtar. All rights reserved.

---

**Built by [Sameer Akhtar](https://github.com/Sameergit23)** • Indore, India
