"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

        if (profile?.user_type === "worker") {
          router.push("/worker/dashboard")
        } else if (profile?.user_type === "contractor") {
          router.push("/contractor/dashboard")
        }
      } catch (error) {
        console.error("Error checking user type:", error)
        router.push("/auth/login")
      }
    }

    checkUserType()
  }, [router, supabase])

  return <div className="p-6 text-center">Loading...</div>
}
