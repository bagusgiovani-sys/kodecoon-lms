import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireParent } from '@/lib/utils/apiAuth'
import { assignmentListQuery } from '@/lib/validators/assignments'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireParent()
  if (!auth.ok) return auth.response
  const { id: studentId } = await params
  const parsed = assignmentListQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!z.uuid().safeParse(studentId).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid query' }, { status: 422 })
  const { after, limit } = parsed.data
  let query = auth.ctx.supabase.from('assignment_learners').select('assignment_id')
    .eq('student_id', studentId).order('assignment_id').limit(limit + 1)
  if (after) query = query.gt('assignment_id', after)
  const learners = await query
  if (learners.error) return NextResponse.json({ error: 'Unable to load assignments' }, { status: 500 })
  const rows = learners.data ?? []
  if (!rows.length) return NextResponse.json({ assignments: [], nextCursor: null })
  const { data, error } = await auth.ctx.supabase.from('assignments')
    .select('id,class_id,title,brief,due_at,status,lesson_title_snapshot,lesson_objective_snapshot,published_at')
    .in('id', rows.slice(0, limit).map(row => row.assignment_id)).order('id')
  if (error) return NextResponse.json({ error: 'Unable to load assignments' }, { status: 500 })
  return NextResponse.json({ assignments: data ?? [], nextCursor: rows.length > limit ? rows[limit - 1].assignment_id : null })
}
