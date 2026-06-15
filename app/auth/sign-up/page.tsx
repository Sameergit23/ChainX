"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [userType, setUserType] = useState<"worker" | "contractor">("worker")
  const [otp, setOtp] = useState("")
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          },
        },
      })
      if (error) throw error
      
      // Show OTP input instead of redirecting
      setShowOtpInput(true)
      setError(null)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsVerifying(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      })
      
      if (error) throw error

      if (data?.user) {
        // Redirect based on user type
        if (userType === 'contractor') {
          router.push("/contractor/dashboard")
        } else {
          router.push("/worker/dashboard")
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Invalid OTP. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          },
        },
      })
      
      if (error) throw error
      setError(null)
      alert("OTP has been resent to your email!")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to resend OTP")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign up to ChainX</CardTitle>
            <CardDescription>Create a new account</CardDescription>
          </CardHeader>
          <CardContent>
            {!showOtpInput ? (
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userType">I am a</Label>
                    <select
                      id="userType"
                      value={userType}
                      onChange={(e) => setUserType(e.target.value as "worker" | "contractor")}
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                      <option value="worker">Worker</option>
                      <option value="contractor">Contractor</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Repeat Password</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign up"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4">
                    Login
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="flex flex-col gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      We've sent a verification code to
                    </p>
                    <p className="font-semibold">{email}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="otp">Enter Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the 6-digit code sent to your email
                    </p>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isVerifying}>
                    {isVerifying ? "Verifying..." : "Verify OTP"}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Resend OTP"}
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpInput(false)
                        setOtp("")
                        setError(null)
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      Change email
                    </button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
