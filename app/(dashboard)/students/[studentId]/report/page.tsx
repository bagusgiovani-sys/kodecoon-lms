import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileX2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { ReportEditor } from '@/components/students/ReportEditor'
import { FeedbackStudentSelector } from '@/components/students/FeedbackStudentSelector'
import { requireStaffPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'

// Generate Report — rough notes → AI draft → human edit → PDF (PRD).
// The AI draft is never auto-exported; sparse data warns before drafting.
export default async function GenerateReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ classId?: string }>
}) {
  const { supabase } = await requireStaffPage()
  const { studentId } = await params
  const { classId: requestedClassId } = await searchParams
  const t = await getT()

  const { data: student } = await supabase
    .from('students')
    .select('id, name')
    .eq('id', studentId)
    .maybeSingle()
  if (!student) notFound()

  const { data: enrollments } = await supabase.from('enrollments').select('student_id, students(id,name), class_id, classes(id, name)')
  const rosterStudents=[...new Map((enrollments??[]).filter(row=>row.students).map(row=>[row.student_id,row.students!])).values()].sort((a,b)=>a.name.localeCompare(b.name))
  const studentEnrollments=(enrollments??[]).filter(row=>row.student_id===studentId)

  const programs = studentEnrollments.filter((e) => e.classes !== null)
  if (programs.length === 0) {
    return (
      <>
        <PageHeader title={t('reportTitle')} subtitle={student.name} />
        <EmptyState
          icon={FileX2}
          message={t('notEnrolledYet')}
          action={
            <Button variant="outline" render={<Link href={`/students/${studentId}`} />}>
              {t('back')}
            </Button>
          }
        />
      </>
    )
  }

  const program =
    programs.find((e) => e.class_id === requestedClassId) ?? programs[0]

  const [templateRes, attendanceRes, progressRes] = await Promise.all([
    supabase
      .from('report_templates')
      .select('id')
      .eq('is_default', true)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId),
    supabase
      .from('student_lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'completed'),
  ])

  // Fall back to any template if no default is flagged — export needs one
  let templateId = templateRes.data?.id ?? null
  if (!templateId) {
    const { data: anyTemplate } = await supabase
      .from('report_templates')
      .select('id')
      .limit(1)
      .maybeSingle()
    templateId = anyTemplate?.id ?? null
  }
  if (!templateId) notFound()

  const sparseData =
    (attendanceRes.count ?? 0) === 0 && (progressRes.count ?? 0) === 0

  return (
    <>
      <PageHeader
        title={t('reportTitle')}
        subtitle={`${student.name} · ${program.classes!.name}`}
      />
      <FeedbackStudentSelector students={rosterStudents.map(item=>({id:item.id,name:item.name}))} selected={studentId} />
      <ReportEditor
        studentId={studentId}
        classId={program.class_id}
        templateId={templateId}
        sparseData={sparseData}
      />
    </>
  )
}
