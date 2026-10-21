import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'
import { feedbackTransition } from '@/lib/validators/feedback'
import { feedbackError } from '@/lib/utils/feedbackErrors'

type Context = { params: Promise<{ id: string }> }
export async function POST(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = feedbackTransition.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: 'Invalid feedback' }, { status: 422 })
  const body = parsed.data
  const { data, error } = await auth.ctx.supabase.rpc('manage_feedback', {
    p_action: 'withdraw', p_id: id, p_student: null, p_class: null,
    p_request: body.requestId, p_expected_revision: body.expectedRevision, p_content: null,
  })
  return error ? feedbackError(error) : NextResponse.json(data)
}
