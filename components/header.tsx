"use client"

import { useState } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Header({ isLoggedIn = false, userRole = null, onLogout = () => {} }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">C</span>
          </div>
          <span className="font-bold text-xl text-foreground">ChainX</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {!isLoggedIn && (
            <>
              <a href="#features" className="text-foreground hover:text-primary transition-colors">
                How It Works
              </a>
              <a href="#testimonials" className="text-foreground hover:text-primary transition-colors">
                Success Stories
              </a>
              <a href="#pricing" className="text-foreground hover:text-primary transition-colors">
                Pricing
              </a>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors">
                Contact
              </a>
            </>
          )}
          {isLoggedIn && (
            <>
              <Link
                href={userRole === "worker" ? "/dashboard/worker" : "/dashboard/contractor"}
                className="text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link href="/profile" className="text-foreground hover:text-primary transition-colors">
                Profile
              </Link>
            </>
          )}
        </div>

        {/* CTA Button */}
        <div className="hidden md:flex items-center gap-4">
          {!isLoggedIn ? (
            <>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Get Started</Button>
              </Link>
            </>
          ) : (
            <Button variant="outline" onClick={onLogout} className="flex items-center gap-2 bg-transparent">
              <LogOut size={18} />
              Logout
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-4 space-y-4">
            {!isLoggedIn && (
              <>
                <a href="#features" className="block text-foreground hover:text-primary">
                  How It Works
                </a>
                <a href="#testimonials" className="block text-foreground hover:text-primary">
                  Success Stories
                </a>
                <a href="#pricing" className="block text-foreground hover:text-primary">
                  Pricing
                </a>
                <a href="#contact" className="block text-foreground hover:text-primary">
                  Contact
                </a>
              </>
            )}
            {isLoggedIn && (
              <>
                <Link
                  href={userRole === "worker" ? "/dashboard/worker" : "/dashboard/contractor"}
                  className="block text-foreground hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link href="/profile" className="block text-foreground hover:text-primary">
                  Profile
                </Link>
              </>
            )}
            <div className="flex gap-2 pt-4">
              {!isLoggedIn ? (
                <>
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login" className="flex-1">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 bg-transparent"
                >
                  <LogOut size={18} />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
