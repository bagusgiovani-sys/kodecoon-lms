import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireParent } from '@/lib/utils/apiAuth'
import { feedbackListQuery } from '@/lib/validators/feedback'

type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) {
  const auth = await requireParent()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = feedbackListQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!z.uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 422 })
  const { after, limit } = parsed.data
  let query = auth.ctx.supabase.from('published_feedback')
    .select('id,class_id,draft_revision,title,strengths,next_steps,rating,published_at')
    .eq('student_id', id).is('withdrawn_at', null).order('id').limit(limit + 1)
  if (after) query = query.gt('id', after)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Unable to load feedback' }, { status: 500 })
  const rows = data ?? []
  return NextResponse.json({ feedback: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1].id : null })
}
