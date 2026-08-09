import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/utils/apiAuth'
import { logSessionSchema } from '@/lib/validators/sessions'
import { validateDriveFile } from '@/lib/drive/driveClient'
import { todayIsoDate } from '@/lib/utils/formatDate'
import type { LogSessionResponse } from '@/types/api.types'

// The core write of the whole app (SDD.md §3): attendance + video + lesson
// completion + notes in one submit. Write order per SDD — the video insert is
// wrapped separately and NEVER blocks the rest (PRD edge case).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStaff()
    if (!auth.ok) return auth.response
    const { supabase, userId, role } = auth.ctx
    const { id: sessionId } = await params

    const body = await request.json().catch(() => null)
    const result = logSessionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 400 })
    }
    const { attendance, video, notes, lessonCompletions } = result.data

    const { data: session } = await supabase
      .from('sessions')
      .select('id, teacher_id, class_id')
      .eq('id', sessionId)
      .maybeSingle()
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (session.teacher_id !== userId && role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Scope every client-sent id to THIS session's class before writing
    // (CLAUDE.md §4). Owning the session is not enough: without this a
    // teacher could post an arbitrary studentId and write attendance or
    // lesson progress onto another family's child, which that child's
    // parent would then read in the Journey and the generated report.
    const [enrolledRes, classLessonsRes] = await Promise.all([
      supabase.from('enrollments').select('student_id').eq('class_id', session.class_id),
      supabase.from('lessons').select('id').eq('class_id', session.class_id),
    ])
    if (enrolledRes.error || classLessonsRes.error) {
      console.error(
        '[log PATCH] scope lookup:',
        enrolledRes.error?.message ?? classLessonsRes.error?.message
      )
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    const enrolledIds = new Set((enrolledRes.data ?? []).map((e) => e.student_id))
    const classLessonIds = new Set((classLessonsRes.data ?? []).map((l) => l.id))

    const strayStudent =
      attendance.find((entry) => !enrolledIds.has(entry.studentId)) ??
      lessonCompletions.find((entry) => !enrolledIds.has(entry.studentId))
    if (strayStudent) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    if (lessonCompletions.some((entry) => !classLessonIds.has(entry.lessonId))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // 1. Session-level fields
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
    if (sessionError) {
      console.error('[log PATCH] session update:', sessionError.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // 2. Attendance upsert
    if (attendance.length > 0) {
      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert(
          attendance.map((entry) => ({
            session_id: sessionId,
            student_id: entry.studentId,
            status: entry.status,
          })),
          { onConflict: 'session_id,student_id' }
        )
      if (attendanceError) {
        console.error('[log PATCH] attendance:', attendanceError.message)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    // 3. Video — separately wrapped, failure logged but non-blocking
    if (video) {
      try {
        const check = await validateDriveFile(video.driveFileId)
        if (!check.ok) {
          console.warn('[log PATCH] Drive link not reachable, saving anyway:', video.driveFileId)
        }
        const { error: videoError } = await supabase.from('session_videos').insert({
          session_id: sessionId,
          drive_file_id: video.driveFileId,
          drive_link: video.driveLink,
        })
        if (videoError) {
          console.error('[log PATCH] video insert (non-blocking):', videoError.message)
        }
      } catch (videoErr) {
        console.error('[log PATCH] video step (non-blocking):', videoErr)
      }
    }

    // 4. Lesson completion upsert — timestamped and tied to this session
    if (lessonCompletions.length > 0) {
      const { error: progressError } = await supabase
        .from('student_lesson_progress')
        .upsert(
          lessonCompletions.map((entry) => ({
            student_id: entry.studentId,
            lesson_id: entry.lessonId,
            status: 'completed',
            session_id: sessionId,
            completed_date: todayIsoDate(),
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'student_id,lesson_id' }
        )
      if (progressError) {
        console.error('[log PATCH] progress:', progressError.message)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    const response: LogSessionResponse = { sessionId, status: 'completed' }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[log PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
