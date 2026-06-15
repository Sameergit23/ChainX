"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface VerificationUser {
  id: string
  user_id: string | null
  email: string
  full_name: string
  phone: string
  user_type: string
  verification_status: string
  aadhar_number: string
  aadhar_front_url: string
  aadhar_back_url: string
  photo_url: string
  address: string
  city: string
  state: string
  pincode: string
  emergency_contact_name: string
  emergency_contact_number: string
  date_of_birth: string
  gender: string
  submitted_at: string
  verification_notes: string | null
}

export default function VerificationPage() {
  const [users, setUsers] = useState<VerificationUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [selectedUser, setSelectedUser] = useState<VerificationUser | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      let query = supabase.from("profiles").select("*")

      if (filter !== "all") {
        query = query.eq("verification_status", filter)
      }

      const { data, error } = await query
        .order("submitted_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateUserId = async (userType: string): Promise<string> => {
    const { data, error } = await supabase.rpc("generate_user_id", {
      user_type_param: userType,
    })

    if (error) throw error
    return data
  }


  const handleApprove = async (user: VerificationUser) => {
    if (!confirm("Are you sure you want to approve this user?")) return

    setIsReviewing(true)
    try {
      // Generate user ID
      const userId = await generateUserId(user.user_type)

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + "!@#"

      // Update user password via API route (requires admin service role)
      const response = await fetch("/api/admin/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          password: tempPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update password")
      }

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          verification_status: "approved",
          user_id: userId,
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verification_notes: reviewNotes || "Approved by verification team",
          credentials_sent_at: new Date().toISOString(),
          credentials_sent_via: "email", // Can be changed based on user preference
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Log credential sending
      await supabase.from("credential_logs").insert({
        user_id: user.id,
        user_type: user.user_type,
        user_id_generated: userId,
        sent_via: "email",
        recipient_email: user.email,
        recipient_phone: user.phone,
        status: "sent",
      })

      // Send credentials via API
      const credentialsResponse = await fetch("/api/send-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          phone: user.phone,
          userType: user.user_type,
          generatedUserId: userId,
          tempPassword: tempPassword,
        }),
      })

      if (!credentialsResponse.ok) {
        console.error("Failed to send credentials, but user is approved")
      }

      // Update verification queue
      await supabase
        .from("verification_queue")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          review_notes: reviewNotes || "Approved",
        })
        .eq("user_id", user.id)

      alert(`User approved! User ID: ${userId}\nTemporary Password sent to ${user.email}`)
      setSelectedUser(null)
      setReviewNotes("")
      fetchUsers()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsReviewing(false)
    }
  }

  const handleReject = async (user: VerificationUser) => {
    if (!confirm("Are you sure you want to reject this user?")) return

    setIsReviewing(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: "rejected",
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verification_notes: reviewNotes || "Rejected by verification team",
        })
        .eq("id", user.id)

      if (error) throw error

      await supabase
        .from("verification_queue")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          review_notes: reviewNotes || "Rejected",
        })
        .eq("user_id", user.id)

      alert("User rejected")
      setSelectedUser(null)
      setReviewNotes("")
      fetchUsers()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsReviewing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      under_review: "bg-blue-100 text-blue-800",
    }
    return <Badge className={colors[status as keyof typeof colors] || "bg-gray-100"}>{status}</Badge>
  }

  if (loading) {
    return <div className="p-6 text-center">Loading verifications...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">User Verification Panel</h1>
          <p className="text-gray-600">Review and verify user registrations</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            All
          </Button>
          <Button variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>
            Pending
          </Button>
          <Button variant={filter === "approved" ? "default" : "outline"} onClick={() => setFilter("approved")}>
            Approved
          </Button>
          <Button variant={filter === "rejected" ? "default" : "outline"} onClick={() => setFilter("rejected")}>
            Rejected
          </Button>
        </div>

        {/* User List */}
        <div className="grid gap-4">
          {users.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No users found for this filter
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{user.full_name}</CardTitle>
                      <CardDescription>
                        {user.email} • {user.phone} • {user.user_type}
                      </CardDescription>
                    </div>
                    {getStatusBadge(user.verification_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Aadhar</p>
                      <p className="font-semibold">{user.aadhar_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-semibold">
                        {user.city}, {user.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Submitted</p>
                      <p className="font-semibold">
                        {new Date(user.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">User ID</p>
                      <p className="font-semibold">{user.user_id || "Not generated"}</p>
                    </div>
                  </div>

                  {user.verification_status === "pending" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedUser(user)}>Review & Verify</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Verify User: {user.full_name}</DialogTitle>
                          <DialogDescription>Review all submitted documents and details</DialogDescription>
                        </DialogHeader>

                        {selectedUser && (
                          <div className="space-y-6">
                            {/* Personal Info */}
                            <div>
                              <h3 className="font-semibold mb-2">Personal Information</h3>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Email</p>
                                  <p className="font-semibold">{selectedUser.email}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Phone</p>
                                  <p className="font-semibold">{selectedUser.phone}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Date of Birth</p>
                                  <p className="font-semibold">
                                    {new Date(selectedUser.date_of_birth).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Gender</p>
                                  <p className="font-semibold">{selectedUser.gender}</p>
                                </div>
                              </div>
                            </div>

                            {/* Address */}
                            <div>
                              <h3 className="font-semibold mb-2">Address</h3>
                              <p className="text-sm">
                                {selectedUser.address}, {selectedUser.city}, {selectedUser.state} -{" "}
                                {selectedUser.pincode}
                              </p>
                            </div>

                            {/* Documents */}
                            <div>
                              <h3 className="font-semibold mb-2">Documents</h3>
                              <div className="grid grid-cols-3 gap-4">
                                {selectedUser.photo_url && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">Profile Photo</p>
                                    <img
                                      src={selectedUser.photo_url}
                                      alt="Profile"
                                      className="w-full h-48 object-cover rounded border"
                                    />
                                  </div>
                                )}
                                {selectedUser.aadhar_front_url && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">Aadhar Front</p>
                                    <img
                                      src={selectedUser.aadhar_front_url}
                                      alt="Aadhar Front"
                                      className="w-full h-48 object-cover rounded border"
                                    />
                                  </div>
                                )}
                                {selectedUser.aadhar_back_url && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">Aadhar Back</p>
                                    <img
                                      src={selectedUser.aadhar_back_url}
                                      alt="Aadhar Back"
                                      className="w-full h-48 object-cover rounded border"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Review Notes */}
                            <div>
                              <Label htmlFor="reviewNotes">Review Notes</Label>
                              <Textarea
                                id="reviewNotes"
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add any notes about this verification..."
                                rows={3}
                              />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReject(selectedUser)}
                                variant="destructive"
                                className="flex-1"
                                disabled={isReviewing}
                              >
                                Reject
                              </Button>
                              <Button
                                onClick={() => handleApprove(selectedUser)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                disabled={isReviewing}
                              >
                                {isReviewing ? "Processing..." : "Approve & Send Credentials"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

