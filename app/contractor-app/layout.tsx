import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "../globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ChainX Contractor - Find Reliable Workers Instantly",
  description: "Connect with skilled local workers. Post jobs, manage applications, and get work done with real-time notifications.",
}

export default function ContractorAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} ${geistMono.className}`}>
        {children}
      </body>
    </html>
  )
}
