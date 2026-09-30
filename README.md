# ChainX

**Killing the middleman in the labour market.**

ChainX is a hyperlocal job marketplace that connects contractors directly with skilled workers, with no labour agents or sub-contractors in between. It is built for the Indian unorganised labour market, and it is a Next.js web app backed by Supabase.

## Features

- **Two roles**: contractors post jobs and workers find and apply for them, each with their own dashboard
- **Job posting and applications**: contractors create jobs and review applicants, and workers track their applications
- **Tatkal (urgent) jobs**: a dedicated flow for last-minute work
- **KYC verification**: workers upload identity documents, and an admin review queue approves accounts before they go live
- **Notifications**: real-time updates through Supabase realtime
- **Authentication**: sign-up and login with Supabase Auth and route protection through Next.js middleware
- **Row Level Security** on the database, with storage policies for uploaded documents

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 18, TypeScript |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui |
| Backend | Next.js API routes |
| Database, auth and storage | Supabase (Postgres, Auth, Storage, Realtime) |

## Project structure

```
.
├── app/
│   ├── page.tsx              # Landing page
│   ├── auth/, login/         # Authentication
│   ├── worker/               # Worker dashboard, jobs, applications, Tatkal jobs, notifications
│   ├── contractor/           # Contractor dashboard, post-job, applications, Tatkal
│   ├── admin/verification/   # Admin KYC review queue
│   ├── profile/              # Profile management
│   └── api/                  # Admin, document upload, send-credentials routes
├── components/               # Landing page sections and UI components
├── lib/
│   ├── supabase/             # Browser, server and middleware clients
│   ├── realtime-service.ts   # Supabase realtime subscriptions
│   └── cross-app-sync.ts     # Worker <-> contractor sync
├── scripts/                  # Supabase SQL migrations (run in order)
├── middleware.ts             # Session handling and route protection
└── ChainX/                   # Newer working copy with the payments and compliance work in progress
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- A [Supabase](https://supabase.com) project (the free tier works)

### Setup

```bash
git clone https://github.com/Sameergit23/ChainX.git
cd ChainX
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The service role key is used server-side only (document uploads and admin actions). Never commit it.

Run the SQL files in `scripts/` in order in the Supabase SQL editor, then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### More setup guides

The repo includes step-by-step guides for common setup problems:
[`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) · [`ENV_SETUP.md`](ENV_SETUP.md) · [`STORAGE_SETUP.md`](STORAGE_SETUP.md) · [`VERIFICATION_SYSTEM_SETUP.md`](VERIFICATION_SYSTEM_SETUP.md) · [`RLS_FIX_GUIDE.md`](RLS_FIX_GUIDE.md)

## Roadmap

The [`ChainX/`](ChainX) folder contains the next iteration, with its own [README](ChainX/README.md). It covers the work in progress:

- Escrow payments through Razorpay
- TDS and GST handling for payouts and platform fees
- GPS check-in and check-out for jobs
- Mobile apps, dispute resolution and worker insurance

## Author

Built by [Sameer Akhtar](https://github.com/Sameergit23), Indore, India.
