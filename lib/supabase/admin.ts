import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Service-role client — bypasses RLS. ONLY for auth.admin operations
// (teacher/parent invites) and their linked users-row writes, called from
// staff-only route handlers. Never import this from a parent-facing route
// (CLAUDE.md §11).
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
