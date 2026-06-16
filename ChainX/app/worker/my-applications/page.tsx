"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GpsCheckIn } from "@/components/gps-check-in"
import { useEffect, useState } from "react"

interface Application {
  id: string
  job_id: string
  status: string
  applied_at: string
  accepted_at: string | null
  check_in_at: string | null
  check_out_at: string | null
  hours_worked: number | null
  job: {
    title: string
    location: string
    start_date: string
    start_time: string
    hourly_rate: number
    is_tatkal: boolean
    tatkal_multiplier: number
    location_lat: number | null
    location_lng: number | null
  } | null
}

const formatINR = (rupees: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees)

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const supabase = createClient()

  const fetchApplications = async () => {
    setErrorMessage(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: applicationsData, error: appsError } = await supabase
        .from("job_applications")
        .select(
          "id, job_id, status, applied_at, accepted_at, check_in_at, check_out_at, hours_worked",
        )
        .eq("worker_id", user.id)
        .order("applied_at", { ascending: false })

      if (appsError) {
        setErrorMessage(`Failed to load applications: ${appsError.message}`)
        throw appsError
      }

      if (!applicationsData || applicationsData.length === 0) {
        setApplications([])
        return
      }

      const jobIds = applicationsData.map((app) => app.job_id).filter(Boolean)
      if (jobIds.length === 0) {
        setApplications([])
        return
      }

      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select(
          "id, title, location, start_date, start_time, hourly_rate, is_tatkal, tatkal_multiplier, location_lat, location_lng",
        )
        .in("id", jobIds)

      if (jobsError) {
        setErrorMessage(`Failed to load job details: ${jobsError.message}`)
        throw jobsError
      }

      const jobsMap = new Map((jobsData || []).map((job: any) => [job.id, job]))

      const formattedData: Application[] = applicationsData.map((app: any) => ({
        id: app.id,
        job_id: app.job_id,
        status: app.status,
        applied_at: app.applied_at,
        accepted_at: app.accepted_at,
        check_in_at: app.check_in_at,
        check_out_at: app.check_out_at,
        hours_worked: app.hours_worked,
        job: jobsMap.get(app.job_id) || null,
      }))

      setApplications(formattedData)
    } catch (error: any) {
      console.error("Error fetching applications:", error)
      if (!errorMessage) {
        setErrorMessage(error?.message || "Failed to load applications. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()

    const channel = supabase
      .channel("job_applications")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_applications" }, () => {
        fetchApplications()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const handleDenyJob = async (applicationId: string, jobId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to deny this job? This will result in a penalty if you have already accepted it.",
    )
    if (!confirmed) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: appData } = await supabase
        .from("job_applications")
        .select("status")
        .eq("id", applicationId)
        .single()

      if (appData?.status === "accepted") {
        const { error: penaltyError } = await supabase.from("penalties").insert({
          worker_id: user.id,
          job_id: jobId,
          reason: "Denied accepted job at last moment",
          penalty_points: 3,
        })

        if (penaltyError) throw penaltyError

        const { data: penaltyData } = await supabase
          .from("penalties")
          .select("penalty_points")
          .eq("worker_id", user.id)

        const totalPenalties = penaltyData?.reduce((sum, p) => sum + p.penalty_points, 0) || 0

        await supabase.from("profiles").update({ penalty_points: totalPenalties }).eq("id", user.id)

        await supabase.from("notifications").insert({
          user_id: user.id,
          job_id: jobId,
          type: "penalty_issued",
          title: "Penalty Issued",
          message: `You denied an accepted job. 3 penalty points added. Total penalties: ${totalPenalties}`,
        })
      }

      const { error: updateError } = await supabase
        .from("job_applications")
        .update({ status: "rejected" })
        .eq("id", applicationId)

      if (updateError) throw updateError

      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: "rejected" } : app)),
      )

      alert("Job denied successfully!")
    } catch (error) {
      console.error("Error denying job:", error)
      alert("Failed to deny job")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 border-yellow-200"
      case "accepted":
        return "bg-green-50 border-green-200"
      case "rejected":
        return "bg-red-50 border-red-200"
      case "completed":
        return "bg-blue-50 border-blue-200"
      case "no_show":
        return "bg-gray-50 border-gray-300"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  if (loading) return <div className="p-6 text-center">Loading applications...</div>

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Applications</h1>

        {errorMessage && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600 text-sm">{errorMessage}</p>
              <Button
                onClick={() => {
                  setLoading(true)
                  fetchApplications()
                }}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {applications.length === 0 && !errorMessage ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                You haven't applied to any jobs yet
              </CardContent>
            </Card>
          ) : (
            applications.map((app) => {
              const effectiveRate =
                (app.job?.hourly_rate ?? 0) *
                (app.job?.is_tatkal ? (app.job?.tatkal_multiplier ?? 1.5) : 1)

              const isCheckedIn = !!app.check_in_at
              const isCheckedOut = !!app.check_out_at

              return (
                <Card key={app.id} className={`border ${getStatusColor(app.status)}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{app.job?.title}</CardTitle>
                        <CardDescription>{app.job?.location}</CardDescription>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white border">
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-semibold">
                          {app.job?.start_date && new Date(app.job.start_date).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <p className="font-semibold">{app.job?.start_time}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pay Rate</p>
                        <p className="font-semibold">
                          {formatINR(effectiveRate)}/hr
                          {app.job?.is_tatkal && (
                            <span className="ml-1 text-xs text-orange-600 font-bold">
                              ({app.job.tatkal_multiplier}× Tatkal)
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Applied</p>
                        <p className="font-semibold">{new Date(app.applied_at).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>

                    {/* Hours worked + earnings (shown after check-out) */}
                    {isCheckedOut && app.hours_worked != null && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-800">Hours worked</span>
                          <span className="font-bold text-blue-900">{app.hours_worked} hrs</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-blue-800">Gross wage</span>
                          <span className="font-bold text-blue-900">
                            {formatINR(effectiveRate * app.hours_worked)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Accepted but not checked in → show check-in UI */}
                    {app.status === "accepted" && !isCheckedIn && (
                      <>
                        <div className="bg-green-100 border border-green-300 rounded p-3 text-sm">
                          <p className="font-semibold text-green-800">Job Accepted!</p>
                          <p className="text-green-700">
                            Arrive at the location and check in via GPS to start the clock.
                          </p>
                        </div>
                        <GpsCheckIn
                          applicationId={app.id}
                          jobId={app.job_id}
                          jobLocationLat={app.job?.location_lat ?? null}
                          jobLocationLng={app.job?.location_lng ?? null}
                          isCheckedIn={false}
                          isCheckedOut={false}
                          onComplete={fetchApplications}
                        />
                        <Button
                          onClick={() => handleDenyJob(app.id, app.job_id)}
                          variant="outline"
                          className="w-full text-red-600 border-red-300 hover:bg-red-50"
                          size="sm"
                        >
                          Deny job (penalty will apply)
                        </Button>
                      </>
                    )}

                    {/* Checked in but not out → show check-out UI */}
                    {app.status === "accepted" && isCheckedIn && !isCheckedOut && (
                      <>
                        <div className="bg-orange-100 border border-orange-300 rounded p-3 text-sm">
                          <p className="font-semibold text-orange-800">⏱ Clock running</p>
                          <p className="text-orange-700">
                            Checked in at {new Date(app.check_in_at!).toLocaleTimeString("en-IN")}. Check out when
                            done.
                          </p>
                        </div>
                        <GpsCheckIn
                          applicationId={app.id}
                          jobId={app.job_id}
                          jobLocationLat={app.job?.location_lat ?? null}
                          jobLocationLng={app.job?.location_lng ?? null}
                          isCheckedIn={true}
                          isCheckedOut={false}
                          onComplete={fetchApplications}
                        />
                      </>
                    )}

                    {/* Completed → waiting for payment */}
                    {app.status === "completed" && (
                      <div className="bg-blue-100 border border-blue-300 rounded p-3 text-sm">
                        <p className="font-semibold text-blue-800">✓ Job completed</p>
                        <p className="text-blue-700">
                          Payment release in progress. Check your{" "}
                          <a href="/worker/earnings" className="underline font-medium">
                            Earnings
                          </a>{" "}
                          page.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
