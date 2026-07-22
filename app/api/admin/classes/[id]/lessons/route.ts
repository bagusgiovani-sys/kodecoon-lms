import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/apiAuth'
import { addLessonSchema } from '@/lib/validators/admin'
import type { AddLessonResponse, AdminLessonsResponse } from '@/types/api.types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth.ctx
    const { id: classId } = await params

    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .maybeSingle()
    if (!cls) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('lessons')
      .select('id, sequence_number, title, description')
      .eq('class_id', classId)
      .order('sequence_number')

    if (error) {
      console.error('[admin/lessons GET]', error.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: AdminLessonsResponse = {
      lessons: (data ?? []).map((lesson) => ({
        id: lesson.id,
        sequenceNumber: lesson.sequence_number,
        title: lesson.title,
        description: lesson.description,
      })),
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[admin/lessons GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth.ctx
    const { id: classId } = await params

    const body = await request.json().catch(() => null)
    const result = addLessonSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Enter a lesson title' }, { status: 400 })
    }

    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .maybeSingle()
    if (!cls) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Appended at the next sequence_number — integers only, gaps are fine
    // (CLAUDE.md §11)
    const { data: last } = await supabase
      .from('lessons')
      .select('sequence_number')
      .eq('class_id', classId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextSequence = (last?.sequence_number ?? 0) + 1

    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        class_id: classId,
        sequence_number: nextSequence,
        title: result.data.title,
        description: result.data.description ?? null,
      })
      .select('id, sequence_number')
      .single()

    if (error || !lesson) {
      console.error('[admin/lessons POST]', error?.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: AddLessonResponse = {
      lessonId: lesson.id,
      sequenceNumber: lesson.sequence_number,
    }
    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    console.error('[admin/lessons POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
