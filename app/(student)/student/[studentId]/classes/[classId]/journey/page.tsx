import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Map as MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JourneyPath } from '@/components/journey/JourneyPath'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { requireParentPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'
import type { JourneyResponse } from '@/types/api.types'

// Journey — the snake-path visualization of the curriculum (PRD's
// highest-attention surface). Same queries and status derivation as
// GET /api/student/:id/journey/:classId.
export default async function JourneyPage({
  params,
}: {
  params: Promise<{ studentId: string; classId: string }>
}) {
  const { supabase, userId } = await requireParentPage()
  const { studentId, classId } = await params
  const t = await getT()

  // The parent must own the link — never trust the URL (CLAUDE.md §4)
  const { data: link } = await supabase
    .from('student_guardians')
    .select('id, students(name)')
    .eq('student_id', studentId)
    .eq('guardian_id', userId)
    .maybeSingle()
  if (!link) notFound()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name')
    .eq('id', classId)
    .maybeSingle()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, sequence_number, title')
    .eq('class_id', classId)
    .order('sequence_number')

  const backButton = (
    <Button variant="outline" render={<Link href={`/student/${studentId}`} />}>
      <ArrowLeft className="size-4" /> {t('journeyBack')}
    </Button>
  )

  if (!lessons || lessons.length === 0) {
    // No lesson plan defined yet → empty state, not a broken path (PRD)
    return (
      <>
        <PageHeader
          title={cls?.name ?? t('journeyTitle')}
          subtitle={link.students?.name}
        />
        <EmptyState icon={MapIcon} message={t('journeyEmpty')} action={backButton} />
      </>
    )
  }

  const lessonIds = lessons.map((lesson) => lesson.id)
  const { data: progress } = await supabase
    .from('student_lesson_progress')
    .select('lesson_id, status, completed_date, notes, session_id')
    .eq('student_id', studentId)
    .in('lesson_id', lessonIds)

  const progressByLesson = new Map(
    (progress ?? []).map((row) => [row.lesson_id, row])
  )

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
  // is surfaced as 'unlocked' ("up next")
  const firstIncompleteIndex = lessons.findIndex(
    (lesson) => progressByLesson.get(lesson.id)?.status !== 'completed'
  )
  const journeyLessons: JourneyResponse['lessons'] = lessons.map(
    (lesson, index) => {
    const row = progressByLesson.get(lesson.id)
    const status: 'locked' | 'unlocked' | 'completed' =
      row?.status === 'completed'
        ? 'completed'
        : row?.status === 'unlocked' || index === firstIncompleteIndex
          ? 'unlocked'
          : 'locked'
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
  })

  return (
    <>
      <PageHeader
        title={cls?.name ?? t('journeyTitle')}
        subtitle={link.students?.name}
        action={backButton}
      />
      <JourneyPath lessons={journeyLessons} />
    </>
  )
}
