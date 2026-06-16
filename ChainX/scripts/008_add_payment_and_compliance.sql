-- ============================================
-- ChainX: Payment & Compliance Schema
-- Migration 008
-- ============================================
-- This migration adds:
--   1. Razorpay payment / escrow tracking
--   2. TDS (Section 194C) deduction logs
--   3. GST invoice generation
--   4. Worker bank / UPI details for payouts
--   5. GPS check-in / check-out for fair payment
-- ============================================

-- ============================================
-- 1. WORKER PAYOUT DETAILS
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pan_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS upi_id TEXT,
  ADD COLUMN IF NOT EXISTS preferred_payout_method TEXT DEFAULT 'upi'
    CHECK (preferred_payout_method IN ('upi', 'bank'));

-- Contractor GST details (for invoicing them)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gstin TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- ============================================
-- 2. ESCROW PAYMENTS TABLE
-- ============================================
-- Tracks contractor deposits held in escrow before being released to workers.
-- One row per job, created when contractor funds the job.

CREATE TABLE IF NOT EXISTS public.escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Amounts (all in paise — multiply rupees by 100)
  total_amount_paise BIGINT NOT NULL,           -- Total deposited
  platform_fee_paise BIGINT NOT NULL,           -- ChainX cut (e.g. 4%)
  gst_on_fee_paise BIGINT NOT NULL,             -- 18% GST on platform fee
  worker_payout_paise BIGINT NOT NULL,          -- What workers actually receive (minus TDS)
  tds_paise BIGINT NOT NULL,                    -- 1% TDS on worker payout

  -- Razorpay references
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,

  -- State machine
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'funded', 'partial_released', 'released', 'refunded', 'disputed')),

  funded_at TIMESTAMP,
  released_at TIMESTAMP,
  refunded_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(job_id)
);

CREATE INDEX IF NOT EXISTS idx_escrow_job_id ON public.escrow_payments(job_id);
CREATE INDEX IF NOT EXISTS idx_escrow_contractor ON public.escrow_payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON public.escrow_payments(status);

-- ============================================
-- 3. WORKER PAYOUTS (individual disbursements)
-- ============================================
-- A single escrow may pay out multiple workers. This logs each transfer.

CREATE TABLE IF NOT EXISTS public.worker_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES public.escrow_payments(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Amounts in paise
  gross_amount_paise BIGINT NOT NULL,         -- What worker earned
  tds_amount_paise BIGINT NOT NULL,           -- TDS deducted
  net_amount_paise BIGINT NOT NULL,           -- gross − TDS, paid to worker

  -- Payout method & reference
  payout_method TEXT NOT NULL CHECK (payout_method IN ('upi', 'bank')),
  razorpay_payout_id TEXT,
  utr_number TEXT,                            -- Bank UTR for tracking

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'success', 'failed', 'reversed')),
  failure_reason TEXT,

  initiated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  UNIQUE(application_id)
);

CREATE INDEX IF NOT EXISTS idx_payouts_worker ON public.worker_payouts(worker_id);
CREATE INDEX IF NOT EXISTS idx_payouts_job ON public.worker_payouts(job_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.worker_payouts(status);

-- ============================================
-- 4. TDS LEDGER (Section 194C)
-- ============================================
-- Per-worker, per-financial-year TDS log for Form 16A generation.

CREATE TABLE IF NOT EXISTS public.tds_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_id UUID NOT NULL REFERENCES public.worker_payouts(id) ON DELETE CASCADE,

  financial_year TEXT NOT NULL,               -- e.g. '2025-26'
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),

  gross_amount_paise BIGINT NOT NULL,
  tds_rate DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  tds_amount_paise BIGINT NOT NULL,

  pan_number TEXT,                            -- Snapshot at time of deduction
  challan_number TEXT,                        -- Govt deposit reference (added later)
  challan_date DATE,
  form_16a_url TEXT,                          -- Generated PDF URL

  deducted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tds_worker_fy ON public.tds_ledger(worker_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_tds_quarter ON public.tds_ledger(financial_year, quarter);

-- ============================================
-- 5. GST INVOICES (on ChainX platform fee)
-- ============================================
-- One invoice per escrow payment, issued to contractor.

CREATE TABLE IF NOT EXISTS public.gst_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES public.escrow_payments(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  invoice_number TEXT UNIQUE NOT NULL,        -- e.g. CHX/2025-26/000123
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  financial_year TEXT NOT NULL,

  -- Amounts in paise
  taxable_value_paise BIGINT NOT NULL,        -- Platform fee (pre-tax)
  cgst_paise BIGINT NOT NULL DEFAULT 0,       -- 9% if same state
  sgst_paise BIGINT NOT NULL DEFAULT 0,       -- 9% if same state
  igst_paise BIGINT NOT NULL DEFAULT 0,       -- 18% if inter-state
  total_paise BIGINT NOT NULL,

  contractor_gstin TEXT,
  contractor_state TEXT,
  pdf_url TEXT,                               -- Generated invoice PDF

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gst_contractor ON public.gst_invoices(contractor_id);
CREATE INDEX IF NOT EXISTS idx_gst_invoice_number ON public.gst_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_gst_fy ON public.gst_invoices(financial_year);

-- Sequence for invoice numbering
CREATE SEQUENCE IF NOT EXISTS public.invoice_sequence_2025_26 START 1;

-- ============================================
-- 6. GPS ATTENDANCE
-- ============================================
-- Workers check in/out at job site; payment depends on logged hours.

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS check_in_lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS check_in_lng DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS check_out_lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS check_out_lng DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(5,2);

-- Job site coordinates (so we can validate worker is actually on-site)
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS location_lng DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS location_radius_meters INT DEFAULT 200;

-- ============================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tds_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_invoices ENABLE ROW LEVEL SECURITY;

-- Escrow: contractor sees own, workers see escrows for jobs they applied to
DROP POLICY IF EXISTS "escrow_select_contractor" ON public.escrow_payments;
CREATE POLICY "escrow_select_contractor" ON public.escrow_payments
  FOR SELECT USING (auth.uid() = contractor_id);

DROP POLICY IF EXISTS "escrow_select_worker" ON public.escrow_payments;
CREATE POLICY "escrow_select_worker" ON public.escrow_payments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT worker_id FROM public.job_applications
      WHERE job_id = escrow_payments.job_id AND status = 'accepted'
    )
  );

