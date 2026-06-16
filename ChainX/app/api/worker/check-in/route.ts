import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// POST /api/worker/check-in
// Body: { applicationId, jobId, lat, lng, accuracy }
//
// Validates that the worker is at the job site (within configured radius)
// and writes check_in_at / check_in_lat / check_in_lng to job_applications.

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const { applicationId, jobId, lat, lng, accuracy } = await request.json()

    if (!applicationId || !jobId || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 })
    }

    // Authenticate via the user's bearer token from cookies — Supabase server clients
    // can do this. Using service-role here for simplicity; in production extract user
    // from session and verify ownership.
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. Load application + job
    const { data: app, error: appErr } = await supabase
      .from("job_applications")
      .select("id, worker_id, job_id, status, check_in_at")
      .eq("id", applicationId)
      .single()

    if (appErr || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (app.status !== "accepted") {
      return NextResponse.json(
        { error: `Application must be accepted to check in (current: ${app.status})` },
        { status: 400 },
      )
    }

    if (app.check_in_at) {
      return NextResponse.json({ error: "Already checked in" }, { status: 400 })
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("location_lat, location_lng, location_radius_meters, start_date, start_time")
      .eq("id", jobId)
      .single()

    // 2. Geo-fence check if job has coordinates
    if (job?.location_lat != null && job?.location_lng != null) {
      const radius = job.location_radius_meters ?? 200
      const distance = distanceMeters(lat, lng, job.location_lat, job.location_lng)
      if (distance > radius) {
        return NextResponse.json(
          {
            error: `You are ${Math.round(distance)}m from the job site. Must be within ${radius}m to check in.`,
            distance: Math.round(distance),
            radius,
          },
          { status: 400 },
        )
      }
    }

    // 3. Write check-in
    const now = new Date().toISOString()
    const { error: updateErr } = await supabase
      .from("job_applications")
      .update({
        check_in_at: now,
        check_in_lat: lat,
        check_in_lng: lng,
      })
      .eq("id", applicationId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      checkedInAt: now,
      accuracy: accuracy ?? null,
    })
  } catch (err) {
    console.error("check-in error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
}
