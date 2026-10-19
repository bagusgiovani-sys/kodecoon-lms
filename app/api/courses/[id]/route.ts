import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'
import { courseWrite } from '@/lib/validators/courses'
import { courseError } from '@/lib/utils/courseErrors'

type Context = { params: Promise<{ id: string }> }
export async function GET(_request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Invalid course ID' }, { status: 422 })
  const { data, error } = await auth.ctx.supabase.from('courses').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to load course' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Course unavailable' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = courseWrite.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !parsed.success || parsed.data.expectedRevision === 0)
    return NextResponse.json({ error: 'Invalid course edit' }, { status: 422 })
  const { requestId, expectedRevision, content } = parsed.data
  const { data, error } = await auth.ctx.supabase.rpc('save_course_content', {
    p_course: id, p_lesson: null, p_request: requestId, p_expected_revision: expectedRevision, p_content: content,
  })
  if (error) return courseError(error)
  return NextResponse.json(data)
}
