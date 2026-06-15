"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function PostTatkalJobPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [workersNeeded, setWorkersNeeded] = useState("1")
  const [hourlyRate, setHourlyRate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [urgencyLevel, setUrgencyLevel] = useState<"high" | "critical">("high")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handlePostTatkalJob = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Create the job for today
      const today = new Date().toISOString().split("T")[0]

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .insert({
          contractor_id: user.id,
          title,
          description,
          location,
          workers_needed: Number.parseInt(workersNeeded),
          hourly_rate: Number.parseFloat(hourlyRate),
          start_date: today,
          start_time: startTime,
          is_tatkal: true,
          tatkal_multiplier: urgencyLevel === "critical" ? 2.0 : 1.5,
        })
        .select()
        .single()

      if (jobError) throw jobError

      // Create tatkal job entry
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + (urgencyLevel === "critical" ? 1 : 2))

      const { error: tatkalError } = await supabase.from("tatkal_jobs").insert({
        job_id: jobData.id,
        contractor_id: user.id,
        urgency_level: urgencyLevel,
        expires_at: expiresAt.toISOString(),
      })

      if (tatkalError) throw tatkalError

      // Send notifications to all workers
      const { data: workers } = await supabase.from("profiles").select("id").eq("user_type", "worker")

      if (workers && workers.length > 0) {
        const notifications = workers.map((worker) => ({
          user_id: worker.id,
          job_id: jobData.id,
          type: "tatkal_available",
          title: `Urgent Job Available - ${urgencyLevel === "critical" ? "2x" : "1.5x"} Pay!`,
          message: `${title} in ${location}. ${workersNeeded} workers needed. Pay: $${(Number.parseFloat(hourlyRate) * (urgencyLevel === "critical" ? 2.0 : 1.5)).toFixed(2)}/hr`,
        }))

        await supabase.from("notifications").insert(notifications)
      }

      router.push("/dashboard/contractor")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Post Urgent Tatkal Job</CardTitle>
            <CardDescription>
              Post an urgent job and grab workers immediately with premium pay (1.5x - 2x)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePostTatkalJob} className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded p-4">
                <p className="text-sm font-semibold text-orange-900">
                  Tatkal jobs are urgent and expire quickly. Workers receive premium pay!
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Urgent: Delivery Helper Needed"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Job Description</Label>
                <textarea
                  id="description"
                  placeholder="Describe the urgent job details"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Downtown, City Name"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="workersNeeded">Workers Needed</Label>
                  <Input
                    id="workersNeeded"
                    type="number"
                    min="1"
                    required
                    value={workersNeeded}
                    onChange={(e) => setWorkersNeeded(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="hourlyRate">Base Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time (Today)</Label>
                <Input
                  id="startTime"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="urgencyLevel">Urgency Level</Label>
                <select
                  id="urgencyLevel"
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(e.target.value as "high" | "critical")}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  <option value="high">High (1.5x Pay, 2 hours)</option>
                  <option value="critical">Critical (2x Pay, 1 hour)</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm font-semibold text-blue-900">
                  Worker will receive: $
                  {(Number.parseFloat(hourlyRate || "0") * (urgencyLevel === "critical" ? 2.0 : 1.5)).toFixed(2)}/hr
                </p>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                {isLoading ? "Posting..." : "Post Tatkal Job"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
