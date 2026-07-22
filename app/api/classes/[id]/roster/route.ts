import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/utils/apiAuth'
import type { RosterResponse } from '@/types/api.types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStaff()
    if (!auth.ok) return auth.response
    const { supabase, userId, role } = auth.ctx
    const { id: classId } = await params

    const { data: cls } = await supabase
      .from('classes')
      .select('id, teacher_id')
      .eq('id', classId)
      .maybeSingle()

    if (!cls) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (cls.teacher_id !== userId && role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const [enrollmentsRes, lessonsRes] = await Promise.all([
      supabase
        .from('enrollments')
        .select('student_id, students(id, name)')
        .eq('class_id', classId),
      supabase.from('lessons').select('id').eq('class_id', classId),
    ])

    if (enrollmentsRes.error || lessonsRes.error) {
      console.error(
        '[roster GET]',
        enrollmentsRes.error?.message ?? lessonsRes.error?.message
      )
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const lessonIds = (lessonsRes.data ?? []).map((lesson) => lesson.id)
    const studentIds = (enrollmentsRes.data ?? []).map((e) => e.student_id)

    // Completed-lesson counts are always derived, never stored (CLAUDE.md §6)
    const completedByStudent = new Map<string, number>()
    if (lessonIds.length > 0 && studentIds.length > 0) {
      const { data: progress, error } = await supabase
        .from('student_lesson_progress')
        .select('student_id, lesson_id')
        .in('student_id', studentIds)
        .in('lesson_id', lessonIds)
        .eq('status', 'completed')
      if (error) {
        console.error('[roster GET] progress:', error.message)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
      for (const row of progress ?? []) {
        completedByStudent.set(
          row.student_id,
          (completedByStudent.get(row.student_id) ?? 0) + 1
        )
      }
    }

    const response: RosterResponse = {
      students: (enrollmentsRes.data ?? [])
        .filter((e) => e.students !== null)
        .map((e) => ({
          id: e.students!.id,
          name: e.students!.name,
          lessonsCompleted: completedByStudent.get(e.student_id) ?? 0,
          lessonsTotal: lessonIds.length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[roster GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
