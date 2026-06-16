"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to ChainX!</CardTitle>
            <CardDescription>Your account has been created successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-sm text-green-900">
                Please check your email to confirm your account. You may need to verify your email before accessing all
                features.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Next Steps:</h3>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Check your email for a confirmation link</li>
                <li>Click the link to verify your email</li>
                <li>Return here and log in to your account</li>
                <li>Complete your profile</li>
                <li>Start finding jobs or posting opportunities!</li>
              </ol>
            </div>

            <Link href="/auth/login" className="block">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
