"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"

interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string
  location: string
  bio: string
  user_type: string
  rating: number
  total_jobs: number
  penalty_points: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    bio: "",
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          redirect("/auth/login")
          return
        }

        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profileData) {
          setProfile({
            ...profileData,
            email: user.email || "",
          })
          setFormData({
            full_name: profileData.full_name || "",
            phone: profileData.phone || "",
            location: profileData.location || "",
            bio: profileData.bio || "",
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase])

  const handleSaveProfile = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
        })
        .eq("id", profile.id)

      if (error) throw error

      setProfile({
        ...profile,
        ...formData,
      })
      setIsEditing(false)
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading profile...</div>
  }

  if (!profile) {
    return <div className="p-6 text-center">Unable to load profile</div>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Profile</h1>

        {/* Profile Header Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{profile.full_name || "User"}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="font-semibold capitalize">{profile.user_type}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold">⭐ {profile.rating}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{profile.total_jobs}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Penalty Points</p>
                <p
                  className={`text-2xl font-bold ${profile.penalty_points > 0 ? "text-orange-600" : "text-green-600"}`}
                >
                  {profile.penalty_points}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-lg font-semibold">2025</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Profile Information</CardTitle>
              <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "destructive" : "outline"}>
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSaveProfile()
                }}
                className="space-y-6"
              >
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Your phone number"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{profile.full_name || "Not set"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-semibold">{profile.phone || "Not set"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{profile.location || "Not set"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="font-semibold">{profile.bio || "Not set"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Penalty Information */}
        {profile.penalty_points > 0 && (
          <Card className="mt-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900">Penalty Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-800">
                You have {profile.penalty_points} penalty point(s). Penalties are issued for:
              </p>
              <ul className="list-disc list-inside text-sm text-orange-800 mt-2 space-y-1">
                <li>No-show on job date (2 points)</li>
                <li>Denying an accepted job at last moment (3 points)</li>
              </ul>
              <p className="text-xs text-orange-700 mt-4">
                High penalty points may affect your ability to get jobs. Always show up on time!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
