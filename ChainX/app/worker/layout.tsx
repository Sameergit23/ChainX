"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/notification-bell"

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userName, setUserName] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [payoutReady, setPayoutReady] = useState(true)
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
          .select("user_type, full_name, pan_number, upi_id, bank_account_number")
          .eq("id", user.id)
          .single()

        if (profile?.user_type !== "worker") {
          router.push("/contractor/dashboard")
          return
        }

        setIsLoggedIn(true)
        setUserName(profile?.full_name || "")

        // Worker needs PAN + (UPI or bank) to be paid
        const hasPan = !!profile?.pan_number
        const hasPayoutMethod = !!profile?.upi_id || !!profile?.bank_account_number
        setPayoutReady(hasPan && hasPayoutMethod)
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
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/worker/dashboard" className="flex items-center gap-2">
            <div className="text-2xl font-bold">ChainX Worker</div>
          </Link>

          {isLoggedIn && (
            <nav className="hidden md:flex gap-6 items-center text-sm">
              <Link href="/worker/dashboard" className="hover:text-green-100 transition">
                Dashboard
              </Link>
              <Link href="/worker/jobs" className="hover:text-green-100 transition">
                Jobs
              </Link>
              <Link href="/worker/tatkal-jobs" className="hover:text-green-100 transition font-semibold">
                Tatkal
              </Link>
              <Link href="/worker/my-applications" className="hover:text-green-100 transition">
                My Applications
              </Link>
              <Link href="/worker/earnings" className="hover:text-green-100 transition">
                Earnings
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-4">
            {isLoggedIn && <NotificationBell />}

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <span className="text-sm hidden sm:inline">{userName}</span>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="bg-white text-green-600 hover:bg-gray-100"
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
                      className="border-white text-white hover:bg-green-700 bg-transparent"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button size="sm" className="bg-white text-green-600 hover:bg-gray-100">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Payout setup banner — shows if PAN / UPI / bank are missing */}
      {isLoggedIn && !payoutReady && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <span className="text-yellow-900">
              ⚠ Add your PAN and UPI/bank details to receive payments.
            </span>
            <Link href="/worker/payout-details">
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                Set up payouts
              </Button>
            </Link>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
