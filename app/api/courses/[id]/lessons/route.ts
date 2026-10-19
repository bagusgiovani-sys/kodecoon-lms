import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'

const querySchema = z.strictObject({ after: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30) })
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!z.uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: 'Invalid lesson query' }, { status: 422 })
  const course = await auth.ctx.supabase.from('courses').select('id').eq('id', id).maybeSingle()
  if (course.error) return NextResponse.json({ error: 'Unable to load course' }, { status: 500 })
  if (!course.data) return NextResponse.json({ error: 'Course unavailable' }, { status: 404 })
  const { after, limit } = parsed.data
  let query = auth.ctx.supabase.from('course_lessons').select('*').eq('course_id', id).order('id').limit(limit + 1)
  if (after) query = query.gt('id', after)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Unable to load lessons' }, { status: 500 })
  const rows = data ?? []
  return NextResponse.json({ lessons: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1].id : null })
}
