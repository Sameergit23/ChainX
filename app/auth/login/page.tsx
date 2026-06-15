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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Demo login system - allow specific demo credentials
      const demoCredentials = {
        'contractor@demo.com': { password: 'demo123', userType: 'contractor', name: 'Demo Contractor' },
        'worker@demo.com': { password: 'demo123', userType: 'worker', name: 'Demo Worker' },
        'admin@demo.com': { password: 'demo123', userType: 'contractor', name: 'Admin User' }
      }

      const userCreds = demoCredentials[email as keyof typeof demoCredentials]
      
      if (userCreds && userCreds.password === password) {
        // Simulate successful login by storing demo user data
        const demoUser = {
          id: `demo-${userCreds.userType}-${Date.now()}`,
          email: email,
          user_metadata: {
            full_name: userCreds.name,
            user_type: userCreds.userType
          }
        }

        // Store demo user in localStorage for demo purposes
        localStorage.setItem('demo-user', JSON.stringify(demoUser))
        localStorage.setItem('demo-auth', 'true')

        // Redirect based on user type
        if (userCreds.userType === 'contractor') {
          router.push("/contractor/dashboard")
        } else {
          router.push("/worker/dashboard")
        }
      } else {
        // Try real Supabase login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        // Check if we have real Supabase data
        if (data.user) {
          // Check verification status and password status
          const { data: profile } = await supabase
            .from("profiles")
            .select("verification_status, has_temp_password, user_type")
            .eq("id", data.user.id)
            .single()

          if (profile) {
            // Check if user is verified
            if (profile.verification_status !== "approved") {
              throw new Error(
                profile.verification_status === "pending"
                  ? "Your account is pending verification. You will receive credentials once approved."
                  : profile.verification_status === "rejected"
                    ? "Your account verification was rejected. Please contact support."
                    : "Your account is under review."
              )
            }

            // Check if user needs to change password
            if (profile.has_temp_password) {
              router.push("/auth/change-password")
              return
            }

            // Redirect based on user type
            if (profile.user_type === "contractor") {
              router.push("/contractor/dashboard")
            } else {
              router.push("/worker/dashboard")
            }
          } else {
            // No profile found, redirect to general dashboard
            router.push("/dashboard")
          }
        } else {
          throw new Error("Authentication failed")
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Invalid credentials. Try demo@demo.com with password 'demo123'")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login to ChainX</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contractor@demo.com"
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
                    placeholder="demo123"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm space-y-2">
                <div>
                  Don't have an account?{" "}
                  <Link href="/auth/register" className="underline underline-offset-4">
                    Register Now
                  </Link>
                </div>
                <div className="text-xs text-gray-500">
                  <Link href="/auth/sign-up" className="underline">
                    Old Sign Up (OTP)
                  </Link>
                </div>
              </div>
            </form>
            
            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm">Demo Credentials:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Contractor:</strong> contractor@demo.com / demo123</p>
                <p><strong>Worker:</strong> worker@demo.com / demo123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}