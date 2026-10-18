import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  const { data, error } = await auth.ctx.supabase.from('published_reports')
    .select('id, generated_date, withdrawn_at').eq('student_id', id)
    .order('published_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: 'Unable to load reports' }, { status: 500 })
  return NextResponse.json({ reports: data })
}
