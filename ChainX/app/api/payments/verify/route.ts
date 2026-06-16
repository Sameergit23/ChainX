import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyPaymentSignature } from "@/lib/razorpay/client"
import { computeGstSplit } from "@/lib/razorpay/escrow"

// POST /api/payments/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
//
// Called by the frontend after Razorpay checkout completes successfully.
// Verifies the signature, flips escrow to 'funded', and generates the
// GST invoice for the platform fee.

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing Razorpay verification fields" },
        { status: 400 },
      )
    }

    // 1. Verify HMAC signature
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    })

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature — payment rejected" },
        { status: 400 },
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 2. Find the escrow row
    const { data: escrow, error: fetchErr } = await supabase
      .from("escrow_payments")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .single()

    if (fetchErr || !escrow) {
      return NextResponse.json(
        { error: "Escrow record not found", details: fetchErr?.message },
        { status: 404 },
      )
    }

    if (escrow.status !== "created") {
      // Idempotency: already processed
      return NextResponse.json({
        ok: true,
        message: "Escrow already funded",
        escrowId: escrow.id,
      })
    }

    // 3. Flip escrow to 'funded'
    const { error: updateErr } = await supabase
      .from("escrow_payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "funded",
        funded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", escrow.id)

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update escrow", details: updateErr.message },
        { status: 500 },
      )
    }

    // 4. Generate GST invoice for the platform fee
    const { data: contractor } = await supabase
      .from("profiles")
      .select("gstin, state, company_name, billing_address")
      .eq("id", escrow.contractor_id)
      .single()

    const { data: invoiceNumberData } = await supabase.rpc("generate_invoice_number")
    const invoiceNumber = invoiceNumberData as string

    const { data: fyqData } = await supabase.rpc("get_financial_year_quarter")
    const fy = (fyqData?.[0]?.fy as string) ?? "2025-26"

    const gstSplit = computeGstSplit(escrow.platform_fee_paise, contractor?.state)

    const { error: invoiceErr } = await supabase.from("gst_invoices").insert({
      escrow_id: escrow.id,
      contractor_id: escrow.contractor_id,
      invoice_number: invoiceNumber,
      financial_year: fy,
      taxable_value_paise: escrow.platform_fee_paise,
      cgst_paise: gstSplit.cgstPaise,
      sgst_paise: gstSplit.sgstPaise,
      igst_paise: gstSplit.igstPaise,
      total_paise: escrow.platform_fee_paise + escrow.gst_on_fee_paise,
      contractor_gstin: contractor?.gstin ?? null,
      contractor_state: contractor?.state ?? null,
    })

    if (invoiceErr) {
      console.error("Invoice creation failed (non-fatal):", invoiceErr)
      // Don't fail the request — escrow is funded; invoice can be regenerated.
    }

    // 5. Notify contractor
    await supabase.from("notifications").insert({
      user_id: escrow.contractor_id,
      job_id: escrow.job_id,
      type: "job_posted",
      title: "Escrow funded",
      message: `Your payment of ₹${(escrow.total_amount_paise / 100).toLocaleString("en-IN")} is now held safely in ChainX escrow. Workers will be paid on completion.`,
    })

    return NextResponse.json({
      ok: true,
      escrowId: escrow.id,
      invoiceNumber,
    })
  } catch (err) {
    console.error("verify error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
