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
        // Get user type from metadata or profile
        let userType = data.user.user_metadata?.user_type || 'worker'
        
        // Try to get from profile if not in metadata
        if (!data.user.user_metadata?.user_type) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("id", data.user.id)
            .single()
          
          if (profile?.user_type) {
            userType = profile.user_type
          }
        }
        
        if (userType === 'contractor') {
          return NextResponse.redirect(`${origin}/contractor/dashboard`)
        } else {
          return NextResponse.redirect(`${origin}/worker/dashboard`)
        }
      }
    } catch (err) {
      console.error("Callback error:", err)
      return NextResponse.redirect(`${origin}/auth/login?error=Verification failed. Please try again.`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?message=Invalid verification link`)
}
