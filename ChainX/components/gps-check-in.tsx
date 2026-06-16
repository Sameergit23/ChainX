"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

interface GpsCheckInProps {
  applicationId: string
  jobId: string
  jobLocationLat?: number | null
  jobLocationLng?: number | null
  isCheckedIn: boolean
  isCheckedOut: boolean
  onComplete: () => void
}

interface GeoPosition {
  lat: number
  lng: number
  accuracy: number
}

async function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your device"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      (err) => {
        let msg = "Failed to get location"
        if (err.code === 1) msg = "Location permission denied. Please enable it in your browser."
        else if (err.code === 2) msg = "Location unavailable. Move to an open area and try again."
        else if (err.code === 3) msg = "Location request timed out. Try again."
        reject(new Error(msg))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  })
}

// Haversine distance in meters
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function GpsCheckIn({
  applicationId,
  jobId,
  jobLocationLat,
  jobLocationLng,
  isCheckedIn,
  isCheckedOut,
  onComplete,
}: GpsCheckInProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleAction = async (action: "check-in" | "check-out") => {
    setBusy(true)
    setError(null)
    setInfo(null)

    try {
      setInfo("Getting your location...")
      const pos = await getCurrentPosition()

      // Client-side distance hint (server validates again)
      if (jobLocationLat != null && jobLocationLng != null) {
        const d = distanceMeters(pos.lat, pos.lng, jobLocationLat, jobLocationLng)
        if (d > 500) {
          setError(
            `You appear to be ${Math.round(d)}m from the job site. You must be within 200m to ${action}. Move closer and try again.`,
          )
          setBusy(false)
          setInfo(null)
          return
        }
      }

      setInfo(`Submitting ${action}...`)
      const res = await fetch(`/api/worker/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          jobId,
          lat: pos.lat,
          lng: pos.lng,
          accuracy: pos.accuracy,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Failed to ${action}`)

      setInfo(action === "check-in" ? "Checked in successfully!" : "Checked out — payment will be released soon.")
      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${action}`)
      setInfo(null)
    } finally {
      setBusy(false)
    }
  }

  if (isCheckedOut) {
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
        ✓ Checked out. Payment release in progress.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
      {info && !error && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">{info}</div>
      )}

      {!isCheckedIn ? (
        <Button
          onClick={() => handleAction("check-in")}
          disabled={busy}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {busy ? "Working..." : "📍 Check in at job site"}
        </Button>
      ) : (
        <Button
          onClick={() => handleAction("check-out")}
          disabled={busy}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {busy ? "Working..." : "✓ Check out & complete job"}
        </Button>
      )}

      <p className="text-xs text-gray-500 text-center">
        GPS verification ensures fair payment. Your location is only recorded at check-in/out.
      </p>
    </div>
  )
}
