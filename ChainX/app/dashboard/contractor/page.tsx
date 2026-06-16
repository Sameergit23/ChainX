"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"

interface ContractorProfile {
  id: string
  full_name: string
  phone: string
  location: string
  rating: number
  total_jobs: number
}

interface JobStats {
  active: number
  completed: number
  pending_applications: number
}

interface RecentJob {
  id: string
  title: string
  location: string
  workers_needed: number
  status: string
  created_at: string
  is_tatkal: boolean
}

export default function ContractorDashboard() {
  const [profile, setProfile] = useState<ContractorProfile | null>(null)
  const [stats, setStats] = useState<JobStats>({ active: 0, completed: 0, pending_applications: 0 })
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchContractorData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          redirect("/auth/login")
          return
        }

        // Fetch profile
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profileData?.user_type !== "contractor") {
          redirect("/dashboard/worker")
          return
        }

        setProfile(profileData)

        // Fetch job stats
        const { data: jobs } = await supabase.from("jobs").select("status").eq("contractor_id", user.id)

        if (jobs) {
          const stats = {
            active: jobs.filter((j) => j.status === "open" || j.status === "in_progress").length,
            completed: jobs.filter((j) => j.status === "completed").length,
            pending_applications: 0,
          }

          // Count pending applications
          const { data: applications } = await supabase
            .from("job_applications")
            .select("id")
            .eq("status", "pending")
            .in(
              "job_id",
              jobs.map((j) => j.id),
            )

          stats.pending_applications = applications?.length || 0

          setStats(stats)
        }

        // Fetch recent jobs
        const { data: recentJobsData } = await supabase
          .from("jobs")
          .select("*")
          .eq("contractor_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        setRecentJobs(recentJobsData || [])
      } catch (error) {
        console.error("Error fetching contractor data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContractorData()
  }, [supabase])

  if (loading) {
    return <div className="p-6 text-center">Loading dashboard...</div>
  }

  if (!profile) {
    return <div className="p-6 text-center">Unable to load profile</div>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome, {profile.full_name}!</h1>
            <p className="text-muted-foreground">Manage your jobs and find workers</p>
          </div>
          <div className="flex gap-2">
            <Link href="/contractor/post-job">
              <Button>Post Regular Job</Button>
            </Link>
            <Link href="/contractor/tatkal">
              <Button className="bg-orange-600 hover:bg-orange-700">Post Tatkal Job</Button>
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">{profile.phone || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold">{profile.location || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="font-semibold text-lg">⭐ {profile.rating}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs Posted</p>
                <p className="font-semibold text-lg">{profile.total_jobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">{stats.active}</p>
                <p className="text-sm text-muted-foreground mt-2">Active Jobs</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-yellow-600">{stats.pending_applications}</p>
                <p className="text-sm text-muted-foreground mt-2">Pending Applications</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-muted-foreground mt-2">Completed Jobs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/contractor/post-job" className="block">
                <Button className="w-full">Post New Job</Button>
              </Link>
              <Link href="/contractor/applications" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  View Applications
                </Button>
              </Link>
              <Link href="/contractor/tatkal" className="block">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">Post Urgent Job</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Your recently posted jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No jobs posted yet</p>
            ) : (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex justify-between items-start p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{job.title}</h3>
                        {job.is_tatkal && (
                          <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">TATKAL</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{job.location}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.workers_needed} workers needed • Posted {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          job.status === "open"
                            ? "bg-green-100 text-green-800"
                            : job.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {job.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
