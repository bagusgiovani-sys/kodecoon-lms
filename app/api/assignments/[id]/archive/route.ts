import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'
import { assignmentTransition } from '@/lib/validators/assignments'
import { assignmentError } from '@/lib/utils/assignmentErrors'

type Context = { params: Promise<{ id: string }> }
export async function POST(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = assignmentTransition.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid assignment' }, { status: 422 })
  const body = parsed.data
  const { data, error } = await auth.ctx.supabase.rpc('manage_assignment', {
    p_action: 'archive', p_assignment: id, p_class: null,
    p_request: body.requestId, p_expected_revision: body.expectedRevision,
    p_content: null,
  })
  return error ? assignmentError(error) : NextResponse.json(data)
}
