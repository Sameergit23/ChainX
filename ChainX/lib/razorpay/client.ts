import crypto from "crypto"

// ============================================
// ChainX Razorpay Client
// ============================================
// Server-side only. Do NOT import this in client components.
// Uses RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from environment.

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1"

function assertConfig() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local",
    )
  }
}

function authHeader() {
  assertConfig()
  const token = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")
  return `Basic ${token}`
}

// ============================================
// Orders — used to collect contractor escrow deposit
// ============================================

export interface CreateOrderParams {
  amountPaise: number              // Amount in paise (₹100 = 10000)
  receipt: string                  // Your reference, e.g. job ID
  notes?: Record<string, string>
}

export interface RazorpayOrder {
  id: string
  entity: "order"
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: "created" | "attempted" | "paid"
  created_at: number
}

export async function createOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
  const res = await fetch(`${RAZORPAY_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes ?? {},
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Razorpay createOrder failed: ${res.status} ${errBody}`)
  }

  return res.json()
}

// ============================================
// Signature verification — call after client-side checkout
// ============================================

export interface VerifyPaymentParams {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export function verifyPaymentSignature(params: VerifyPaymentParams): boolean {
  assertConfig()
  const payload = `${params.razorpay_order_id}|${params.razorpay_payment_id}`
  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET!)
    .update(payload)
    .digest("hex")
  return expected === params.razorpay_signature
}

// ============================================
// Payouts — disburse to worker UPI or bank
// ============================================
// NOTE: Razorpay Payouts (RazorpayX) requires a separate KYC-approved
// business account. For now we expose the interface; wire it up once
// RazorpayX account is approved. Until then, use manual payout via
// dashboard or use the contractor → worker direct UPI fallback.

export interface PayoutParams {
  amountPaise: number
  fundAccountId: string            // Razorpay fund account ID for the worker
  purpose: "payout" | "salary" | "vendor_advance"
  referenceId: string              // Your internal reference
  narration?: string               // Appears on bank statement (max 30 chars)
  mode: "IMPS" | "UPI" | "NEFT"
}

export interface RazorpayPayout {
  id: string
  entity: "payout"
  amount: number
  currency: string
  status: "queued" | "pending" | "processing" | "processed" | "reversed" | "cancelled" | "failed"
  utr?: string
  reference_id: string
  created_at: number
}

export async function createPayout(params: PayoutParams): Promise<RazorpayPayout> {
  // Endpoint differs slightly for RazorpayX
  const res = await fetch(`${RAZORPAY_BASE_URL}/payouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,  // Your RazorpayX account
      amount: params.amountPaise,
      currency: "INR",
      mode: params.mode,
      purpose: params.purpose,
      fund_account_id: params.fundAccountId,
      queue_if_low_balance: true,
      reference_id: params.referenceId,
      narration: params.narration?.slice(0, 30) ?? "ChainX payout",
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Razorpay createPayout failed: ${res.status} ${errBody}`)
  }

  return res.json()
}

// ============================================
// Refund — return escrow to contractor (cancelled jobs)
// ============================================

export async function refundPayment(paymentId: string, amountPaise: number): Promise<unknown> {
  const res = await fetch(`${RAZORPAY_BASE_URL}/payments/${paymentId}/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({ amount: amountPaise }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Razorpay refund failed: ${res.status} ${errBody}`)
  }

  return res.json()
}

// ============================================
// Public config (safe to expose to client)
// ============================================

export const publicConfig = {
  keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
}
