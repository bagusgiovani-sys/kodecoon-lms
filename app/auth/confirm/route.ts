import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'

// Lands every emailed Supabase link: parent/student magic links and
// teacher invites. Verifies the OTP, establishes the session cookie, then
// routes by role per SDD.md §4.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL('/login?error=invalid-link', request.url))
  }

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (error || !data.user) {
      const fallback = type === 'magiclink' || type === 'email' ? '/student/login' : '/login'
      return NextResponse.redirect(
        new URL(`${fallback}?error=expired-link`, request.url)
      )
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'parent') {
      return NextResponse.redirect(new URL('/student', request.url))
    }

    // Invited teacher accepting for the first time — password not set yet.
    if (type === 'invite') {
      return NextResponse.redirect(new URL('/auth/set-password', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (err) {
    console.error('[auth/confirm] verification failed:', err)
    return NextResponse.redirect(new URL('/login?error=expired-link', request.url))
  }
}
