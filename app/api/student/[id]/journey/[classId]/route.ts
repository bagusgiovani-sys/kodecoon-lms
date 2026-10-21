import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/utils/apiAuth'
import type { JourneyResponse } from '@/types/api.types'

// Ordered lesson nodes with per-student status — the snake-path data source.
// Parent (must own the link) OR teacher/admin (must own the class); RLS
// enforces both paths regardless of the app-level checks here.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; classId: string }> }
) {
  try {
    const auth = await getAuthContext()
    if (!auth.ok) return auth.response
    const { supabase, userId, role } = auth.ctx
    const { id: studentId, classId } = await params

    if (role === 'parent') {
      const { data: link } = await supabase
        .from('student_guardians')
        .select('id')
        .eq('student_id', studentId)
        .eq('guardian_id', userId)
        .maybeSingle()
      if (!link) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
    } else {
      const { data: cls } = await supabase
        .from('classes')
        .select('id, teacher_id')
        .eq('id', classId)
        .maybeSingle()
      if (!cls || (cls.teacher_id !== userId && role !== 'admin')) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
    }

    const { data: courseLink, error: courseLinkError } = process.env.LEARNING_UI_ENABLED === 'true'
      ? await supabase.from('class_course_assignments').select('course_id')
        .eq('class_id', classId).is('ended_at', null).maybeSingle()
      : { data: null, error: null }
    if (courseLinkError) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    const { data: activeCourse, error: courseError } = courseLink?.course_id
      ? await supabase.from('courses').select('id,title,lesson_count').eq('id', courseLink.course_id).maybeSingle()
      : { data: null, error: null }
    if (courseError) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    const { data: allLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, sequence_number, title, course_id')
      .eq('class_id', classId)
      .order('sequence_number')

    if (lessonsError) {
      console.error('[journey GET]', lessonsError.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    const mappedLessons = activeCourse
      ? (allLessons ?? []).filter((lesson) => lesson.course_id === activeCourse.id)
      : []
    const lessons = mappedLessons.length > 0 ? mappedLessons : (allLessons ?? [])
    if (lessons.length === 0) {
      // No lesson plan defined yet — the client renders the empty state,
      // not a broken path (PRD edge case)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const lessonIds = lessons.map((lesson) => lesson.id)
    const { data: progress, error: progressError } = await supabase
      .from('student_lesson_progress')
      .select('lesson_id, status, completed_date, notes, session_id')
      .eq('student_id', studentId)
      .in('lesson_id', lessonIds)

    if (progressError) {
      console.error('[journey GET] progress:', progressError.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const progressByLesson = new Map(
      (progress ?? []).map((row) => [row.lesson_id, row])
    )

    // Session videos for completed nodes (tap → date, video, notes)
    const sessionIds = [
      ...new Set(
        (progress ?? [])
          .map((row) => row.session_id)
          .filter((id): id is string => id !== null)
      ),
    ]
    const videoBySession = new Map<string, string>()
    if (sessionIds.length > 0) {
      const { data: videos } = await supabase
        .from('session_videos')
        .select('session_id, drive_link')
        .in('session_id', sessionIds)
      for (const video of videos ?? []) {
        videoBySession.set(video.session_id, video.drive_link)
      }
    }

    // Absent progress row = locked; the first non-completed node in sequence
    // is surfaced as 'unlocked' ("up next") for the path render
    let unlockedAssigned = false
    const response: JourneyResponse = {
      courseProgress: activeCourse ? {
        courseTitle: activeCourse.title,
        completed: lessons.filter((lesson) => progressByLesson.get(lesson.id)?.status === 'completed').length,
        total: activeCourse.lesson_count,
        mappedLessonCount: mappedLessons.length,
      } : null,
      lessons: lessons.map((lesson) => {
        const row = progressByLesson.get(lesson.id)
        let status: 'locked' | 'unlocked' | 'completed'
        if (row?.status === 'completed') {
          status = 'completed'
        } else if (row?.status === 'unlocked') {
          status = 'unlocked'
          unlockedAssigned = true
        } else if (!unlockedAssigned) {
          status = 'unlocked'
          unlockedAssigned = true
        } else {
          status = 'locked'
        }
        return {
          id: lesson.id,
          sequenceNumber: lesson.sequence_number,
          title: lesson.title,
          status,
          completedDate: row?.completed_date ?? null,
          videoLink: row?.session_id
            ? (videoBySession.get(row.session_id) ?? null)
            : null,
          notes: row?.notes ?? null,
        }
      }),
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[journey GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
