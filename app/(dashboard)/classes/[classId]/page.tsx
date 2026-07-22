import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ListChecks, NotebookPen, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { requireStaffPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'

// Class Roster — students and their lesson progress at a glance (PRD).
// Same queries as GET /api/classes/:id/roster.
export default async function ClassRosterPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const { supabase, userId, role } = await requireStaffPage()
  const { classId } = await params
  const t = await getT()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, age_bracket, teacher_id')
    .eq('id', classId)
    .maybeSingle()
  if (!cls) notFound()
  if (cls.teacher_id !== userId && role !== 'admin') redirect('/dashboard')

  const [enrollmentsRes, lessonsRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select('student_id, students(id, name)')
      .eq('class_id', classId),
    supabase.from('lessons').select('id').eq('class_id', classId),
  ])

  const lessonIds = (lessonsRes.data ?? []).map((lesson) => lesson.id)
  const studentIds = (enrollmentsRes.data ?? []).map((e) => e.student_id)

  // Derived, never stored (CLAUDE.md §6)
  const completedByStudent = new Map<string, number>()
  if (lessonIds.length > 0 && studentIds.length > 0) {
    const { data: progress } = await supabase
      .from('student_lesson_progress')
      .select('student_id, lesson_id')
      .in('student_id', studentIds)
      .in('lesson_id', lessonIds)
      .eq('status', 'completed')
    for (const row of progress ?? []) {
      completedByStudent.set(
        row.student_id,
        (completedByStudent.get(row.student_id) ?? 0) + 1
      )
    }
  }

  const students = (enrollmentsRes.data ?? [])
    .filter((e) => e.students !== null)
    .map((e) => ({
      id: e.students!.id,
      name: e.students!.name,
      lessonsCompleted: completedByStudent.get(e.student_id) ?? 0,
      lessonsTotal: lessonIds.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const addStudentButton = (
    <Button
      variant="outline"
      render={<Link href={`/classes/${classId}/students/new`} />}
    >
      <UserPlus className="size-4" /> {t('addStudent')}
    </Button>
  )

  return (
    <>
      <PageHeader
        title={cls.name}
        subtitle={cls.age_bracket ?? undefined}
        action={
          <>
            {role === 'admin' ? (
              <Button
                variant="ghost"
                render={<Link href={`/admin/classes/${classId}/lessons`} />}
              >
                <ListChecks className="size-4" /> {t('manageLessonsTitle')}
              </Button>
            ) : null}
            {addStudentButton}
            <Button render={<Link href={`/classes/${classId}/sessions/new`} />}>
              <NotebookPen className="size-4" /> {t('logSession')}
            </Button>
          </>
        }
      />
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          message={t('noStudentsYet')}
          action={addStudentButton}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('studentNameLabel')}</TableHead>
                <TableHead className="w-1/2">{t('lessonsProgress')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Link
                      href={`/students/${student.id}`}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {student.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress
                        className="max-w-40"
                        value={
                          student.lessonsTotal > 0
                            ? (student.lessonsCompleted / student.lessonsTotal) *
                              100
                            : 0
                        }
                      />
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {student.lessonsCompleted}/{student.lessonsTotal}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
