"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<{ email: string; userType: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user needs to change password
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, user_type, has_temp_password")
        .eq("id", user.id)
        .single()

      if (profile) {
        if (!profile.has_temp_password) {
          // User already changed password, redirect to dashboard
          if (profile.user_type === "contractor") {
            router.push("/contractor/dashboard")
          } else {
            router.push("/worker/dashboard")
          }
          return
        }
        setUserInfo({ email: profile.email, userType: profile.user_type })
      }
    }

    checkUser()
  }, [router, supabase])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Check for password strength
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
      return
    }

    setIsLoading(true)

    try {
      // First verify current password by attempting to sign in
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not found")

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userInfo?.email || "",
        password: currentPassword,
      })

      if (signInError) {
        setError("Current password is incorrect")
        setIsLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      // Update profile to mark password as changed
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          has_temp_password: false,
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Redirect to appropriate dashboard
      if (userInfo?.userType === "contractor") {
        router.push("/contractor/dashboard")
      } else {
        router.push("/worker/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  if (!userInfo) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Change Your Password</CardTitle>
          <CardDescription>
            You are using a temporary password. Please set a permanent password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>User ID:</strong> {userInfo.userType === "contractor" ? "10 digits" : "8 digits"}
                <br />
                <strong>Email:</strong> {userInfo.email}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current (Temporary) Password *</Label>
              <Input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your temporary password"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Changing Password..." : "Change Password & Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

