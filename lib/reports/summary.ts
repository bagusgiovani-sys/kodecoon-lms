import 'server-only'
import type { createServerClient } from '@/lib/supabase/server'

type SupabaseServer = Awaited<ReturnType<typeof createServerClient>>

export interface StudentClassSummary {
  studentName: string
  className: string
  lessonsTotal: number
  lessonsCompleted: number
  completedLessonTitles: string[]
  attendanceSummary: string
}

// Pulls the lesson-progress + attendance context both report endpoints need
// (SDD.md §3). All queries run through the RLS-scoped client. Returns null
// when the student/class isn't visible to the caller or isn't enrolled.
export async function getStudentClassSummary(
  supabase: SupabaseServer,
  studentId: string,
  classId: string
): Promise<StudentClassSummary | null> {
  const [studentRes, classRes, enrollmentRes] = await Promise.all([
    supabase.from('students').select('id, name').eq('id', studentId).maybeSingle(),
    supabase.from('classes').select('id, name').eq('id', classId).maybeSingle(),
    supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .maybeSingle(),
  ])

  if (!studentRes.data || !classRes.data || !enrollmentRes.data) return null

  const [lessonsRes, progressRes, attendanceRes] = await Promise.all([
    supabase.from('lessons').select('id, title').eq('class_id', classId),
    supabase
      .from('student_lesson_progress')
      .select('lesson_id, status')
      .eq('student_id', studentId)
      .eq('status', 'completed'),
    supabase
      .from('attendance')
      .select('status, sessions!inner(class_id)')
      .eq('student_id', studentId)
      .eq('sessions.class_id', classId),
  ])

  const lessons = lessonsRes.data ?? []
  const completedLessonIds = new Set(
    (progressRes.data ?? []).map((row) => row.lesson_id)
  )
  const completedLessons = lessons.filter((lesson) =>
    completedLessonIds.has(lesson.id)
  )

  const attendanceRows = attendanceRes.data ?? []
  const presentCount = attendanceRows.filter(
    (row) => row.status === 'present'
  ).length
  const markedCount = attendanceRows.filter(
    (row) => row.status !== 'unmarked'
  ).length
  const attendanceSummary =
    markedCount > 0
      ? `Attended ${presentCount} of ${markedCount} sessions`
      : 'No attendance recorded yet'

  return {
    studentName: studentRes.data.name,
    className: classRes.data.name,
    lessonsTotal: lessons.length,
    lessonsCompleted: completedLessons.length,
    completedLessonTitles: completedLessons.map((lesson) => lesson.title),
    attendanceSummary,
  }
}
