"use client"

import { useEffect, useState } from "react"
import { RealtimeService } from "@/lib/realtime-service"
import { CrossAppSyncService } from "@/lib/cross-app-sync"

interface RealtimeNotification {
  id: string
  type: 'job_posted' | 'application_received' | 'application_accepted' | 'tatkal_job'
  message: string
  timestamp: Date
  app: 'contractor' | 'worker'
}

export function RealtimeDemo() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const realtimeService = new RealtimeService()
  const crossAppSync = new CrossAppSyncService()

  useEffect(() => {
    // Simulate real-time notifications for demo
    const demoNotifications: RealtimeNotification[] = [
      {
        id: '1',
        type: 'job_posted',
        message: 'New job posted: "Construction Helper Needed" - $25/hour',
        timestamp: new Date(Date.now() - 30000),
        app: 'worker'
      },
      {
        id: '2',
        type: 'application_received',
        message: 'John Smith applied for "Construction Helper" job',
        timestamp: new Date(Date.now() - 15000),
        app: 'contractor'
      },
      {
        id: '3',
        type: 'tatkal_job',
        message: 'URGENT: "Plumbing Emergency" - 2x Pay ($50/hour)',
        timestamp: new Date(Date.now() - 5000),
        app: 'worker'
      }
    ]

    setNotifications(demoNotifications)
    setIsConnected(true)

    // Simulate new notifications every 10 seconds
    const interval = setInterval(() => {
      const newNotification: RealtimeNotification = {
        id: Date.now().toString(),
        type: Math.random() > 0.5 ? 'job_posted' : 'application_received',
        message: Math.random() > 0.5 
          ? 'New job posted: "Delivery Driver" - $20/hour'
          : 'Sarah Johnson applied for "Delivery Driver" job',
        timestamp: new Date(),
        app: Math.random() > 0.5 ? 'worker' : 'contractor'
      }
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)])
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_posted':
        return '📢'
      case 'application_received':
        return '📝'
      case 'application_accepted':
        return '✅'
      case 'tatkal_job':
        return '🚨'
      default:
        return '🔔'
    }
  }

  const getAppColor = (app: string) => {
    return app === 'contractor' ? 'bg-orange-100 border-orange-300' : 'bg-blue-100 border-blue-300'
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Real-time Cross-App Communication</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border-l-4 ${getAppColor(notification.app)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1">
                  <p className="font-medium">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      notification.app === 'contractor' 
                        ? 'bg-orange-200 text-orange-800' 
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      {notification.app === 'contractor' ? 'Contractor App' : 'Worker App'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {notification.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">How it works:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Contractors post jobs → Workers see them instantly</li>
            <li>• Workers apply → Contractors get notified immediately</li>
            <li>• Contractors accept applications → Workers get confirmation</li>
            <li>• Tatkal jobs appear with countdown timers</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
