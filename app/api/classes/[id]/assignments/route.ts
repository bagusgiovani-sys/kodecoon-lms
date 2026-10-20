import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'
import { createAssignment, assignmentListQuery } from '@/lib/validators/assignments'
import { assignmentError } from '@/lib/utils/assignmentErrors'

type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = assignmentListQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid query' }, { status: 422 })
  const { after, limit } = parsed.data
  let query = auth.ctx.supabase.from('assignments').select('*').eq('class_id', id).order('id').limit(limit + 1)
  if (after) query = query.gt('id', after)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Unable to load assignments' }, { status: 500 })
  const rows = data ?? []
  return NextResponse.json({ assignments: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1].id : null })
}
export async function POST(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = createAssignment.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid assignment' }, { status: 422 })
  const body = parsed.data
  const { data, error } = await auth.ctx.supabase.rpc('manage_assignment', {
    p_action: 'create', p_assignment: body.id, p_class: id,
    p_request: body.requestId, p_expected_revision: body.expectedRevision,
    p_content: body.content,
  })
  return error ? assignmentError(error) : NextResponse.json(data)
}
