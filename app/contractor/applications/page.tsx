"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface Application {
  id: string
  job_id: string
  worker_id: string
  status: string
  applied_at: string
  job: {
    title: string
    start_date: string
    start_time: string
  }
  worker: {
    full_name: string
    phone: string
    rating: number
  }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Not authenticated")

        // First, get all jobs for this contractor
        const { data: contractorJobs, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title, start_date, start_time")
          .eq("contractor_id", user.id)

        if (jobsError) throw jobsError

        if (!contractorJobs || contractorJobs.length === 0) {
          setApplications([])
          return
        }

        const jobIds = contractorJobs.map((job) => job.id)

        // Get all applications for these jobs
        const { data: applicationsData, error: appsError } = await supabase
          .from("job_applications")
          .select("id, job_id, worker_id, status, applied_at")
          .in("job_id", jobIds)

        if (appsError) throw appsError

        if (!applicationsData || applicationsData.length === 0) {
          setApplications([])
          return
        }

        // Get worker profiles
        const workerIds = applicationsData.map((app) => app.worker_id).filter(Boolean)
        const { data: workersData, error: workersError } = await supabase
          .from("profiles")
          .select("id, full_name, phone, rating")
          .in("id", workerIds)

        if (workersError) throw workersError

        // Create maps for quick lookup
        const jobsMap = new Map(contractorJobs.map((job: any) => [job.id, job]))
        const workersMap = new Map((workersData || []).map((worker: any) => [worker.id, worker]))

        // Combine everything
        const formattedData = applicationsData.map((app: any) => ({
          id: app.id,
          job_id: app.job_id,
          worker_id: app.worker_id,
          status: app.status,
          applied_at: app.applied_at,
          job: jobsMap.get(app.job_id) || null,
          worker: workersMap.get(app.worker_id) || null,
        }))

        setApplications(formattedData)
      } catch (error) {
        console.error("Error fetching applications:", error)
      } finally {
        setLoading(false)
      }
    }

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
  }, [supabase])

  const handleAcceptApplication = async (applicationId: string, workerId: string, jobId: string) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", applicationId)

      if (error) throw error

      // Create notification for worker
      await supabase.from("notifications").insert({
        user_id: workerId,
        job_id: jobId,
        type: "job_accepted",
        title: "Job Accepted",
        message: "Your application has been accepted! Please arrive on time.",
      })

      setApplications((prev) => prev.map((app) => (app.id === applicationId ? { ...app, status: "accepted" } : app)))

      alert("Application accepted!")
    } catch (error) {
      console.error("Error accepting application:", error)
      alert("Failed to accept application")
    }
  }

  const handleRejectApplication = async (applicationId: string, workerId: string) => {
    try {
      const { error } = await supabase.from("job_applications").update({ status: "rejected" }).eq("id", applicationId)

      if (error) throw error

      // Create notification for worker
      await supabase.from("notifications").insert({
        user_id: workerId,
        type: "job_rejected",
        title: "Application Rejected",
        message: "Unfortunately, your application was not selected for this job.",
      })

      setApplications((prev) => prev.map((app) => (app.id === applicationId ? { ...app, status: "rejected" } : app)))

      alert("Application rejected!")
    } catch (error) {
      console.error("Error rejecting application:", error)
      alert("Failed to reject application")
    }
  }

  const handleMarkNoShow = async (applicationId: string, workerId: string, jobId: string) => {
    try {
      // Mark as no-show
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({ status: "no_show" })
        .eq("id", applicationId)

      if (updateError) throw updateError

      // Add penalty to worker
      const { error: penaltyError } = await supabase.from("penalties").insert({
        worker_id: workerId,
        job_id: jobId,
        reason: "No-show on job date",
        penalty_points: 2,
      })

      if (penaltyError) throw penaltyError

      // Update worker penalty points
      const { data: penaltyData } = await supabase.from("penalties").select("penalty_points").eq("worker_id", workerId)

      const totalPenalties = penaltyData?.reduce((sum, p) => sum + p.penalty_points, 0) || 0

      await supabase.from("profiles").update({ penalty_points: totalPenalties }).eq("id", workerId)

      // Create notification for worker
      await supabase.from("notifications").insert({
        user_id: workerId,
        job_id: jobId,
        type: "penalty_issued",
        title: "Penalty Issued",
        message: `You have been marked as no-show. 2 penalty points added. Total penalties: ${totalPenalties}`,
      })

      setApplications((prev) => prev.map((app) => (app.id === applicationId ? { ...app, status: "no_show" } : app)))

      alert("Worker marked as no-show and penalty issued!")
    } catch (error) {
      console.error("Error marking no-show:", error)
      alert("Failed to mark no-show")
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
      case "no_show":
        return "bg-orange-50 border-orange-200"
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
        <h1 className="text-3xl font-bold mb-6">Job Applications</h1>

        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">No applications yet</CardContent>
            </Card>
          ) : (
            applications.map((app) => (
              <Card key={app.id} className={`border ${getStatusColor(app.status)}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{app.job?.title}</CardTitle>
                      <CardDescription>
                        {app.job?.start_date} at {app.job?.start_time}
                      </CardDescription>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white border">
                      {app.status.toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Worker</p>
                      <p className="font-semibold">{app.worker?.full_name}</p>
                      <p className="text-sm">{app.worker?.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                      <p className="font-semibold text-lg">⭐ {app.worker?.rating}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {app.status === "pending" && (
                      <>
                        <Button
                          onClick={() => handleAcceptApplication(app.id, app.worker_id, app.job_id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleRejectApplication(app.id, app.worker_id)}
                          variant="destructive"
                          className="flex-1"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {app.status === "accepted" && (
                      <Button
                        onClick={() => handleMarkNoShow(app.id, app.worker_id, app.job_id)}
                        variant="destructive"
                        className="w-full"
                      >
                        Mark as No-Show
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
