import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'
import { assignmentRosterChange } from '@/lib/validators/assignments'
import { assignmentError } from '@/lib/utils/assignmentErrors'

type Context = { params: Promise<{ id: string; studentId: string }> }
export async function PUT(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id, studentId } = await params
  const parsed = assignmentRosterChange.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(studentId).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid learner change' }, { status: 422 })
  const body = parsed.data
  const { data, error } = await auth.ctx.supabase.rpc('set_assignment_learner', {
    p_assignment: id, p_student: studentId, p_open: body.submissionOpen,
    p_expected_revision: body.expectedRevision, p_request: body.requestId,
  })
  return error ? assignmentError(error) : NextResponse.json(data)
}
