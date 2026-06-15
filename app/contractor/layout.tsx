"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/notification-bell"

export default function ContractorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userName, setUserName] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsLoggedIn(false)
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type, full_name")
          .eq("id", user.id)
          .single()

        if (profile?.user_type !== "contractor") {
          router.push("/worker/jobs")
          return
        }

        setIsLoggedIn(true)
        setUserName(profile?.full_name || "")
      } catch (error) {
        console.error("Error checking auth:", error)
      }
    }

    checkAuth()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Contractor App Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/contractor/dashboard" className="flex items-center gap-2">
            <div className="text-2xl font-bold">ChainX Contractor</div>
          </Link>

          {isLoggedIn && (
            <nav className="hidden md:flex gap-8 items-center">
              <Link href="/contractor/dashboard" className="hover:text-blue-100 transition">
                Dashboard
              </Link>
              <Link href="/contractor/post-job" className="hover:text-blue-100 transition">
                Post Job
              </Link>
              <Link href="/contractor/tatkal" className="hover:text-blue-100 transition font-semibold">
                Post Tatkal
              </Link>
              <Link href="/contractor/applications" className="hover:text-blue-100 transition">
                Applications
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-4">
            {isLoggedIn && <NotificationBell />}

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <span className="text-sm">{userName}</span>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white text-white hover:bg-blue-700 bg-transparent"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button size="sm" className="bg-white text-blue-600 hover:bg-gray-100">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
