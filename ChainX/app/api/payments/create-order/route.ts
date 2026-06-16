import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createOrder } from "@/lib/razorpay/client"
import { computeEscrowBreakdown, rupeesToPaise } from "@/lib/razorpay/escrow"

// POST /api/payments/create-order
// Body: { jobId: string, wageBudgetRupees: number }
//
// Creates a Razorpay order for the contractor to deposit escrow funds,
// and writes a `created` row into `escrow_payments`. The frontend then
// opens the Razorpay checkout with the returned order_id.

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Supabase service-role key not configured" },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { jobId, wageBudgetRupees, contractorId } = body

    if (!jobId || !wageBudgetRupees || !contractorId) {
      return NextResponse.json(
        { error: "Missing required fields: jobId, wageBudgetRupees, contractorId" },
        { status: 400 },
      )
    }

    if (typeof wageBudgetRupees !== "number" || wageBudgetRupees <= 0) {
      return NextResponse.json(
        { error: "wageBudgetRupees must be a positive number" },
        { status: 400 },
      )
    }

    // Compute breakdown
    const wagePaise = rupeesToPaise(wageBudgetRupees)
    const breakdown = computeEscrowBreakdown(wagePaise)

    // Create Razorpay order for the FULL amount contractor pays
    // (wages + platform fee + GST)
    const order = await createOrder({
      amountPaise: breakdown.totalContractorPaysPaise,
      receipt: `chainx_job_${jobId.slice(0, 30)}`,
      notes: {
        chainx_job_id: jobId,
        chainx_contractor_id: contractorId,
        wage_budget_paise: String(breakdown.totalWageBudgetPaise),
        platform_fee_paise: String(breakdown.platformFeePaise),
        gst_paise: String(breakdown.gstOnFeePaise),
        tds_paise: String(breakdown.tdsTotalPaise),
      },
    })

    // Write escrow row (status: 'created'; flips to 'funded' on signature verify)
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error: insertError } = await supabase.from("escrow_payments").insert({
      job_id: jobId,
      contractor_id: contractorId,
      total_amount_paise: breakdown.totalContractorPaysPaise,
      platform_fee_paise: breakdown.platformFeePaise,
      gst_on_fee_paise: breakdown.gstOnFeePaise,
      worker_payout_paise: breakdown.netWorkerPayoutPaise,
      tds_paise: breakdown.tdsTotalPaise,
      razorpay_order_id: order.id,
      status: "created",
    })

    if (insertError) {
      console.error("Failed to insert escrow row:", insertError)
      return NextResponse.json(
        { error: "Failed to record escrow", details: insertError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      breakdown: {
        wageBudgetPaise: breakdown.totalWageBudgetPaise,
        platformFeePaise: breakdown.platformFeePaise,
        gstOnFeePaise: breakdown.gstOnFeePaise,
        tdsTotalPaise: breakdown.tdsTotalPaise,
        netWorkerPayoutPaise: breakdown.netWorkerPayoutPaise,
        totalContractorPaysPaise: breakdown.totalContractorPaysPaise,
      },
    })
  } catch (err) {
    console.error("create-order error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
