import { notFound, redirect } from 'next/navigation'
import { AddStudentForm } from '@/components/students/AddStudentForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { requireStaffPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'

export default async function NewStudentPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const { supabase, userId, role } = await requireStaffPage()
  const { classId } = await params
  const t = await getT()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, teacher_id')
    .eq('id', classId)
    .maybeSingle()
  if (!cls) notFound()
  if (cls.teacher_id !== userId && role !== 'admin') redirect('/dashboard')

  return (
    <>
      <PageHeader title={t('addStudent')} subtitle={cls.name} />
      <AddStudentForm classId={classId} />
    </>
  )
}
