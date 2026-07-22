import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// RLS-scoped server client — the default for every route handler and Server
// Component. RLS is the real security boundary (CLAUDE.md §6).
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookie writes are handled by
            // proxy.ts session refresh instead, safe to ignore.
          }
        },
      },
    }
  )
}
