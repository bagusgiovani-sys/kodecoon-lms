import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  const { data, error } = await auth.ctx.supabase.rpc('publish_report', { p_report_id: id })
  if (error) {
    const status = error.code === '42501' ? 404 : error.code === '23514' ? 422 : 500
    return NextResponse.json({ error: status === 422 ? 'Export a PDF before publishing' : 'Unable to publish report' }, { status })
  }
  return NextResponse.json({ publicationId: data })
}
