"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Indian PAN regex: 5 letters + 4 digits + 1 letter (uppercase)
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
// IFSC regex: 4 letters + 0 + 6 alphanumeric
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/
// UPI regex: handle@provider
const UPI_REGEX = /^[\w.\-]+@[\w]+$/

type PayoutMethod = "upi" | "bank"

export default function PayoutDetailsPage() {
  const [panNumber, setPanNumber] = useState("")
  const [upiId, setUpiId] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [bankIfsc, setBankIfsc] = useState("")
  const [bankHolderName, setBankHolderName] = useState("")
  const [preferredMethod, setPreferredMethod] = useState<PayoutMethod>("upi")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select(
            "pan_number, upi_id, bank_account_number, bank_ifsc, bank_account_holder_name, preferred_payout_method",
          )
          .eq("id", user.id)
          .single()

        if (profile) {
          setPanNumber(profile.pan_number ?? "")
          setUpiId(profile.upi_id ?? "")
          setBankAccount(profile.bank_account_number ?? "")
          setBankIfsc(profile.bank_ifsc ?? "")
          setBankHolderName(profile.bank_account_holder_name ?? "")
          setPreferredMethod((profile.preferred_payout_method as PayoutMethod) ?? "upi")
        }
      } catch (e) {
        console.error("Load error:", e)
        setError("Failed to load existing details")
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validate = (): string | null => {
    if (!panNumber) return "PAN is required for TDS compliance"
    if (!PAN_REGEX.test(panNumber.toUpperCase())) {
      return "Invalid PAN format. Should be like ABCDE1234F"
    }

    if (preferredMethod === "upi") {
      if (!upiId) return "UPI ID is required when UPI is selected as payout method"
      if (!UPI_REGEX.test(upiId)) return "Invalid UPI ID. Should be like name@bankname"
    }

    if (preferredMethod === "bank") {
      if (!bankAccount || bankAccount.length < 9 || bankAccount.length > 18) {
        return "Bank account number must be 9-18 digits"
      }
      if (!IFSC_REGEX.test(bankIfsc.toUpperCase())) {
        return "Invalid IFSC code. Should be like HDFC0001234"
      }
      if (!bankHolderName || bankHolderName.trim().length < 3) {
        return "Bank account holder name is required"
      }
    }

    return null
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          pan_number: panNumber.toUpperCase(),
          upi_id: preferredMethod === "upi" ? upiId : null,
          bank_account_number: preferredMethod === "bank" ? bankAccount : null,
          bank_ifsc: preferredMethod === "bank" ? bankIfsc.toUpperCase() : null,
          bank_account_holder_name: preferredMethod === "bank" ? bankHolderName.trim() : null,
          preferred_payout_method: preferredMethod,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      setSuccess("Payout details saved. You're ready to receive payments.")
      setTimeout(() => router.push("/worker/dashboard"), 1500)
    } catch (e) {
      console.error("Save error:", e)
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payout Details</CardTitle>
            <CardDescription>
              Set up where you want to receive your earnings. Required before you can be paid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* PAN — mandatory */}
              <div className="grid gap-2">
                <Label htmlFor="pan">
                  PAN Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pan"
                  placeholder="ABCDE1234F"
                  required
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                />
                <p className="text-xs text-gray-500">
                  Required by Income Tax Act for TDS deduction (Section 194C). Form 16A will be issued against this PAN
                  quarterly.
                </p>
              </div>

              {/* Payout method toggle */}
              <div className="grid gap-2">
                <Label>Preferred Payout Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPreferredMethod("upi")}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      preferredMethod === "upi"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold">UPI</div>
                    <div className="text-xs text-gray-600 mt-1">Instant • No fees • Recommended</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredMethod("bank")}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      preferredMethod === "bank"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold">Bank Account</div>
                    <div className="text-xs text-gray-600 mt-1">IMPS / NEFT • Few minutes</div>
                  </button>
                </div>
              </div>

              {/* UPI fields */}
              {preferredMethod === "upi" && (
                <div className="grid gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Label htmlFor="upi">
                    UPI ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="upi"
                    placeholder="yourname@paytm or 9876543210@ybl"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-600">
                    Works with GPay, PhonePe, Paytm, BHIM, and any UPI app.
                  </p>
                </div>
              )}

              {/* Bank fields */}
              {preferredMethod === "bank" && (
                <div className="grid gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="grid gap-2">
                    <Label htmlFor="holder">
                      Account Holder Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="holder"
                      placeholder="As per bank records"
                      required
                      value={bankHolderName}
                      onChange={(e) => setBankHolderName(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="account">
                      Account Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="account"
                      placeholder="9-18 digits"
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
                      className="bg-white font-mono"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ifsc">
                      IFSC Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ifsc"
                      placeholder="e.g., HDFC0001234"
                      required
                      maxLength={11}
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      className="bg-white font-mono uppercase"
                    />
                    <p className="text-xs text-gray-600">
                      Find this on your cheque book or bank passbook.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save payout details"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">How payments work on ChainX</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex gap-2">
                <span>1.</span>
                <span>Contractor funds the full job amount into escrow before posting.</span>
              </li>
              <li className="flex gap-2">
                <span>2.</span>
                <span>You check in via GPS when you arrive at the job site.</span>
              </li>
              <li className="flex gap-2">
                <span>3.</span>
                <span>Once you check out and the job is approved, money is released within minutes.</span>
              </li>
              <li className="flex gap-2">
                <span>4.</span>
                <span>1% TDS is deducted (Section 194C) and deposited with the government. Form 16A issued quarterly.</span>
              </li>
              <li className="flex gap-2">
                <span>5.</span>
                <span>You can view all earnings and tax certificates in the Earnings tab.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
