"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface Application {
  id: string
  job_id: string
  status: string
  applied_at: string
  accepted_at: string | null
  job: {
    title: string
    location: string
    start_date: string
    start_time: string
    hourly_rate: number
    is_tatkal: boolean
    tatkal_multiplier: number
  }
}

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

        // First, get all applications for this worker
        const { data: applicationsData, error: appsError } = await supabase
          .from("job_applications")
          .select("id, job_id, status, applied_at, accepted_at")
          .eq("worker_id", user.id)
          .order("applied_at", { ascending: false })

        if (appsError) {
          console.error("Error fetching applications:", appsError)
          setErrorMessage(`Failed to load applications: ${appsError.message}`)
          throw appsError
        }

        if (!applicationsData || applicationsData.length === 0) {
          setApplications([])
          return
        }

        // Get all unique job IDs
        const jobIds = applicationsData.map((app) => app.job_id).filter(Boolean)

        if (jobIds.length === 0) {
          setApplications([])
          return
        }

        // Fetch all related jobs
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title, location, start_date, start_time, hourly_rate, is_tatkal, tatkal_multiplier")
          .in("id", jobIds)

        if (jobsError) {
          console.error("Error fetching jobs:", jobsError)
          setErrorMessage(`Failed to load job details: ${jobsError.message}`)
          throw jobsError
        }

        // Create a map of job_id to job data for quick lookup
        const jobsMap = new Map((jobsData || []).map((job: any) => [job.id, job]))

        // Combine applications with their job data
        const formattedData = applicationsData.map((app: any) => ({
          id: app.id,
          job_id: app.job_id,
          status: app.status,
          applied_at: app.applied_at,
          accepted_at: app.accepted_at,
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

    // Subscribe to real-time updates
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

      // Get the application status
      const { data: appData } = await supabase
        .from("job_applications")
        .select("status")
        .eq("id", applicationId)
        .single()

      // If already accepted, add penalty
      if (appData?.status === "accepted") {
        const { error: penaltyError } = await supabase.from("penalties").insert({
          worker_id: user.id,
          job_id: jobId,
          reason: "Denied accepted job at last moment",
          penalty_points: 3,
        })

        if (penaltyError) throw penaltyError

        // Update worker penalty points
        const { data: penaltyData } = await supabase.from("penalties").select("penalty_points").eq("worker_id", user.id)

        const totalPenalties = penaltyData?.reduce((sum, p) => sum + p.penalty_points, 0) || 0

        await supabase.from("profiles").update({ penalty_points: totalPenalties }).eq("id", user.id)

        // Create notification
        await supabase.from("notifications").insert({
          user_id: user.id,
          job_id: jobId,
          type: "penalty_issued",
          title: "Penalty Issued",
          message: `You denied an accepted job. 3 penalty points added. Total penalties: ${totalPenalties}`,
        })
      }

      // Update application status
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({ status: "rejected" })
        .eq("id", applicationId)

      if (updateError) throw updateError

      setApplications((prev) => prev.map((app) => (app.id === applicationId ? { ...app, status: "rejected" } : app)))

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
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading applications...</div>
  }

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
            applications.map((app) => (
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
                      <p className="font-semibold">{new Date(app.job?.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time</p>
                      <p className="font-semibold">{app.job?.start_time}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pay Rate</p>
                      <p className="font-semibold">
                        ${(app.job?.hourly_rate * (app.job?.is_tatkal ? app.job?.tatkal_multiplier : 1)).toFixed(2)}/hr
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Applied</p>
                      <p className="font-semibold">{new Date(app.applied_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {app.status === "accepted" && (
                    <div className="bg-green-100 border border-green-300 rounded p-3 text-sm">
                      <p className="font-semibold text-green-800">Job Accepted!</p>
                      <p className="text-green-700">Please arrive on time at the specified location and time.</p>
                    </div>
                  )}

                  {app.status === "accepted" && (
                    <Button onClick={() => handleDenyJob(app.id, app.job_id)} variant="destructive" className="w-full">
                      Deny Job (Will Result in Penalty)
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
