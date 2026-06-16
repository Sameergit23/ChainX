"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    email: "",
    phone: "",
    fullName: "",
    userType: "worker" as "worker" | "contractor",
    
    // Step 2: Personal Details
    dateOfBirth: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    alternatePhone: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    
    // Step 3: Identity Documents
    aadharNumber: "",
    aadharFront: null as File | null,
    aadharBack: null as File | null,
    photo: null as File | null,
  })

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (field: "aadharFront" | "aadharBack" | "photo", file: File | null) => {
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`${field} file size should be less than 5MB`)
        return
      }
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png"]
      if (!validTypes.includes(file.type)) {
        setError(`${field} must be a JPEG or PNG image`)
        return
      }
    }
    setFormData((prev) => ({ ...prev, [field]: file }))
    setError(null)
  }

  const uploadFile = async (file: File, path: string, userId?: string): Promise<string | null> => {
    try {
      const supabase = createClient()
      
      // Check if storage is available
      if (!supabase.storage) {
        throw new Error("Storage is not configured. Please set up Supabase storage bucket.")
      }

      // Get current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      // If no user session, try server-side upload immediately (no need to retry client-side)
      if (!user || userError) {
        if (!userId) {
          throw new Error("User not authenticated and no userId provided")
        }
        
        console.log("No auth session, using server-side upload...")
        return await uploadViaServer(file, path, userId)
      }

      // Try direct client-side upload (should work now that we signed in)
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${path}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      // If client-side upload fails, fall back to server-side
      if (uploadError) {
        console.log("Client upload failed, trying server-side upload...", uploadError.message)
        return await uploadViaServer(file, path, userId || user.id)
      }

      if (!uploadData) {
        throw new Error("Upload returned no data")
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("user-documents").getPublicUrl(filePath)

      if (!publicUrl) {
        throw new Error("Failed to get public URL for uploaded file")
      }

      return publicUrl
    } catch (err: any) {
      console.error("File upload error:", err)
      throw new Error(err.message || "File upload failed. Please check storage bucket setup.")
    }
  }

  // Helper function for server-side upload (only used as last resort)
  const uploadViaServer = async (file: File, path: string, userId: string): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("path", path)
      formData.append("userId", userId)

      const response = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      })

      // Check if response is HTML (error page)
      const contentType = response.headers.get("content-type") || ""
      
      if (!contentType.includes("application/json")) {
        // Got HTML instead of JSON - API route is broken
        const text = await response.text()
        console.error("API route returned HTML error page:", text.substring(0, 500))
        
        if (response.status === 404) {
          throw new Error("API route /api/upload-document not found. Please check that the route file exists.")
        } else if (response.status === 500) {
          throw new Error(
            "Server error: API route crashed. " +
            "Most likely SUPABASE_SERVICE_ROLE_KEY is missing in .env.local. " +
            "Add it and restart the server: npm run dev"
          )
        } else {
          throw new Error(`Server returned HTML error page (status ${response.status}). Check server terminal for errors.`)
        }
      }

      if (!response.ok) {
        // Got JSON error response
        const errorData = await response.json()
        throw new Error(errorData.error || `Server upload failed: ${response.status}`)
      }

      const result = await response.json()
      if (!result.url) {
        throw new Error("Server upload succeeded but no URL returned")
      }
      return result.url
    } catch (fetchError: any) {
      // Re-throw with clearer message
      throw new Error(
        `Server-side upload failed: ${fetchError.message}. ` +
        "Please set up storage policies in Supabase (see FINAL_FIX_STORAGE.md) or add SUPABASE_SERVICE_ROLE_KEY to .env.local"
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Step 1: Create user account FIRST (so user is authenticated for file uploads)
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + "!@#"

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            full_name: formData.fullName,
            user_type: formData.userType,
            phone: formData.phone,
            verification_status: "pending",
            has_temp_password: true,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create user account")

      // Step 2: Sign in immediately to establish session for file uploads
      // After signUp, we need to sign in to get a proper session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: tempPassword,
      })

      if (signInError) {
        console.warn("Sign in after signup failed, will use server-side upload:", signInError)
        // Continue anyway - we'll use server-side upload
      } else {
        console.log("Session established successfully")
      }
      
      let aadharFrontUrl: string | null = null
      let aadharBackUrl: string | null = null
      let photoUrl: string | null = null

      try {
        // Upload files (will use client-side if session exists, otherwise server-side)
        if (formData.aadharFront) {
          aadharFrontUrl = await uploadFile(formData.aadharFront, "aadhar-front", authData.user.id)
          if (!aadharFrontUrl) throw new Error("Failed to upload Aadhar front")
        }

        if (formData.aadharBack) {
          aadharBackUrl = await uploadFile(formData.aadharBack, "aadhar-back", authData.user.id)
          if (!aadharBackUrl) throw new Error("Failed to upload Aadhar back")
        }

        if (formData.photo) {
          photoUrl = await uploadFile(formData.photo, "photos", authData.user.id)
          if (!photoUrl) throw new Error("Failed to upload photo")
        }
      } catch (uploadErr: any) {
        // If upload fails, we still have the user account, but mark it for manual review
        console.error("File upload error after account creation:", uploadErr)
        throw new Error(`File upload failed: ${uploadErr.message}. Account created but files not uploaded. Please contact support or try again.`)
      }

      // Update profile with all details
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          email: formData.email,
          phone: formData.phone,
          full_name: formData.fullName,
          user_type: formData.userType,
          verification_status: "pending",
          aadhar_number: formData.aadharNumber,
          aadhar_front_url: aadharFrontUrl,
          aadhar_back_url: aadharBackUrl,
          photo_url: photoUrl,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          alternate_phone: formData.alternatePhone,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_number: formData.emergencyContactNumber,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          has_temp_password: true,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id)

      if (profileError) throw profileError

      // Add to verification queue
      const { error: queueError } = await supabase.from("verification_queue").insert({
        user_id: authData.user.id,
        profile_id: authData.user.id,
        status: "pending",
      })

      if (queueError) console.error("Queue error:", queueError)

      // Redirect to success page
      router.push("/auth/registration-success")
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        return !!(formData.email && formData.phone && formData.fullName)
      case 2:
        return !!(
          formData.dateOfBirth &&
          formData.gender &&
          formData.address &&
          formData.city &&
          formData.state &&
          formData.pincode &&
          formData.emergencyContactName &&
          formData.emergencyContactNumber
        )
      case 3:
        return !!(
          formData.aadharNumber &&
          formData.aadharFront &&
          formData.aadharBack &&
          formData.photo
        )
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1)
      setError(null)
    } else {
      setError("Please fill all required fields")
    }
  }

  const prevStep = () => {
    setStep(step - 1)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Registration - Step {step} of 3</CardTitle>
            <CardDescription className="text-center">
              {step === 1 && "Basic Information"}
              {step === 2 && "Personal Details"}
              {step === 3 && "Identity Documents"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <span className={`text-sm ${step >= 1 ? "text-orange-600 font-semibold" : "text-gray-400"}`}>
                    Step 1
                  </span>
                  <span className={`text-sm ${step >= 2 ? "text-orange-600 font-semibold" : "text-gray-400"}`}>
                    Step 2
                  </span>
                  <span className={`text-sm ${step >= 3 ? "text-orange-600 font-semibold" : "text-gray-400"}`}>
                    Step 3
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="userType">I am a</Label>
                    <select
                      id="userType"
                      value={formData.userType}
                      onChange={(e) => handleInputChange("userType", e.target.value as "worker" | "contractor")}
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background"
                      required
                    >
                      <option value="worker">Worker</option>
                      <option value="contractor">Contractor</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      required
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>

                  <Button type="button" onClick={nextStep} className="w-full" disabled={!validateStep(1)}>
                    Next: Personal Details
                  </Button>
                </div>
              )}

              {/* Step 2: Personal Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <select
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => handleInputChange("gender", e.target.value)}
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2"
                        required
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Street address"
                      required
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        type="text"
                        required
                        value={formData.pincode}
                        onChange={(e) => handleInputChange("pincode", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="alternatePhone">Alternate Phone Number (Optional)</Label>
                    <Input
                      id="alternatePhone"
                      type="tel"
                      value={formData.alternatePhone}
                      onChange={(e) => handleInputChange("alternatePhone", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                      <Input
                        id="emergencyContactName"
                        type="text"
                        required
                        value={formData.emergencyContactName}
                        onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="emergencyContactNumber">Emergency Contact Number *</Label>
                      <Input
                        id="emergencyContactNumber"
                        type="tel"
                        required
                        value={formData.emergencyContactNumber}
                        onChange={(e) => handleInputChange("emergencyContactNumber", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" onClick={prevStep} variant="outline" className="flex-1">
                      Previous
                    </Button>
                    <Button type="button" onClick={nextStep} className="flex-1" disabled={!validateStep(2)}>
                      Next: Documents
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Identity Documents */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="aadharNumber">Aadhar Number *</Label>
                    <Input
                      id="aadharNumber"
                      type="text"
                      placeholder="1234 5678 9012"
                      required
                      value={formData.aadharNumber}
                      onChange={(e) => handleInputChange("aadharNumber", e.target.value)}
                      maxLength={12}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="aadharFront">Aadhar Card Front * (JPEG/PNG, Max 5MB)</Label>
                    <Input
                      id="aadharFront"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      required
                      onChange={(e) => handleFileChange("aadharFront", e.target.files?.[0] || null)}
                    />
                    {formData.aadharFront && (
                      <p className="text-sm text-green-600">✓ {formData.aadharFront.name}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="aadharBack">Aadhar Card Back * (JPEG/PNG, Max 5MB)</Label>
                    <Input
                      id="aadharBack"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      required
                      onChange={(e) => handleFileChange("aadharBack", e.target.files?.[0] || null)}
                    />
                    {formData.aadharBack && (
                      <p className="text-sm text-green-600">✓ {formData.aadharBack.name}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="photo">Profile Photo * (JPEG/PNG, Max 5MB)</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      required
                      onChange={(e) => handleFileChange("photo", e.target.files?.[0] || null)}
                    />
                    {formData.photo && (
                      <p className="text-sm text-green-600">✓ {formData.photo.name}</p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> Your registration will be reviewed by our verification team. Once approved,
                      you will receive your login credentials via email/WhatsApp/SMS.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" onClick={prevStep} variant="outline" className="flex-1">
                      Previous
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading || !validateStep(3)}>
                      {isLoading ? "Submitting..." : "Submit Registration"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-orange-600 hover:underline">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

