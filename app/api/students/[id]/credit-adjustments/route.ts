import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/utils/apiAuth'

const adjustment = z.object({ requestId: z.uuid(), amount: z.number().int().min(-10000).max(10000).refine(n => n !== 0),
  kind: z.enum(['top_up','adjustment']), reason: z.string().trim().min(1).max(500) })
  .refine(value => value.kind !== 'top_up' || value.amount > 0)

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = adjustment.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !body.success) return NextResponse.json({ error: 'Invalid credit adjustment' }, { status: 422 })
  const { data, error } = await auth.ctx.supabase.rpc('adjust_credits', {
    p_student: id, p_amount: body.data.amount, p_kind: body.data.kind, p_reason: body.data.reason, p_request: body.data.requestId,
  })
  if (error) {
    const status = error.code === '42501' ? 404 : error.code === 'P0002' ? 409 : ['P0001','22023'].includes(error.code) ? 422 : 500
    const message = status === 422 ? 'Adjustment would produce an invalid balance.' : status === 409 ? 'Request ID already used. Reload before retrying.' : 'Unable to adjust credits.'
    return NextResponse.json({ error: message }, { status })
  }
  return NextResponse.json(data)
}
