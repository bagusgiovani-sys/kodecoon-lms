import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { LogoutResponse } from '@/types/api.types'

export async function POST() {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('[auth/logout]', error.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    const response: LogoutResponse = { redirectTo: '/' }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[auth/logout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
