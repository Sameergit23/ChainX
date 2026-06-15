"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface Job {
  id: string
  title: string
  description: string
  location: string
  workers_needed: number
  hourly_rate: number
  is_tatkal: boolean
  tatkal_multiplier: number
  start_date: string
  start_time: string
  end_time: string
  status: string
  contractor_id: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "tatkal">("all")
  const supabase = createClient()

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        let query = supabase.from("jobs").select("*").eq("status", "open")

        if (filter === "tatkal") {
          query = query.eq("is_tatkal", true)
        }

        const { data, error } = await query.order("created_at", { ascending: false })

        if (error) throw error
        setJobs(data || [])
      } catch (error) {
        console.error("Error fetching jobs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()

    // Subscribe to real-time updates
    const channel = supabase
      .channel("jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setJobs((prev) => [payload.new as Job, ...prev])
        } else if (payload.eventType === "UPDATE") {
          setJobs((prev) => prev.map((job) => (job.id === payload.new.id ? (payload.new as Job) : job)))
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [filter, supabase])

  const handleApplyJob = async (jobId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("job_applications").insert({
        job_id: jobId,
        worker_id: user.id,
      })

      if (error) throw error

      // Create notification for worker
      await supabase.from("notifications").insert({
        user_id: user.id,
        job_id: jobId,
        type: "job_posted",
        title: "Application Submitted",
        message: "Your application has been submitted successfully",
      })

      alert("Application submitted successfully!")
    } catch (error) {
      console.error("Error applying for job:", error)
      alert("Failed to apply for job")
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading jobs...</div>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Available Jobs</h1>
          <div className="flex gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
              All Jobs
            </Button>
            <Button variant={filter === "tatkal" ? "default" : "outline"} onClick={() => setFilter("tatkal")}>
              Tatkal (Urgent)
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No jobs available at the moment. Check back soon!
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} className={job.is_tatkal ? "border-orange-500 border-2" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{job.title}</CardTitle>
                        {job.is_tatkal && (
                          <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">TATKAL</span>
                        )}
                      </div>
                      <CardDescription>{job.location}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${(job.hourly_rate * (job.is_tatkal ? job.tatkal_multiplier : 1)).toFixed(2)}/hr
                      </div>
                      {job.is_tatkal && <p className="text-xs text-orange-600">1.5x Premium Pay</p>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{job.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Workers Needed</p>
                      <p className="font-semibold">{job.workers_needed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-semibold">{new Date(job.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Start Time</p>
                      <p className="font-semibold">{job.start_time}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Time</p>
                      <p className="font-semibold">{job.end_time || "TBD"}</p>
                    </div>
                  </div>

                  <Button onClick={() => handleApplyJob(job.id)} className="w-full">
                    Apply Now
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
