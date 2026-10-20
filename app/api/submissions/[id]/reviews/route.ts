import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, requireStaff } from '@/lib/utils/apiAuth'
import { createReview, submissionHistoryQuery } from '@/lib/validators/submissions'
import { submissionError } from '@/lib/utils/submissionErrors'

type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) {
  const auth = await requireRole('parent', 'teacher', 'admin')
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = submissionHistoryQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid query' }, { status: 422 })
  const { before, limit } = parsed.data
  let query = auth.ctx.supabase.from('submission_reviews')
    .select('id,submission_id,sequence,outcome,feedback,reviewed_by,reviewed_at,supersedes_id')
    .eq('submission_id', id).order('sequence', { ascending: false }).limit(limit + 1)
  if (before) query = query.lt('sequence', before)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Unable to load reviews' }, { status: 500 })
  const rows = data ?? []
  return NextResponse.json({ reviews: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1].sequence : null })
}
export async function POST(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = createReview.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid review' }, { status: 422 })
  const { data, error } = await auth.ctx.supabase.rpc('review_submission', {
    p_submission: id, p_request: parsed.data.requestId, p_expected_version: parsed.data.expectedVersion,
    p_expected_review: parsed.data.expectedReviewId, p_outcome: parsed.data.outcome, p_feedback: parsed.data.feedback,
  })
  return error ? submissionError(error) : NextResponse.json(data)
}
