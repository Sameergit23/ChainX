import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "../globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ChainX Worker - Find Work Opportunities Instantly",
  description: "Connect with local job opportunities. Browse jobs, apply instantly, and earn money with real-time notifications.",
}

export default function WorkerAppLayout({
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
