import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug logging to help troubleshoot
  console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing')
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

  // Check if we have real Supabase credentials (not placeholder values)
  const hasRealCredentials = supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('your_supabase_project_url_here') &&
    !supabaseAnonKey.includes('your_supabase_anon_key_here') &&
    !supabaseUrl.includes('your-project-id.supabase.co') &&
    !supabaseAnonKey.includes('eyJ-your-anon-key-here')

  if (!hasRealCredentials) {
    // Return a mock client that won't crash the app
    return {
      auth: {
        getUser: async () => {
          // Check for demo user in localStorage
          if (typeof window !== 'undefined') {
            const demoUser = localStorage.getItem('demo-user')
            const isDemoAuth = localStorage.getItem('demo-auth')
            
            if (demoUser && isDemoAuth === 'true') {
              return { 
                data: { user: JSON.parse(demoUser) }, 
                error: null 
              }
            }
          }
          return { data: { user: null }, error: null }
        },
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signOut: async () => {
          // Clear demo authentication
          if (typeof window !== 'undefined') {
            localStorage.removeItem('demo-user')
            localStorage.removeItem('demo-auth')
          }
          return { error: null }
        },
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
            order: () => ({
              limit: () => ({
                then: async (callback: any) => callback({ data: [], error: null })
              })
            })
          })
        })
      }),
      channel: () => ({
        on: () => ({
          subscribe: () => ({
            unsubscribe: () => {}
          })
        })
      }),
      storage: {
        from: () => ({
          upload: async () => ({ 
            data: null, 
            error: { message: 'Storage bucket not configured. Please create "user-documents" bucket in Supabase.' } 
          }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          remove: async () => ({ data: null, error: null })
        })
      }
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
