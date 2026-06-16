import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error("Email verification error:", error)
        return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
      }

      if (data?.user) {
        // Redirect to general dashboard which will route based on user type
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    } catch (err) {
      console.error("Callback error:", err)
      return NextResponse.redirect(`${origin}/auth/login?error=Verification failed. Please try again.`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?message=Invalid verification link`)
}
