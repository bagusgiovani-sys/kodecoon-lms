import { notFound } from 'next/navigation'
import { LessonPlanEditor } from '@/components/admin/LessonPlanEditor'
import { PageHeader } from '@/components/shared/PageHeader'
import { requireAdminPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'
import type { AdminLessonsResponse } from '@/types/api.types'

// Manage Lesson Plan — the curriculum template every enrolled student's
// journey path is generated from (PRD). Same query as
// GET /api/admin/classes/:id/lessons.
export default async function ManageLessonPlanPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const { supabase } = await requireAdminPage()
  const { classId } = await params
  const t = await getT()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name')
    .eq('id', classId)
    .maybeSingle()
  if (!cls) notFound()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, sequence_number, title, description')
    .eq('class_id', classId)
    .order('sequence_number')

  const initialLessons: AdminLessonsResponse = {
    lessons: (lessons ?? []).map((lesson) => ({
      id: lesson.id,
      sequenceNumber: lesson.sequence_number,
      title: lesson.title,
      description: lesson.description,
    })),
  }

  return (
    <>
      <PageHeader title={t('manageLessonsTitle')} subtitle={cls.name} />
      <LessonPlanEditor classId={classId} initialLessons={initialLessons} />
    </>
  )
}
