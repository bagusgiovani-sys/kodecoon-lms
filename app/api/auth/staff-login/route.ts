import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { staffLoginSchema } from '@/lib/validators/auth'
import type { StaffLoginResponse } from '@/types/api.types'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const result = staffLoginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Enter an email and password' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    })

    if (error || !data.user) {
      // Never reveal which field is wrong (SDD.md §4)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'parent') {
      // Parents never log in here — no password exists for that role
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const response: StaffLoginResponse = {
      redirectTo: profile?.role === 'admin' ? '/admin' : '/dashboard',
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[auth/staff-login]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
