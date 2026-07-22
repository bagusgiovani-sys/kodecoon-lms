import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Next 16 renamed middleware.ts → proxy.ts; this is CLAUDE.md §4's
// "middleware.ts" — auth + role route protection, three route groups,
// three rules. App-layer checks here are UX (fast redirects); RLS remains
// the real security boundary (CLAUDE.md §6).

const STAFF_PREFIXES = ['/dashboard', '/schedule', '/classes', '/students']

function isStaffPath(pathname: string) {
  return STAFF_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function isStudentPath(pathname: string) {
  return (
    (pathname === '/student' || pathname.startsWith('/student/')) &&
    pathname !== '/student/login'
  )
}

function homeFor(role: string | null) {
  return role === 'parent' ? '/student' : '/dashboard'
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session on every request so Server Components never see a
  // stale token — must run before any redirect decision.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const staffRoute = isStaffPath(pathname)
  const adminRoute = isAdminPath(pathname)
  const studentRoute = isStudentPath(pathname)
  const loginRoute = pathname === '/login' || pathname === '/student/login'

  if (!user) {
    if (staffRoute || adminRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (studentRoute) {
      return NextResponse.redirect(new URL('/student/login', request.url))
    }
    return response
  }

  // Role comes from the session user's own row (users_select_own policy) —
  // never from anything the client sent (CLAUDE.md §4).
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = profile?.role ?? null

  // A session whose users row is missing (half-provisioned invite, deleted
  // profile) is treated as unauthenticated: redirecting it "home" would
  // bounce between homeFor(null) and the role check forever.
  if (!role) {
    if (staffRoute || adminRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (studentRoute) {
      return NextResponse.redirect(new URL('/student/login', request.url))
    }
    return response
  }

  if (loginRoute) {
    return NextResponse.redirect(new URL(homeFor(role), request.url))
  }

  if (adminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL(homeFor(role), request.url))
  }

  if (staffRoute && role !== 'teacher' && role !== 'admin') {
    return NextResponse.redirect(new URL(homeFor(role), request.url))
  }

  if (studentRoute && role !== 'parent') {
    return NextResponse.redirect(new URL(homeFor(role), request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Everything except API routes (they return their own 401/403 JSON),
    // the auth callback flow, Next internals, and static files.
    '/((?!api|auth|_next/static|_next/image|favicon\\.ico|.*\\..*).*)',
  ],
}
