import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { computeWorkerSplit } from "@/lib/razorpay/escrow"

// POST /api/payments/release
// Body: { applicationId: string, grossWageRupees: number }
//
// Called by the contractor (or auto-trigger on check-out) to release
// payment to a single worker for a completed job. Deducts 1% TDS,
// writes the payout row, writes the TDS ledger entry, and initiates
// the Razorpay payout to the worker's UPI/bank.
//
// NOTE: Actual payout via RazorpayX requires a separate KYC-approved
// account. Until then this records the intent and marks status='pending'
// for manual payout processing.

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const { applicationId, grossWageRupees } = await request.json()

    if (!applicationId || !grossWageRupees) {
      return NextResponse.json(
        { error: "Missing applicationId or grossWageRupees" },
        { status: 400 },
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. Load application + job + escrow
    const { data: app, error: appErr } = await supabase
      .from("job_applications")
      .select("id, job_id, worker_id, status")
      .eq("id", applicationId)
      .single()

    if (appErr || !app) {
      return NextResponse.json(
        { error: "Application not found", details: appErr?.message },
        { status: 404 },
      )
    }

    if (app.status !== "completed") {
      return NextResponse.json(
        { error: `Application status must be 'completed' to release payment (got '${app.status}')` },
        { status: 400 },
      )
    }

    const { data: escrow, error: escErr } = await supabase
      .from("escrow_payments")
      .select("*")
      .eq("job_id", app.job_id)
      .single()

    if (escErr || !escrow) {
      return NextResponse.json(
        { error: "Escrow not found for this job", details: escErr?.message },
        { status: 404 },
      )
    }

    if (escrow.status !== "funded" && escrow.status !== "partial_released") {
      return NextResponse.json(
        { error: `Escrow not releasable (status='${escrow.status}')` },
        { status: 400 },
      )
    }

    // 2. Compute worker split (gross / TDS / net)
    const grossPaise = Math.round(grossWageRupees * 100)
    const split = computeWorkerSplit(grossPaise)

    // 3. Load worker payout details
    const { data: worker } = await supabase
      .from("profiles")
      .select("upi_id, bank_account_number, bank_ifsc, preferred_payout_method, pan_number")
      .eq("id", app.worker_id)
      .single()

    if (!worker || (!worker.upi_id && !worker.bank_account_number)) {
      return NextResponse.json(
        { error: "Worker has not added payout details (UPI or bank account)" },
        { status: 400 },
      )
    }

    const payoutMethod = worker.preferred_payout_method ?? (worker.upi_id ? "upi" : "bank")

    // 4. Create worker_payouts row (status: pending — actual disbursement
    //    happens via RazorpayX once configured, or manually for now)
    const { data: payout, error: payoutErr } = await supabase
      .from("worker_payouts")
      .insert({
        escrow_id: escrow.id,
        job_id: app.job_id,
        application_id: app.id,
        worker_id: app.worker_id,
        gross_amount_paise: split.grossPaise,
        tds_amount_paise: split.tdsPaise,
        net_amount_paise: split.netPaise,
        payout_method: payoutMethod,
        status: "pending",
      })
      .select()
      .single()

    if (payoutErr || !payout) {
      return NextResponse.json(
        { error: "Failed to create payout record", details: payoutErr?.message },
        { status: 500 },
      )
    }

    // 5. Write TDS ledger entry
    const { data: fyqData } = await supabase.rpc("get_financial_year_quarter")
    const fy = (fyqData?.[0]?.fy as string) ?? "2025-26"
    const qtr = (fyqData?.[0]?.qtr as string) ?? "Q1"

    await supabase.from("tds_ledger").insert({
      worker_id: app.worker_id,
      payout_id: payout.id,
      financial_year: fy,
      quarter: qtr,
      gross_amount_paise: split.grossPaise,
      tds_rate: 1.0,
      tds_amount_paise: split.tdsPaise,
      pan_number: worker.pan_number,
    })

    // 6. Update application with final_amount
    await supabase
      .from("job_applications")
      .update({ final_amount: split.netPaise / 100 })
      .eq("id", app.id)

    // 7. Notify worker
    await supabase.from("notifications").insert({
      user_id: app.worker_id,
      job_id: app.job_id,
      type: "job_completed",
      title: "Payment released",
      message: `₹${(split.netPaise / 100).toLocaleString("en-IN")} has been released to your ${payoutMethod === "upi" ? "UPI" : "bank account"}. TDS of ₹${(split.tdsPaise / 100).toLocaleString("en-IN")} was deducted (Section 194C, Form 16A will be issued quarterly).`,
    })

    // TODO: When RazorpayX is approved, call createPayout() here and
    // update the payout row with razorpay_payout_id and status='processing'.

    return NextResponse.json({
      ok: true,
      payoutId: payout.id,
      grossPaise: split.grossPaise,
      tdsPaise: split.tdsPaise,
      netPaise: split.netPaise,
      message: "Payout queued. RazorpayX disbursement pending account approval.",
    })
  } catch (err) {
    console.error("release error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
