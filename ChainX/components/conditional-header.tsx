"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { NotificationBell } from "./notification-bell"

export function ConditionalHeader() {
  const [userType, setUserType] = useState<"worker" | "contractor" | null>(null)
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        
        if (!user) {
          setUserType(null)
          setIsLoading(false)
          return
        }

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
        setUserType(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserInfo()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUserInfo()
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserType(null)
    setUserName("")
    router.push("/")
  }

  // Check if we're in worker or contractor routes
  const isWorkerRoute = pathname?.startsWith("/worker")
  const isContractorRoute = pathname?.startsWith("/contractor")
  
  // Don't show header in worker/contractor routes (they have their own layouts)
  // OR if user is logged in, don't show the main header
  if (isLoading) {
    return null // Don't show anything while loading
  }

  if ((isWorkerRoute || isContractorRoute) || userType) {
    // User is logged in or in role-specific routes - don't show main header
    // Worker and Contractor layouts have their own headers
    return null
  }

  // Show main header only for non-logged-in users on main pages
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-orange-600">
          ChainX
        </Link>

        <nav className="hidden md:flex gap-6 items-center">
          <a href="#features" className="text-gray-600 hover:text-gray-900">
            Features
          </a>
          <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">
            How It Works
          </a>
          <a href="#pricing" className="text-gray-600 hover:text-gray-900">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

