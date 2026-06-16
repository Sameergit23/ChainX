"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface Payout {
  id: string
  job_id: string
  gross_amount_paise: number
  tds_amount_paise: number
  net_amount_paise: number
  payout_method: string
  status: string
  utr_number: string | null
  initiated_at: string
  completed_at: string | null
}

interface TdsEntry {
  id: string
  financial_year: string
  quarter: string
  gross_amount_paise: number
  tds_amount_paise: number
  deducted_at: string
  form_16a_url: string | null
}

const formatINR = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  reversed: "bg-gray-100 text-gray-800",
}

export default function EarningsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [tdsLedger, setTdsLedger] = useState<TdsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setError("Please log in to view earnings")
          setLoading(false)
          return
        }

        // Payouts
        const { data: payoutsData, error: payoutsErr } = await supabase
          .from("worker_payouts")
          .select(
            "id, job_id, gross_amount_paise, tds_amount_paise, net_amount_paise, payout_method, status, utr_number, initiated_at, completed_at",
          )
          .eq("worker_id", user.id)
          .order("initiated_at", { ascending: false })

        if (payoutsErr) {
          console.error("Payouts error:", payoutsErr)
          setError("Failed to load payouts")
        } else {
          setPayouts(payoutsData ?? [])
        }

        // TDS ledger
        const { data: tdsData, error: tdsErr } = await supabase
          .from("tds_ledger")
          .select("id, financial_year, quarter, gross_amount_paise, tds_amount_paise, deducted_at, form_16a_url")
          .eq("worker_id", user.id)
          .order("deducted_at", { ascending: false })

        if (tdsErr) {
          console.error("TDS error:", tdsErr)
        } else {
          setTdsLedger(tdsData ?? [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Aggregate stats
  const totals = payouts.reduce(
    (acc, p) => {
      if (p.status === "success") {
        acc.lifetimeEarned += p.gross_amount_paise
        acc.lifetimeReceived += p.net_amount_paise
        acc.lifetimeTds += p.tds_amount_paise
      } else if (p.status === "pending" || p.status === "processing") {
        acc.pending += p.net_amount_paise
      }
      return acc
    },
    { lifetimeEarned: 0, lifetimeReceived: 0, lifetimeTds: 0, pending: 0 },
  )

  // Group TDS by financial year
  const tdsByFY = tdsLedger.reduce(
    (acc, t) => {
      if (!acc[t.financial_year]) acc[t.financial_year] = { gross: 0, tds: 0, quarters: new Set<string>() }
      acc[t.financial_year].gross += t.gross_amount_paise
      acc[t.financial_year].tds += t.tds_amount_paise
      acc[t.financial_year].quarters.add(t.quarter)
      return acc
    },
    {} as Record<string, { gross: number; tds: number; quarters: Set<string> }>,
  )

  if (loading) return <div className="p-6 text-center">Loading earnings...</div>

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Earnings</h1>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Lifetime Earned (Gross)</p>
              <p className="text-2xl font-bold mt-1">{formatINR(totals.lifetimeEarned)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <p className="text-xs text-green-700 uppercase tracking-wide">Received in Bank</p>
              <p className="text-2xl font-bold text-green-800 mt-1">{formatINR(totals.lifetimeReceived)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide">TDS Deducted</p>
              <p className="text-2xl font-bold mt-1">{formatINR(totals.lifetimeTds)}</p>
              <p className="text-[10px] text-gray-500 mt-1">Claim refund in ITR</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <p className="text-xs text-yellow-800 uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{formatINR(totals.pending)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Payouts list */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Every payment released to you, with TDS breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No payments yet. Complete a job to start earning.
              </p>
            ) : (
              <div className="space-y-3">
                {payouts.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{formatINR(p.net_amount_paise)} received</p>
                        <p className="text-xs text-gray-500">{formatDate(p.initiated_at)}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          statusColors[p.status] ?? "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mt-3 pt-3 border-t">
                      <div>
                        <p className="text-gray-500">Gross wage</p>
                        <p className="font-medium">{formatINR(p.gross_amount_paise)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">TDS (1%)</p>
                        <p className="font-medium text-red-700">− {formatINR(p.tds_amount_paise)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Method</p>
                        <p className="font-medium uppercase">{p.payout_method}</p>
                      </div>
                    </div>
                    {p.utr_number && (
                      <p className="text-xs text-gray-500 mt-2">UTR: <span className="font-mono">{p.utr_number}</span></p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* TDS / Form 16A section */}
        {Object.keys(tdsByFY).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>TDS Summary</CardTitle>
              <CardDescription>
                For Income Tax Return filing. Download Form 16A once issued quarterly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(tdsByFY).map(([fy, data]) => (
                  <div
                    key={fy}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">FY {fy}</p>
                      <p className="text-xs text-gray-500">
                        Quarters: {Array.from(data.quarters).sort().join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        Gross: <span className="font-medium">{formatINR(data.gross)}</span>
                      </p>
                      <p className="text-sm">
                        TDS: <span className="font-medium text-red-700">{formatINR(data.tds)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Form 16A certificates are generated quarterly after government challan deposit. You can claim TDS as a
                refund when filing your Income Tax Return (ITR).
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
