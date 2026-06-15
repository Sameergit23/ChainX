"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">Registration Submitted Successfully!</CardTitle>
          <CardDescription>Your registration is under review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>✓ Our verification team will review your details</li>
              <li>✓ We'll verify your Aadhar card and documents</li>
              <li>✓ Once approved, you'll receive login credentials via:</li>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Email</li>
                <li>• WhatsApp</li>
                <li>• SMS</li>
              </ul>
              <li>✓ Your credentials will include:</li>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• User ID (8 digits for Worker, 10 digits for Contractor)</li>
                <li>• Temporary password</li>
              </ul>
              <li>✓ You'll need to change your password on first login</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> Verification typically takes 24-48 hours. You'll be notified once your account is
              approved.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">Go to Home</Button>
            </Link>
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full">Check Status</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

