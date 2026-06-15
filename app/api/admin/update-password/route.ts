import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// This route requires service role key (admin access)
// ⚠️ SECURITY: Add authentication middleware to protect this route
// DO NOT expose this route publicly without proper authentication

export async function POST(request: Request) {
  try {
    const { userId, password } = await request.json()

    if (!userId || !password) {
      return NextResponse.json({ error: "User ID and password are required" }, { status: 400 })
    }

    // Verify service role key exists
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Update user password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password,
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error: any) {
    console.error("Update password error:", error)
    return NextResponse.json({ error: error.message || "Failed to update password" }, { status: 500 })
  }
}

