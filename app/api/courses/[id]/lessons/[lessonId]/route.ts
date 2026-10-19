import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'
import { lessonWrite } from '@/lib/validators/courses'
import { courseError } from '@/lib/utils/courseErrors'

// Stable lesson ID + revision 0 creates; positive revisions edit/restore/archive.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id, lessonId } = await params
  const parsed = lessonWrite.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(lessonId).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid lesson edit' }, { status: 422 })
  const { requestId, expectedRevision, content } = parsed.data
  const { data, error } = await auth.ctx.supabase.rpc('save_course_content', {
    p_course: id, p_lesson: lessonId, p_request: requestId, p_expected_revision: expectedRevision, p_content: content,
  })
  if (error) return courseError(error)
  return NextResponse.json(data)
}
