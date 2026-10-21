import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'
import { setClassCourse } from '@/lib/validators/classCourse'

const curriculumMappingSchema = z.object({
  courseId: z.uuid(),
  requestId: z.uuid(),
  mappings: z.array(z.object({
    courseLessonId: z.uuid(),
    lessonId: z.union([z.uuid(), z.null()]),
  })).min(1).max(100),
})

type Context = { params: Promise<{ id: string }> }
export async function GET(_request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Invalid class ID' }, { status: 422 })
  const { data, error } = await auth.ctx.supabase.from('class_course_assignments')
    .select('id,class_id,course_id,assigned_by,assigned_at')
    .eq('class_id', id).is('ended_at', null).maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to load class course' }, { status: 500 })
  if (!data) return NextResponse.json({ assignment: null })
  const course = await auth.ctx.supabase.from('courses').select('*').eq('id', data.course_id).maybeSingle()
  if (course.error) return NextResponse.json({ error: 'Unable to load course' }, { status: 500 })
  if (!course.data) return NextResponse.json({ error: 'Course unavailable' }, { status: 404 })
  return NextResponse.json({ assignment: { ...data, course: course.data } })
}

export async function PUT(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = setClassCourse.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return NextResponse.json({ error: 'Invalid class course assignment' }, { status: 422 })
  const { data, error } = await auth.ctx.supabase.rpc('set_class_course', {
    p_class: id, p_course: parsed.data.courseId, p_request: parsed.data.requestId,
  })
  if (error) {
    const status = error.code === '42501' ? 404 : ['P0002','23505'].includes(error.code ?? '') ? 409
      : ['22023','23503','23514'].includes(error.code ?? '') ? 422 : 500
    return NextResponse.json({ error: status === 409 ? 'Request conflict. Reload before retrying.'
      : status === 422 ? 'Invalid course assignment.' : status === 404 ? 'Class or course unavailable.'
        : 'Unable to assign course.' }, { status })
  }
  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: Context) {
  const auth = await requireStaff()
  if (!auth.ok) return auth.response
  const { id } = await params
  const parsed = curriculumMappingSchema.safeParse(await request.json().catch(() => null))
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return NextResponse.json({ error: 'Choose valid course and class lessons.' }, { status: 422 })
  const { data, error } = await auth.ctx.supabase.rpc('map_class_course_lessons', {
    p_class: id,
    p_course: parsed.data.courseId,
    p_request: parsed.data.requestId,
    p_mappings: parsed.data.mappings,
  })
  if (error) {
    const status = error.code === '42501' ? 404
      : ['P0002', '23505'].includes(error.code ?? '') ? 409
        : ['22023', '23503', '23514'].includes(error.code ?? '') ? 422 : 500
    return NextResponse.json({ error: status === 409
      ? 'A mapping changed while you were editing. Reload and retry the exact request.'
      : status === 422 ? 'One or more selected lessons are no longer available.'
        : status === 404 ? 'Class or active course unavailable.'
          : 'Unable to map course lessons.' }, { status })
  }
  return NextResponse.json(data)
}
