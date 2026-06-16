import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// POST /api/worker/check-out
// Body: { applicationId, jobId, lat, lng }
//
// Computes hours worked from check_in_at to now, marks application
// as 'completed', and notifies the contractor so they can release payment.

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const { applicationId, jobId, lat, lng } = await request.json()

    if (!applicationId || !jobId || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. Load application
    const { data: app, error: appErr } = await supabase
      .from("job_applications")
      .select("id, worker_id, job_id, status, check_in_at, check_out_at")
      .eq("id", applicationId)
      .single()

    if (appErr || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (!app.check_in_at) {
      return NextResponse.json({ error: "You must check in before checking out" }, { status: 400 })
    }

    if (app.check_out_at) {
      return NextResponse.json({ error: "Already checked out" }, { status: 400 })
    }

    // 2. Compute hours worked
    const checkInTime = new Date(app.check_in_at).getTime()
    const now = new Date()
    const hoursWorked = Math.max(0.5, (now.getTime() - checkInTime) / (1000 * 60 * 60))
    const hoursRounded = Math.round(hoursWorked * 100) / 100

    // 3. Update application: check-out + mark completed
    const { error: updateErr } = await supabase
      .from("job_applications")
      .update({
        check_out_at: now.toISOString(),
        check_out_lat: lat,
        check_out_lng: lng,
        hours_worked: hoursRounded,
        status: "completed",
        completed_at: now.toISOString(),
      })
      .eq("id", applicationId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // 4. Compute wage so contractor sees it on their side
    const { data: job } = await supabase
      .from("jobs")
      .select("contractor_id, title, hourly_rate, is_tatkal, tatkal_multiplier")
      .eq("id", jobId)
      .single()

    const ratePerHour = job?.hourly_rate ?? 0
    const multiplier = job?.is_tatkal ? (job.tatkal_multiplier ?? 1.5) : 1
    const grossWage = Math.round(ratePerHour * multiplier * hoursRounded * 100) / 100

    // 5. Notify contractor — they need to approve & release payment
    if (job?.contractor_id) {
      await supabase.from("notifications").insert({
        user_id: job.contractor_id,
        job_id: jobId,
        type: "job_completed",
        title: "Worker checked out — approve payment",
        message: `Worker completed "${job.title ?? "your job"}" after ${hoursRounded} hours. Approve to release ₹${grossWage.toLocaleString("en-IN")} from escrow.`,
      })
    }

    // 6. Notify worker
    await supabase.from("notifications").insert({
      user_id: app.worker_id,
      job_id: jobId,
      type: "job_completed",
      title: "Checked out successfully",
      message: `You worked for ${hoursRounded} hours. ₹${grossWage.toLocaleString("en-IN")} will be released once the contractor approves (usually within a few minutes).`,
    })

    return NextResponse.json({
      ok: true,
      hoursWorked: hoursRounded,
      grossWageRupees: grossWage,
      checkedOutAt: now.toISOString(),
    })
  } catch (err) {
    console.error("check-out error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
}
