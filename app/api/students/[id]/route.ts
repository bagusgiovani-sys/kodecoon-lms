import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/utils/apiAuth'
import { getInitials } from '@/lib/utils/initials'
import type { StudentDetailResponse } from '@/types/api.types'

// One trustworthy record per student — the dispute-ending screen.
// Teacher (same center) OR parent (linked via student_guardians); RLS is the
// boundary either way — an unauthorized caller simply sees no student row.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext()
    if (!auth.ok) return auth.response
    const { supabase } = auth.ctx
    const { id: studentId } = await params

    const { data: student } = await supabase
      .from('students')
      .select('id, name')
      .eq('id', studentId)
      .maybeSingle()
    if (!student) {
      // RLS filtered it or it doesn't exist — same answer either way
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const [enrollmentsRes, attendanceRes, progressRes] = await Promise.all([
      supabase
        .from('enrollments')
        .select('class_id, classes(id, name)')
        .eq('student_id', studentId),
      supabase
        .from('attendance')
        .select('session_id, status, sessions(session_date)')
        .eq('student_id', studentId),
      supabase
        .from('student_lesson_progress')
        .select('lesson_id, status, lessons(class_id)')
        .eq('student_id', studentId)
        .eq('status', 'completed'),
    ])

    if (enrollmentsRes.error || attendanceRes.error || progressRes.error) {
      console.error(
        '[student GET]',
        enrollmentsRes.error?.message ??
          attendanceRes.error?.message ??
          progressRes.error?.message
      )
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const classIds = (enrollmentsRes.data ?? []).map((e) => e.class_id)
    const { data: lessons } = classIds.length
      ? await supabase.from('lessons').select('id, class_id').in('class_id', classIds)
      : { data: [] as Array<{ id: string; class_id: string }> }

    const lessonsTotalByClass = new Map<string, number>()
    for (const lesson of lessons ?? []) {
      lessonsTotalByClass.set(
        lesson.class_id,
        (lessonsTotalByClass.get(lesson.class_id) ?? 0) + 1
      )
    }
    const completedByClass = new Map<string, number>()
    for (const row of progressRes.data ?? []) {
      const classId = row.lessons?.class_id
      if (classId) {
        completedByClass.set(classId, (completedByClass.get(classId) ?? 0) + 1)
      }
    }

    // Session history: every session this student has an attendance row for
    const sessionIds = (attendanceRes.data ?? []).map((a) => a.session_id)
    const { data: sessions } = sessionIds.length
      ? await supabase
          .from('sessions')
          .select('id, session_date, notes, session_videos(drive_link)')
          .in('id', sessionIds)
          .order('session_date', { ascending: false })
      : {
          data: [] as Array<{
            id: string
            session_date: string
            notes: string | null
            session_videos: Array<{ drive_link: string }>
          }>,
        }

    const attendanceSorted = (attendanceRes.data ?? [])
      .map((a) => ({
        sessionId: a.session_id,
        date: a.sessions?.session_date ?? '',
        status: a.status,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))

    const response: StudentDetailResponse = {
      student: {
        id: student.id,
        name: student.name,
        avatarInitials: getInitials(student.name),
      },
      enrollments: (enrollmentsRes.data ?? [])
        .filter((e) => e.classes !== null)
        .map((e) => ({
          classId: e.class_id,
          className: e.classes!.name,
          lessonsCompleted: completedByClass.get(e.class_id) ?? 0,
          lessonsTotal: lessonsTotalByClass.get(e.class_id) ?? 0,
        })),
      attendance: attendanceSorted,
      sessions: (sessions ?? []).map((s) => ({
        id: s.id,
        date: s.session_date,
        videoLink: s.session_videos[0]?.drive_link ?? null,
        notes: s.notes,
      })),
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[student GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
