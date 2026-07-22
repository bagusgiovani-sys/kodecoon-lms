import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// Browser client — RLS-protected reads only. Writes with side effects go
// through route handlers (SDD.md §2).
export function createBrowserClient() {
  return createSSRBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
