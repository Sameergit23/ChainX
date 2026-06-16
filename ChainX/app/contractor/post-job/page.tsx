"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"

// Razorpay checkout script (loaded on demand)
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false)
    if (window.Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const PLATFORM_FEE_PERCENT = 4
const GST_PERCENT = 18
const TDS_PERCENT = 1

const formatINR = (rupees: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees)

export default function PostJobPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [workersNeeded, setWorkersNeeded] = useState("1")
  const [hourlyRate, setHourlyRate] = useState("")
  const [estimatedHours, setEstimatedHours] = useState("8")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isTatkal, setIsTatkal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // ============================================
  // Live cost breakdown
  // ============================================
  const breakdown = useMemo(() => {
    const rate = Number.parseFloat(hourlyRate) || 0
    const hours = Number.parseFloat(estimatedHours) || 0
    const workers = Number.parseInt(workersNeeded) || 0
    const tatkalMultiplier = isTatkal ? 1.5 : 1.0

    const wageBudget = rate * hours * workers * tatkalMultiplier
    const platformFee = (wageBudget * PLATFORM_FEE_PERCENT) / 100
    const gstOnFee = (platformFee * GST_PERCENT) / 100
    const total = wageBudget + platformFee + gstOnFee
    const tds = (wageBudget * TDS_PERCENT) / 100
    const workersReceive = wageBudget - tds

    return { wageBudget, platformFee, gstOnFee, total, tds, workersReceive }
  }, [hourlyRate, estimatedHours, workersNeeded, isTatkal])

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

      if (breakdown.wageBudget <= 0) {
        throw new Error("Please enter hourly rate, hours, and worker count")
      }

      // 1. Create the job (status: 'open' but payment not yet funded)
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .insert({
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
        .select()
        .single()

      if (jobError) throw jobError
      if (!jobData) throw new Error("Failed to create job")

      // 2. If Tatkal, create tatkal_jobs entry
      if (isTatkal) {
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 2)

        await supabase.from("tatkal_jobs").insert({
          job_id: jobData.id,
          contractor_id: user.id,
          expires_at: expiresAt.toISOString(),
        })
      }

      // 3. Create Razorpay escrow order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobData.id,
          contractorId: user.id,
          wageBudgetRupees: breakdown.wageBudget,
        }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error ?? "Failed to create payment order")

      // 4. Open Razorpay checkout
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error("Failed to load Razorpay checkout")

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency,
        name: "ChainX",
        description: `Escrow for: ${title}`,
        order_id: orderData.orderId,
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          // 5. Verify on backend
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          })

          const verifyData = await verifyRes.json()
          if (verifyRes.ok) {
            router.push("/contractor/dashboard?funded=true")
          } else {
            setError(verifyData.error ?? "Payment verification failed")
          }
        },
        prefill: {
          email: user.email ?? "",
        },
        theme: { color: "#ea580c" },
        modal: {
          ondismiss: () => {
            setError("Payment cancelled. Job created but not funded — fund it from your dashboard to make it live.")
            setIsLoading(false)
          },
        },
      })

      rzp.open()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Post a New Job</CardTitle>
            <CardDescription>
              Create a job posting and fund the escrow. Workers see only funded jobs.
            </CardDescription>
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
                  placeholder="e.g., Vijay Nagar, Indore"
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
                  <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g., 150"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="estimatedHours">Estimated Hours / worker</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                  />
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
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
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
                  Mark as Tatkal (Urgent) — Workers get 1.5x pay
                </Label>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isLoading || breakdown.total <= 0}
              >
                {isLoading
                  ? "Opening payment..."
                  : breakdown.total > 0
                  ? `Fund escrow & post job — ${formatINR(breakdown.total)}`
                  : "Enter rate and hours to continue"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live cost breakdown */}
        {breakdown.wageBudget > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Payment Breakdown</CardTitle>
              <CardDescription>
                Transparent — no hidden fees. You see exactly where every rupee goes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Worker wages ({workersNeeded} × {estimatedHours} hrs × ₹{hourlyRate || 0}{isTatkal ? " × 1.5 Tatkal" : ""})</span>
                <span className="font-medium">{formatINR(breakdown.wageBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ChainX platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                <span>{formatINR(breakdown.platformFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST on fee ({GST_PERCENT}%)</span>
                <span>{formatINR(breakdown.gstOnFee)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-base">
                <span>You pay (held in escrow)</span>
                <span className="text-orange-700">{formatINR(breakdown.total)}</span>
              </div>
              <div className="pt-3 mt-3 border-t space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Workers receive (after 1% TDS, Section 194C)</span>
                  <span>{formatINR(breakdown.workersReceive)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TDS deposited to Govt (Form 16A issued)</span>
                  <span>{formatINR(breakdown.tds)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
