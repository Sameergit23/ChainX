"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ContractorDashboard() {
  const [stats, setStats] = useState({
    activeJobs: 0,
    pendingApplications: 0,
    completedJobs: 0,
    totalWorkers: 0,
  })
  const [recentJobs, setRecentJobs] = useState<any[]>([])
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

        // Fetch active jobs
        const { data: jobs } = await supabase
          .from("jobs")
          .select("*")
          .eq("contractor_id", user.id)
          .eq("status", "active")
          .limit(5)

        // Fetch pending applications
        const { data: applications } = await supabase
          .from("job_applications")
          .select("*")
          .eq("status", "pending")
          .in("job_id", jobs?.map((j) => j.id) || [])

        // Fetch completed jobs
        const { data: completed } = await supabase
          .from("jobs")
          .select("*")
          .eq("contractor_id", user.id)
          .eq("status", "completed")

        setStats({
          activeJobs: jobs?.length || 0,
          pendingApplications: applications?.length || 0,
          completedJobs: completed?.length || 0,
          totalWorkers: new Set(applications?.map((a) => a.worker_id)).size || 0,
        })

        setRecentJobs(jobs || [])
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Contractor Dashboard</h1>
        <p className="text-xl text-gray-600">Manage your jobs, workers, and grow your business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Active Jobs</div>
          <div className="text-3xl font-bold text-blue-600">{stats.activeJobs}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Pending Applications</div>
          <div className="text-3xl font-bold text-orange-600">{stats.pendingApplications}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Completed Jobs</div>
          <div className="text-3xl font-bold text-green-600">{stats.completedJobs}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Total Workers Hired</div>
          <div className="text-3xl font-bold text-purple-600">{stats.totalWorkers}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-lg mb-12 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/contractor/post-job">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg">Post Regular Job</Button>
          </Link>
          <Link href="/contractor/tatkal">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg">
              Post Tatkal (Urgent)
            </Button>
          </Link>
          <Link href="/contractor/applications">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg">
              View Applications
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Recent Jobs</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentJobs.length > 0 ? (
            recentJobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600 mt-1">{job.description}</p>
                    <div className="flex gap-4 mt-3 text-sm text-gray-600">
                      <span>📍 {job.location}</span>
                      <span>👥 {job.workers_needed} workers needed</span>
                      <span>💰 ₹{job.hourly_rate}/hour</span>
                    </div>
                  </div>
                  <Link href={`/contractor/applications?job_id=${job.id}`}>
                    <Button variant="outline">View Applications</Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-600">
              <p>No active jobs yet. Start by posting a job!</p>
              <Link href="/contractor/post-job" className="mt-4 inline-block">
                <Button className="bg-blue-600 hover:bg-blue-700">Post Your First Job</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
