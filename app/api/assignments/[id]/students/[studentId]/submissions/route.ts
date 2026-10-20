import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/utils/apiAuth'
import { createSubmission, submissionHistoryQuery } from '@/lib/validators/submissions'
import { submissionError } from '@/lib/utils/submissionErrors'

type Context = { params: Promise<{ id: string; studentId: string }> }
export async function GET(request: Request, { params }: Context) {
  const auth = await requireRole('parent', 'teacher', 'admin')
  if (!auth.ok) return auth.response
  const { id, studentId } = await params
  const parsed = submissionHistoryQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(studentId).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid query' }, { status: 422 })
  const { data: thread, error: threadError } = await auth.ctx.supabase.from('submission_threads')
    .select('id,next_version').eq('assignment_id', id).eq('student_id', studentId).maybeSingle()
  if (threadError) return NextResponse.json({ error: 'Unable to load submissions' }, { status: 500 })
  if (!thread) return NextResponse.json({ submissions: [], latestVersion: null, nextCursor: null })
  const { before, limit } = parsed.data
  let query = auth.ctx.supabase.from('submission_versions')
    .select('id,version,project_url,reflection,submitted_by,submitted_role,submitted_at,is_late')
    .eq('thread_id', thread.id).order('version', { ascending: false }).limit(limit + 1)
  if (before) query = query.lt('version', before)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Unable to load submissions' }, { status: 500 })
  const rows = data ?? []
  return NextResponse.json({ submissions: rows.slice(0, limit), latestVersion: thread.next_version - 1,
    nextCursor: rows.length > limit ? rows[limit - 1].version : null })
}
export async function POST(request: Request, { params }: Context) {
  const auth = await requireRole('parent', 'teacher', 'admin')
  if (!auth.ok) return auth.response
  const { id, studentId } = await params
  const parsed = createSubmission.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(studentId).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid submission' }, { status: 422 })
  const { data, error } = await auth.ctx.supabase.rpc('submit_assignment', {
    p_assignment: id, p_student: studentId, p_request: parsed.data.requestId,
    p_url: parsed.data.projectUrl, p_reflection: parsed.data.reflection,
  })
  return error ? submissionError(error) : NextResponse.json(data)
}
