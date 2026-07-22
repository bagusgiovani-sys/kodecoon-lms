import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/apiAuth'
import { updateLessonSchema } from '@/lib/validators/admin'
import type { TablesUpdate } from '@/types/database.types'
import type { DeleteLessonResponse, UpdateLessonResponse } from '@/types/api.types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth.ctx
    const { id: lessonId } = await params

    const body = await request.json().catch(() => null)
    const result = updateLessonSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }
    const { title, description, sequenceNumber } = result.data

    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, class_id, sequence_number')
      .eq('id', lessonId)
      .maybeSingle()
    if (!lesson) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Reorder = swap with whichever lesson holds the target position.
    // unique(class_id, sequence_number) forbids a direct two-row update, so
    // park this lesson on a negative sequence first.
    if (sequenceNumber !== undefined && sequenceNumber !== lesson.sequence_number) {
      const { data: occupant } = await supabase
        .from('lessons')
        .select('id')
        .eq('class_id', lesson.class_id)
        .eq('sequence_number', sequenceNumber)
        .maybeSingle()

      const { error: parkError } = await supabase
        .from('lessons')
        .update({ sequence_number: -lesson.sequence_number })
        .eq('id', lessonId)
      if (parkError) {
        console.error('[admin/lesson PATCH] park:', parkError.message)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }

      if (occupant) {
        const { error: swapError } = await supabase
          .from('lessons')
          .update({ sequence_number: lesson.sequence_number })
          .eq('id', occupant.id)
        if (swapError) {
          console.error('[admin/lesson PATCH] swap:', swapError.message)
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }
      }
    }

    const updates: TablesUpdate<'lessons'> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (sequenceNumber !== undefined) updates.sequence_number = sequenceNumber

    const { error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', lessonId)
    if (error) {
      console.error('[admin/lesson PATCH]', error.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: UpdateLessonResponse = { lessonId }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[admin/lesson PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth.ctx
    const { id: lessonId } = await params

    const { data: lesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('id', lessonId)
      .maybeSingle()
    if (!lesson) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // The confirm-warning count — the client shows this BEFORE calling
    // DELETE (via a direct RLS-scoped read); returned here too per SDD
    const { count } = await supabase
      .from('student_lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('lesson_id', lessonId)
      .eq('status', 'completed')

    const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
    if (error) {
      console.error('[admin/lesson DELETE]', error.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: DeleteLessonResponse = {
      deleted: true,
      studentsAffected: count ?? 0,
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[admin/lesson DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
