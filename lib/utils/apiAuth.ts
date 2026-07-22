import 'server-only'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Shared step-1 of every route handler (CLAUDE.md §5): auth check + role
// lookup. These checks are UX-level gates for fast, clear errors — RLS
// remains the real security boundary on every query that follows.

type SupabaseServer = Awaited<ReturnType<typeof createServerClient>>

export interface AuthContext {
  supabase: SupabaseServer
  userId: string
  role: string
  centerId: string | null
}

interface AuthSuccess {
  ok: true
  ctx: AuthContext
}

interface AuthFailure {
  ok: false
  response: NextResponse
}

export async function getAuthContext(): Promise<AuthSuccess | AuthFailure> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, center_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return {
    ok: true,
    ctx: {
      supabase,
      userId: user.id,
      role: profile.role,
      centerId: profile.center_id,
    },
  }
}

export async function requireRole(
  ...roles: string[]
): Promise<AuthSuccess | AuthFailure> {
  const auth = await getAuthContext()
  if (!auth.ok) return auth
  if (!roles.includes(auth.ctx.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not authorized' }, { status: 403 }),
    }
  }
  return auth
}

// Teacher-or-admin — the (dashboard) route group's API surface.
export function requireStaff() {
  return requireRole('teacher', 'admin')
}

export function requireAdmin() {
  return requireRole('admin')
}

export function requireParent() {
  return requireRole('parent')
}

// Resolve the admin's active center: the Center Switcher's selection comes in
// as ?centerId=, but it's only honored if RLS lets this admin see that center
// — never trusted raw (CLAUDE.md §4). Falls back to the admin's own center.
export async function resolveActiveCenterId(
  ctx: AuthContext,
  request: Request
): Promise<string | null> {
  const requested = new URL(request.url).searchParams.get('centerId')
  if (requested && requested !== ctx.centerId) {
    const { data } = await ctx.supabase
      .from('centers')
      .select('id')
      .eq('id', requested)
      .single()
    if (data) return data.id
  }
  return ctx.centerId
}
