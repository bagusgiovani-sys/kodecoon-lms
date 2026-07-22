import 'server-only'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

// Server-side guards for the three route-group layouts (CLAUDE.md §4).
// proxy.ts already redirects at the edge; these re-check inside the layout so
// a page can never render for the wrong role even if the matcher misses.
// RLS remains the real security boundary on every query the pages run.

type SupabaseServer = Awaited<ReturnType<typeof createServerClient>>

export interface PageAuthContext {
  supabase: SupabaseServer
  userId: string
  role: string
  name: string
  centerId: string | null
}

async function getPageAuth(): Promise<PageAuthContext | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role, name, center_id')
    .eq('id', user.id)
    .single()
  if (!profile) return null

  return {
    supabase,
    userId: user.id,
    role: profile.role,
    name: profile.name,
    centerId: profile.center_id,
  }
}

// (dashboard) — teacher or admin
export async function requireStaffPage(): Promise<PageAuthContext> {
  const ctx = await getPageAuth()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'teacher' && ctx.role !== 'admin') {
    redirect(ctx.role === 'parent' ? '/student' : '/login')
  }
  return ctx
}

// (admin) — admin only
export async function requireAdminPage(): Promise<PageAuthContext> {
  const ctx = await getPageAuth()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'admin') {
    redirect(ctx.role === 'parent' ? '/student' : '/dashboard')
  }
  return ctx
}

// (student) — parent only
export async function requireParentPage(): Promise<PageAuthContext> {
  const ctx = await getPageAuth()
  if (!ctx) redirect('/student/login')
  if (ctx.role !== 'parent') redirect('/dashboard')
  return ctx
}
