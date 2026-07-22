import { notFound } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProgramCard } from '@/components/student-portal/ProgramCard'
import { ReportsList } from '@/components/student-portal/ReportsList'
import { StudentSwitcher } from '@/components/student-portal/StudentSwitcher'
import { requireParentPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'
import { getInitials } from '@/lib/utils/initials'

// Student Profile — the parent-side hub: avatar, program cards, reports,
// journey one tap away (PRD). Same queries as GET /api/student/profile;
// RLS guarantees this parent can only ever see their own linked student.
export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { supabase, userId } = await requireParentPage()
  const { studentId } = await params
  const t = await getT()

  const { data: links } = await supabase
    .from('student_guardians')
    .select('student_id, students(id, name)')
    .eq('guardian_id', userId)
    .order('created_at', { ascending: true })

  const linked = (links ?? [])
    .filter((link) => link.students !== null)
    .map((link) => ({ id: link.students!.id, name: link.students!.name }))

  const student = linked.find((s) => s.id === studentId)
  if (!student) notFound()

  const [enrollmentsRes, progressRes, reportsRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select('class_id, classes(id, name)')
      .eq('student_id', student.id),
    supabase
      .from('student_lesson_progress')
      .select('lesson_id, lessons(class_id)')
      .eq('student_id', student.id)
      .eq('status', 'completed'),
    supabase
      .from('reports')
      .select('id, generated_date, final_pdf_url')
      .eq('student_id', student.id)
      .order('generated_date', { ascending: false }),
  ])

  const classIds = (enrollmentsRes.data ?? []).map((e) => e.class_id)
  const { data: lessons } = classIds.length
    ? await supabase.from('lessons').select('id, class_id').in('class_id', classIds)
    : { data: [] as Array<{ id: string; class_id: string }> }

  const totalByClass = new Map<string, number>()
  for (const lesson of lessons ?? []) {
    totalByClass.set(lesson.class_id, (totalByClass.get(lesson.class_id) ?? 0) + 1)
  }
  const completedByClass = new Map<string, number>()
  for (const row of progressRes.data ?? []) {
    const classId = row.lessons?.class_id
    if (classId) {
      completedByClass.set(classId, (completedByClass.get(classId) ?? 0) + 1)
    }
  }

  const activePrograms: Array<{
    classId: string
    className: string
    lessonsCompleted: number
    lessonsTotal: number
  }> = []
  const completedPrograms: Array<{ classId: string; className: string }> = []

  for (const enrollment of enrollmentsRes.data ?? []) {
    if (!enrollment.classes) continue
    const total = totalByClass.get(enrollment.class_id) ?? 0
    const completed = completedByClass.get(enrollment.class_id) ?? 0
    // A program is completed only when it has lessons and all are done
    if (total > 0 && completed >= total) {
      completedPrograms.push({
        classId: enrollment.class_id,
        className: enrollment.classes.name,
      })
    } else {
      activePrograms.push({
        classId: enrollment.class_id,
        className: enrollment.classes.name,
        lessonsCompleted: completed,
        lessonsTotal: total,
      })
    }
  }

  const reports = (reportsRes.data ?? [])
    .filter((report) => report.final_pdf_url !== null)
    .map((report) => ({
      id: report.id,
      generatedDate: report.generated_date,
      pdfUrl: report.final_pdf_url!,
    }))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {student.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('studentProfileTitle')}
            </p>
          </div>
        </div>
        <StudentSwitcher students={linked} activeStudentId={student.id} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
          {t('activePrograms')}
        </h2>
        {activePrograms.length === 0 && completedPrograms.length === 0 ? (
          <EmptyState icon={GraduationCap} message={t('notEnrolledYet')} />
        ) : activePrograms.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('notEnrolledYet')}</p>
        ) : (
          <div className="grid gap-3">
            {activePrograms.map((program, index) => (
              <ProgramCard
                key={program.classId}
                studentId={student.id}
                classId={program.classId}
                className={program.className}
                lessonsCompleted={program.lessonsCompleted}
                lessonsTotal={program.lessonsTotal}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      {completedPrograms.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t('completedPrograms')}
          </h2>
          <div className="grid gap-3">
            {completedPrograms.map((program, index) => (
              <ProgramCard
                key={program.classId}
                studentId={student.id}
                classId={program.classId}
                className={program.className}
                completed
                index={index}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
          {t('reportsHeading')}
        </h2>
        <ReportsList reports={reports} />
      </section>
    </div>
  )
}
