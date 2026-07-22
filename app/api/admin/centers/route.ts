import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/apiAuth'
import type { AdminCentersResponse } from '@/types/api.types'

// Feeds the Center Switcher — 1 row in v1, but the scoping pattern exists now
// so Singapore isn't a retrofit (PRD multi-tenancy epic).
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth.ctx

    const { data, error } = await supabase
      .from('centers')
      .select('id, name, country')
      .order('name')

    if (error) {
      console.error('[admin/centers GET]', error.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: AdminCentersResponse = { centers: data ?? [] }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[admin/centers GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
