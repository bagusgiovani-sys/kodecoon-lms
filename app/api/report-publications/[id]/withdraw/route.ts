import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  const { error } = await auth.ctx.supabase.rpc('withdraw_report', { p_publication_id: id })
  if (error) return NextResponse.json({ error: 'Unable to withdraw report' }, { status: error.code === '42501' ? 404 : 500 })
  return NextResponse.json({ withdrawn: true })
}
