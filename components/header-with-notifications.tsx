"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { NotificationBell } from "./notification-bell"

export function HeaderWithNotifications() {
  const [userType, setUserType] = useState<"worker" | "contractor" | null>(null)
  const [userName, setUserName] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type, full_name")
          .eq("id", user.id)
          .single()

        if (profile) {
          setUserType(profile.user_type)
          setUserName(profile.full_name)
        }
      } catch (error) {
        console.error("Error fetching user info:", error)
      }
    }

    fetchUserInfo()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-orange-600">
          ChainX
        </Link>

        <nav className="hidden md:flex gap-6 items-center">
          {!userType && (
            <>
              <a href="#features" className="text-gray-600 hover:text-gray-900">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">
                How It Works
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </a>
            </>
          )}

          {userType === "worker" && (
            <>
              <Link href="/worker/jobs" className="text-gray-600 hover:text-gray-900">
                Available Jobs
              </Link>
              <Link
                href="/worker/tatkal-jobs"
                className="text-gray-600 hover:text-gray-900 font-semibold text-orange-600"
              >
                Tatkal
              </Link>
              <Link href="/worker/my-applications" className="text-gray-600 hover:text-gray-900">
                My Applications
              </Link>
            </>
          )}

          {userType === "contractor" && (
            <>
              <Link href="/contractor/post-job" className="text-gray-600 hover:text-gray-900">
                Post Job
              </Link>
              <Link
                href="/contractor/tatkal"
                className="text-gray-600 hover:text-gray-900 font-semibold text-orange-600"
              >
                Post Tatkal
              </Link>
              <Link href="/contractor/applications" className="text-gray-600 hover:text-gray-900">
                Applications
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {userType ? (
            <>
              <NotificationBell />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{userName}</span>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
