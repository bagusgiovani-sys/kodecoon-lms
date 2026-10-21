import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'
import { assignmentListQuery } from '@/lib/validators/assignments'

type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = assignmentListQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid query' }, { status: 422 })
  const { after, limit } = parsed.data
  let query = auth.ctx.supabase.from('assignment_learners')
    .select('student_id,assigned_at,submission_open,revision').eq('assignment_id', id).order('student_id').limit(limit + 1)
  if (after) query = query.gt('student_id', after)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Unable to load learners' }, { status: 500 })
  const rows = data ?? []
  return NextResponse.json({ learners: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1].student_id : null })
}
