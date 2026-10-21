import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'
import { createFeedback, feedbackListQuery } from '@/lib/validators/feedback'
import { feedbackError } from '@/lib/utils/feedbackErrors'

type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = feedbackListQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!z.uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 422 })
  const { after, limit } = parsed.data
  let query = auth.ctx.supabase.from('student_feedback').select('*').eq('student_id', id).order('id').limit(limit + 1)
  if (after) query = query.gt('id', after)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Unable to load feedback' }, { status: 500 })
  const rows = data ?? []
  return NextResponse.json({ feedback: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1].id : null })
}
export async function POST(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = createFeedback.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: 'Invalid feedback' }, { status: 422 })
  const body = parsed.data
  const { data, error } = await auth.ctx.supabase.rpc('manage_feedback', {
    p_action: 'create', p_id: body.id, p_student: id, p_class: body.classId,
    p_request: body.requestId, p_expected_revision: body.expectedRevision, p_content: body.content,
  })
  return error ? feedbackError(error) : NextResponse.json(data)
}
