"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"

interface WorkerProfile {
  id: string
  full_name: string
  phone: string
  location: string
  rating: number
  total_jobs: number
  penalty_points: number
}

interface ApplicationStats {
  pending: number
  accepted: number
  completed: number
}

export default function WorkerDashboard() {
  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [stats, setStats] = useState<ApplicationStats>({ pending: 0, accepted: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchWorkerData = async () => {
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

        if (profileData?.user_type !== "worker") {
          redirect("/dashboard/contractor")
          return
        }

        setProfile(profileData)

        // Fetch application stats
        const { data: applications } = await supabase.from("job_applications").select("status").eq("worker_id", user.id)

        if (applications) {
          const stats = {
            pending: applications.filter((a) => a.status === "pending").length,
            accepted: applications.filter((a) => a.status === "accepted").length,
            completed: applications.filter((a) => a.status === "completed").length,
          }
          setStats(stats)
        }
      } catch (error) {
        console.error("Error fetching worker data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkerData()
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome, {profile.full_name}!</h1>
          <p className="text-muted-foreground">Manage your jobs and applications</p>
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
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="font-semibold text-lg">{profile.total_jobs}</p>
              </div>
            </div>

            {profile.penalty_points > 0 && (
              <div className="mt-6 bg-orange-50 border border-orange-200 rounded p-4">
                <p className="text-sm font-semibold text-orange-900">⚠️ Penalty Points: {profile.penalty_points}</p>
                <p className="text-xs text-orange-700 mt-1">
                  Penalties are issued for no-shows and last-minute cancellations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground mt-2">Pending Applications</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">{stats.accepted}</p>
                <p className="text-sm text-muted-foreground mt-2">Accepted Jobs</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">{stats.completed}</p>
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
              <Link href="/worker/jobs" className="block">
                <Button className="w-full">Browse Available Jobs</Button>
              </Link>
              <Link href="/worker/tatkal-jobs" className="block">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">View Tatkal Jobs</Button>
              </Link>
              <Link href="/worker/my-applications" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  My Applications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>1. Browse available jobs in your area</p>
              <p>2. Apply for jobs that interest you</p>
              <p>3. Wait for contractor approval</p>
              <p>4. Complete the job on time</p>
              <p>5. Get paid and build your reputation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tatkal Jobs</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>Urgent jobs with premium pay!</p>
              <p>• High: 1.5x pay, 2 hours to grab</p>
              <p>• Critical: 2x pay, 1 hour to grab</p>
              <p>• Grab instantly and start working</p>
              <p>• Perfect for quick earnings</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
