import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { magicLinkSchema } from '@/lib/validators/auth'
import type { MagicLinkResponse } from '@/types/api.types'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const result = magicLinkSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 })
    }
    const email = result.data.email.toLowerCase()

    // Pre-auth lookup, so the RLS-scoped anon client can't see users — the
    // admin client is used ONLY to check the parent row exists and to send
    // the OTP; no student data is touched (CLAUDE.md §11 allows admin ops,
    // never parent-facing data reads).
    const admin = createAdminClient()
    const { data: parent } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('role', 'parent')
      .maybeSingle()

    if (!parent) {
      return NextResponse.json(
        {
          error:
            'No student found for this email — check with your child’s teacher',
        },
        { status: 404 }
      )
    }

    const { error } = await admin.auth.signInWithOtp({
      email,
      options: {
        // shouldCreateUser false: accounts only exist via the Add Student
        // parent-invite flow, never self-signup
        shouldCreateUser: false,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      },
    })

    if (error) {
      console.error('[auth/magic-link] send failed:', error.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: MagicLinkResponse = { sent: true }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[auth/magic-link]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
