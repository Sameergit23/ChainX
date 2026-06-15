"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function PostJobPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [workersNeeded, setWorkersNeeded] = useState("1")
  const [hourlyRate, setHourlyRate] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isTatkal, setIsTatkal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: jobError } = await supabase.from("jobs").insert({
        contractor_id: user.id,
        title,
        description,
        location,
        workers_needed: Number.parseInt(workersNeeded),
        hourly_rate: Number.parseFloat(hourlyRate),
        start_date: startDate,
        start_time: startTime,
        end_time: endTime,
        is_tatkal: isTatkal,
      })

      if (jobError) throw jobError

      // If Tatkal, create tatkal job entry
      if (isTatkal) {
        const { data: jobData } = await supabase
          .from("jobs")
          .select("id")
          .eq("contractor_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (jobData) {
          const expiresAt = new Date()
          expiresAt.setHours(expiresAt.getHours() + 2) // Tatkal expires in 2 hours

          await supabase.from("tatkal_jobs").insert({
            job_id: jobData.id,
            contractor_id: user.id,
            expires_at: expiresAt.toISOString(),
          })
        }
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
            <CardTitle>Post a New Job</CardTitle>
            <CardDescription>Create a job posting to find workers</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePostJob} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Construction Worker Needed"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Job Description</Label>
                <textarea
                  id="description"
                  placeholder="Describe the job details, responsibilities, and requirements"
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
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
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
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isTatkal"
                  type="checkbox"
                  checked={isTatkal}
                  onChange={(e) => setIsTatkal(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isTatkal" className="cursor-pointer">
                  Mark as Tatkal (Urgent) - Workers get 1.5x pay
                </Label>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Posting..." : "Post Job"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