-- Worker payouts: worker sees own
DROP POLICY IF EXISTS "payouts_select_worker" ON public.worker_payouts;
CREATE POLICY "payouts_select_worker" ON public.worker_payouts
  FOR SELECT USING (auth.uid() = worker_id);

-- Payouts: contractor sees payouts for their jobs
DROP POLICY IF EXISTS "payouts_select_contractor" ON public.worker_payouts;
CREATE POLICY "payouts_select_contractor" ON public.worker_payouts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT contractor_id FROM public.jobs WHERE id = job_id
    )
  );

-- TDS ledger: worker sees own
DROP POLICY IF EXISTS "tds_select_own" ON public.tds_ledger;
CREATE POLICY "tds_select_own" ON public.tds_ledger
  FOR SELECT USING (auth.uid() = worker_id);

-- GST invoices: contractor sees own
DROP POLICY IF EXISTS "gst_select_contractor" ON public.gst_invoices;
CREATE POLICY "gst_select_contractor" ON public.gst_invoices
  FOR SELECT USING (auth.uid() = contractor_id);

-- Service-role writes only (server-side via Razorpay webhooks / API routes)
-- No INSERT/UPDATE policies for regular users — these are handled by the
-- service role key from API routes.

-- ============================================
-- 8. INVOICE NUMBER GENERATOR
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  fy TEXT;
  seq_num BIGINT;
BEGIN
  -- Determine financial year (April-March)
  IF EXTRACT(MONTH FROM CURRENT_DATE) >= 4 THEN
    fy := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' ||
          RIGHT((EXTRACT(YEAR FROM CURRENT_DATE) + 1)::TEXT, 2);
  ELSE
    fy := (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::TEXT || '-' ||
          RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  END IF;

  seq_num := nextval('public.invoice_sequence_2025_26');

  RETURN 'CHX/' || fy || '/' || LPAD(seq_num::TEXT, 6, '0');
END;
$$;

-- ============================================
-- 9. FINANCIAL YEAR + QUARTER HELPER
-- ============================================

CREATE OR REPLACE FUNCTION public.get_financial_year_quarter(d DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(fy TEXT, qtr TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  m INT;
  y INT;
BEGIN
  m := EXTRACT(MONTH FROM d);
  y := EXTRACT(YEAR FROM d);

  IF m >= 4 THEN
    fy := y::TEXT || '-' || RIGHT((y + 1)::TEXT, 2);
  ELSE
    fy := (y - 1)::TEXT || '-' || RIGHT(y::TEXT, 2);
  END IF;

  qtr := CASE
    WHEN m IN (4, 5, 6)   THEN 'Q1'
    WHEN m IN (7, 8, 9)   THEN 'Q2'
    WHEN m IN (10, 11, 12) THEN 'Q3'
    ELSE 'Q4'
  END;

  RETURN NEXT;
END;
$$;

-- ============================================
-- DONE
-- ============================================
SELECT 'Migration 008 complete: payment, TDS, GST, and GPS attendance ready.' AS status;
