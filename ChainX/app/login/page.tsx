"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<"worker" | "contractor" | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRole && email && password) {
      // Store user info in localStorage for demo purposes
      localStorage.setItem("userRole", selectedRole)
      localStorage.setItem("userEmail", email)
      localStorage.setItem("isLoggedIn", "true")

      // Redirect to appropriate dashboard
      router.push(selectedRole === "worker" ? "/dashboard/worker" : "/dashboard/contractor")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">C</span>
            </div>
            <span className="font-bold text-2xl text-foreground">ChainX</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to ChainX</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card className="p-8 space-y-6">
          {/* Role Selection */}
          {!selectedRole ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">I am a:</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedRole("worker")}
                  className="p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center"
                >
                  <div className="font-semibold text-foreground">Worker</div>
                  <div className="text-xs text-muted-foreground mt-1">Find local work</div>
                </button>
                <button
                  onClick={() => setSelectedRole("contractor")}
                  className="p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center"
                >
                  <div className="font-semibold text-foreground">Contractor</div>
                  <div className="text-xs text-muted-foreground mt-1">Hire workers</div>
                </button>
              </div>
            </div>
          ) : (
            <>
              <button onClick={() => setSelectedRole(null)} className="text-sm text-primary hover:underline">
                ← Change role
              </button>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Sign In
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account? <button className="text-primary hover:underline">Sign up</button>
              </div>
            </>
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing in, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  )
}
