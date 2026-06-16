"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [userType, setUserType] = useState<"worker" | "contractor" | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Get user type
        const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

        setUserType(profile?.user_type || null)

        // Fetch notifications
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) throw error

        setNotifications(data || [])
        setUnreadCount((data || []).filter((n) => !n.is_read).length)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    fetchUserAndNotifications()

    // Subscribe to real-time notifications
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const newNotif = payload.new as Notification
        setNotifications((prev) => [newNotif, ...prev.slice(0, 4)])
        setUnreadCount((prev) => prev + 1)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase])

  const getNotificationLink = () => {
    if (userType === "worker") {
      return "/worker/notifications"
    } else if (userType === "contractor") {
      return "/contractor/applications"
    }
    return "/dashboard"
  }

  return (
    <div className="relative">
      <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-2 text-gray-600 hover:text-gray-900">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-lg">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notif.is_read ? "bg-blue-50" : ""}`}
                >
                  <p className="font-semibold text-sm">{notif.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t">
            <Link href={getNotificationLink()} className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
