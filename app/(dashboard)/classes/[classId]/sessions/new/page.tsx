import { notFound, redirect } from 'next/navigation'
import { LogSessionForm } from '@/components/session/LogSessionForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { requireStaffPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'
import { todayIsoDate } from '@/lib/utils/formatDate'

// Log Session — attendance + video + lesson completion + notes in one flow
// (PRD core epic). ?sessionId= comes from Dashboard/Schedule; otherwise
// today's scheduled session for this class is picked up, and if none exists
// the form creates one on submit.
export default async function LogSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ sessionId?: string }>
}) {
  const { supabase, userId, role } = await requireStaffPage()
  const { classId } = await params
  const { sessionId: requestedSessionId } = await searchParams
  const t = await getT()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, teacher_id')
    .eq('id', classId)
    .maybeSingle()
  if (!cls) notFound()
  if (cls.teacher_id !== userId && role !== 'admin') redirect('/dashboard')

  // Resolve the session being logged — a client-sent id is only honored if it
  // genuinely belongs to this class (CLAUDE.md §4)
  let session: { id: string; notes: string | null } | null = null
  if (requestedSessionId) {
    const { data } = await supabase
      .from('sessions')
      .select('id, notes, class_id')
      .eq('id', requestedSessionId)
      .eq('class_id', classId)
      .maybeSingle()
    session = data ? { id: data.id, notes: data.notes } : null
  }
  if (!session) {
    const { data } = await supabase
      .from('sessions')
      .select('id, notes')
      .eq('class_id', classId)
      .eq('session_date', todayIsoDate())
      .order('session_time', { ascending: true })
      .limit(1)
      .maybeSingle()
    session = data ?? null
  }

  const [enrollmentsRes, lessonsRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select('student_id, students(id, name)')
      .eq('class_id', classId),
    supabase
      .from('lessons')
      .select('id, sequence_number, title')
      .eq('class_id', classId)
      .order('sequence_number'),
  ])

  const students = (enrollmentsRes.data ?? [])
    .filter((e) => e.students !== null)
    .map((e) => ({ id: e.students!.id, name: e.students!.name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const lessons = (lessonsRes.data ?? []).map((lesson) => ({
    id: lesson.id,
    sequenceNumber: lesson.sequence_number,
    title: lesson.title,
  }))

  // Lessons already completed in earlier sessions — shown checked + locked
  const existingCompletions: Record<string, string[]> = {}
  if (students.length > 0 && lessons.length > 0) {
    const { data: progress } = await supabase
      .from('student_lesson_progress')
      .select('student_id, lesson_id')
      .in(
        'student_id',
        students.map((s) => s.id)
      )
      .in(
        'lesson_id',
        lessons.map((l) => l.id)
      )
      .eq('status', 'completed')
    for (const row of progress ?? []) {
      ;(existingCompletions[row.student_id] ??= []).push(row.lesson_id)
    }
  }

  return (
    <>
      <PageHeader title={t('logSessionTitle')} subtitle={cls.name} />
      <LogSessionForm
        classId={classId}
        sessionId={session?.id ?? null}
        students={students}
        lessons={lessons}
        existingCompletions={existingCompletions}
        initialNotes={session?.notes ?? null}
      />
    </>
  )
}
