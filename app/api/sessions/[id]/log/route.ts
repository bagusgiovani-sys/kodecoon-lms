import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/utils/apiAuth'
import { logSessionSchema } from '@/lib/validators/sessions'
import { validateDriveFile } from '@/lib/drive/driveClient'
import type { LogSessionResponse } from '@/types/api.types'

// Attendance, lesson progress, notes, and session status commit in one RLS-
// scoped database RPC. Drive validation/storage stays best-effort after commit.
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

    // This RPC revalidates enrollment/lesson scope after locking the session,
    // then applies all core writes in a single transaction. A retry safely
    // overwrites the same attendance/progress rows instead of double-writing.
    const { error: logError } = await supabase.rpc('log_session', {
      p_session_id: sessionId,
      p_notes: notes ?? null,
      p_attendance: attendance.map((entry) => ({
        studentId: entry.studentId,
        status: entry.status,
      })),
      p_lesson_completions: lessonCompletions.map((entry) => ({
        studentId: entry.studentId,
        lessonId: entry.lessonId,
      })),
    })
    if (logError) {
      if (logError.code === '42501') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
      console.error('[log PATCH] atomic session write:', logError.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Video validation and storage remain best-effort and do not roll back a
    // successfully logged session (PRD edge case).
    if (video) {
      try {
        const check = await validateDriveFile(video.driveFileId)
        if (!check.ok) {
          console.warn('[log PATCH] Drive link not reachable, saving anyway:', video.driveFileId)
        }
        const { error: videoError } = await supabase
          .from('session_videos')
          .upsert(
            {
              session_id: sessionId,
              drive_file_id: video.driveFileId,
              drive_link: video.driveLink,
            },
            { onConflict: 'session_id,drive_file_id' }
          )
        if (videoError) {
          console.error('[log PATCH] video insert (non-blocking):', videoError.message)
        }
      } catch (videoErr) {
        console.error('[log PATCH] video step (non-blocking):', videoErr)
      }
    }

    const response: LogSessionResponse = { sessionId, status: 'completed' }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[log PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
