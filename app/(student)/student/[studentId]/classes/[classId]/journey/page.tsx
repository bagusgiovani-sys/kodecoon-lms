import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Map as MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JourneyPath } from '@/components/journey/JourneyPath'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Progress } from '@/components/ui/progress'
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

  const { data: courseLink } = process.env.LEARNING_UI_ENABLED === 'true'
    ? await supabase.from('class_course_assignments').select('course_id')
      .eq('class_id', classId).is('ended_at', null).maybeSingle()
    : { data: null }
  const { data: activeCourse } = courseLink?.course_id
    ? await supabase.from('courses').select('id,title,lesson_count')
      .eq('id', courseLink.course_id).maybeSingle()
    : { data: null }

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, sequence_number, title, course_id')
    .eq('class_id', classId)
    .order('sequence_number')

  const allLessons = lessons ?? []
  const mappedLessons = activeCourse
    ? allLessons.filter((lesson) => lesson.course_id === activeCourse.id)
    : []
  // Until staff maps the first course lesson, preserve the established class journey.
  const journeySource = mappedLessons.length > 0 ? mappedLessons : allLessons

  const backButton = (
    <Button variant="outline" render={<Link href={`/student/${studentId}`} />}>
      <ArrowLeft className="size-4" /> {t('journeyBack')}
    </Button>
  )

  if (journeySource.length === 0) {
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

  const lessonIds = journeySource.map((lesson) => lesson.id)
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
  const firstIncompleteIndex = journeySource.findIndex(
    (lesson) => progressByLesson.get(lesson.id)?.status !== 'completed'
  )
  const journeyLessons: JourneyResponse['lessons'] = journeySource.map(
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

  const completed = journeyLessons.filter((lesson) => lesson.status === 'completed').length
  const journeyTotal = activeCourse?.lesson_count ?? journeyLessons.length

  return (
    <>
      <PageHeader
        title={cls?.name ?? t('journeyTitle')}
        subtitle={[link.students?.name, activeCourse?.title].filter(Boolean).join(' · ')}
        action={backButton}
      />
      {activeCourse ? (
        <section className="mx-auto mb-6 w-full max-w-xl rounded-2xl border bg-card p-4 sm:p-5" aria-label={`${t('lessonProgressLabel')} ${completed}/${journeyTotal}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{t('lessonProgressLabel')} {completed}/{journeyTotal}</p>
            {mappedLessons.length > 0 ? <span className="text-xs text-muted-foreground">{mappedLessons.length} {t('mappedLessonsCount')}</span> : null}
          </div>
          <Progress className="mt-3" value={journeyTotal > 0 ? completed / journeyTotal * 100 : 0} />
        </section>
      ) : null}
      <JourneyPath lessons={journeyLessons} />
    </>
  )
}
