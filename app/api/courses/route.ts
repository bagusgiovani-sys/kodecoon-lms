import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/utils/apiAuth'
import { courseCreate, libraryQuery } from '@/lib/validators/courses'
import { courseError } from '@/lib/utils/courseErrors'

export async function GET(request: Request) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const parsed = libraryQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid library query' }, { status: 422 })
  const { after, limit, archived } = parsed.data
  let query = auth.ctx.supabase.from('courses').select('*').order('id').limit(limit + 1)
  query = archived === 'true' ? query.not('archived_at', 'is', null) : query.is('archived_at', null)
  if (after) query = query.gt('id', after)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Unable to load courses' }, { status: 500 })
  const rows = data ?? []
  return NextResponse.json({ courses: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1].id : null })
}

export async function POST(request: Request) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const parsed = courseCreate.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid course' }, { status: 422 })
  const { id, requestId, expectedRevision, content } = parsed.data
  const { data, error } = await auth.ctx.supabase.rpc('save_course_content', {
    p_course: id, p_lesson: null, p_request: requestId, p_expected_revision: expectedRevision, p_content: content,
  })
  if (error) return courseError(error)
  return NextResponse.json(data)
}
