"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function WorkerDashboard() {
  const [stats, setStats] = useState({
    pendingApplications: 0,
    acceptedJobs: 0,
    completedJobs: 0,
    penaltyPoints: 0,
  })
  const [upcomingJobs, setUpcomingJobs] = useState<any[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }

        // Fetch pending applications
        const { data: pending } = await supabase
          .from("job_applications")
          .select("*")
          .eq("worker_id", user.id)
          .eq("status", "pending")

        // Fetch accepted jobs
        const { data: accepted } = await supabase
          .from("job_applications")
          .select("*, jobs(*)")
          .eq("worker_id", user.id)
          .eq("status", "accepted")
          .limit(5)

        // Fetch completed jobs
        const { data: completed } = await supabase
          .from("job_applications")
          .select("*")
          .eq("worker_id", user.id)
          .eq("status", "completed")

        // Fetch penalty points
        const { data: profile } = await supabase.from("profiles").select("penalty_points").eq("id", user.id).single()

        setStats({
          pendingApplications: pending?.length || 0,
          acceptedJobs: accepted?.length || 0,
          completedJobs: completed?.length || 0,
          penaltyPoints: profile?.penalty_points || 0,
        })

        setUpcomingJobs(accepted || [])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      }
    }

    fetchDashboardData()
  }, [supabase, router])

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Welcome Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Worker Dashboard</h1>
        <p className="text-xl text-gray-600">Find jobs, track applications, and earn money</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Pending Applications</div>
          <div className="text-3xl font-bold text-orange-600">{stats.pendingApplications}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Accepted Jobs</div>
          <div className="text-3xl font-bold text-green-600">{stats.acceptedJobs}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Completed Jobs</div>
          <div className="text-3xl font-bold text-blue-600">{stats.completedJobs}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Penalty Points</div>
          <div className={`text-3xl font-bold ${stats.penaltyPoints > 0 ? "text-red-600" : "text-green-600"}`}>
            {stats.penaltyPoints}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-8 rounded-lg mb-12 border border-green-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/worker/jobs">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg">
              Browse Available Jobs
            </Button>
          </Link>
          <Link href="/worker/tatkal-jobs">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg">
              Grab Tatkal Jobs
            </Button>
          </Link>
          <Link href="/worker/my-applications">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg">My Applications</Button>
          </Link>
        </div>
      </div>

      {/* Upcoming Jobs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Upcoming Jobs</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {upcomingJobs.length > 0 ? (
            upcomingJobs.map((app) => (
              <div key={app.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{app.jobs?.title}</h3>
                    <p className="text-gray-600 mt-1">{app.jobs?.description}</p>
                    <div className="flex gap-4 mt-3 text-sm text-gray-600">
                      <span>📍 {app.jobs?.location}</span>
                      <span>📅 {new Date(app.jobs?.job_date).toLocaleDateString()}</span>
                      <span>💰 ₹{app.jobs?.hourly_rate}/hour</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      Accepted
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-600">
              <p>No upcoming jobs yet. Start applying to jobs!</p>
              <Link href="/worker/jobs" className="mt-4 inline-block">
                <Button className="bg-green-600 hover:bg-green-700">Browse Jobs</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
