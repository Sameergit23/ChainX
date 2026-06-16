"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface TatkalJob {
  id: string
  job_id: string
  urgency_level: string
  expires_at: string
  job: {
    id: string
    title: string
    description: string
    location: string
    workers_needed: number
    hourly_rate: number
    start_time: string
    tatkal_multiplier: number
  }
}

export default function TatkalJobsPage() {
  const [tatkalJobs, setTatkalJobs] = useState<TatkalJob[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchTatkalJobs = async () => {
      try {
        const now = new Date().toISOString()

        // First, get all active tatkal jobs
        const { data: tatkalData, error: tatkalError } = await supabase
          .from("tatkal_jobs")
          .select("id, job_id, urgency_level, expires_at")
          .gt("expires_at", now)
          .order("expires_at", { ascending: true })

        if (tatkalError) throw tatkalError

        if (!tatkalData || tatkalData.length === 0) {
          setTatkalJobs([])
          return
        }

        // Get all job IDs
        const jobIds = tatkalData.map((tj) => tj.job_id).filter(Boolean)

        // Fetch job details
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title, description, location, workers_needed, hourly_rate, start_time, tatkal_multiplier")
          .in("id", jobIds)

        if (jobsError) throw jobsError

        // Create map for quick lookup
        const jobsMap = new Map((jobsData || []).map((job: any) => [job.id, job]))

        // Combine data
        const formattedData = tatkalData.map((tatkal: any) => ({
          id: tatkal.id,
          job_id: tatkal.job_id,
          urgency_level: tatkal.urgency_level,
          expires_at: tatkal.expires_at,
          job: jobsMap.get(tatkal.job_id) || null,
        }))

        setTatkalJobs(formattedData)
      } catch (error) {
        console.error("Error fetching tatkal jobs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTatkalJobs()

    // Subscribe to real-time updates
    const channel = supabase
      .channel("tatkal_jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "tatkal_jobs" }, () => {
        fetchTatkalJobs()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const handleGrabJob = async (jobId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("job_applications").insert({
        job_id: jobId,
        worker_id: user.id,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })

      if (error) throw error

      // Create notification for worker
      await supabase.from("notifications").insert({
        user_id: user.id,
        job_id: jobId,
        type: "job_accepted",
        title: "Tatkal Job Grabbed!",
        message: "You have successfully grabbed this urgent job. Please arrive on time!",
      })

      alert("Job grabbed successfully! You are now assigned to this job.")
      setTatkalJobs((prev) => prev.filter((tj) => tj.job_id !== jobId))
    } catch (error) {
      console.error("Error grabbing job:", error)
      alert("Failed to grab job")
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    if (minutes <= 0) return "Expired"
    if (minutes < 1) return `${seconds}s left`
    return `${minutes}m left`
  }

  if (loading) {
    return <div className="p-6 text-center">Loading urgent jobs...</div>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tatkal - Urgent Jobs</h1>
          <p className="text-muted-foreground">Grab urgent jobs and earn premium pay!</p>
        </div>

        <div className="grid gap-4">
          {tatkalJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No urgent jobs available at the moment. Check back soon!
              </CardContent>
            </Card>
          ) : (
            tatkalJobs.map((tatkal) => (
              <Card key={tatkal.id} className="border-2 border-orange-500 bg-orange-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-orange-900">{tatkal.job?.title}</CardTitle>
                        <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                          {tatkal.urgency_level === "critical" ? "CRITICAL - 2x PAY" : "HIGH - 1.5x PAY"}
                        </span>
                      </div>
                      <CardDescription>{tatkal.job?.location}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-600">
                        ${(tatkal.job?.hourly_rate * tatkal.job?.tatkal_multiplier).toFixed(2)}/hr
                      </div>
                      <p className="text-xs font-semibold text-orange-700 mt-1">
                        ⏱️ {getTimeRemaining(tatkal.expires_at)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{tatkal.job?.description}</p>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Workers Needed</p>
                      <p className="font-semibold">{tatkal.job?.workers_needed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Start Time</p>
                      <p className="font-semibold">{tatkal.job?.start_time}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Base Rate</p>
                      <p className="font-semibold">${tatkal.job?.hourly_rate}/hr</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleGrabJob(tatkal.job_id)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg py-6"
                  >
                    GRAB THIS JOB NOW
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
