import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StudentHistoryTabs } from '@/components/students/StudentHistoryTabs'
import { requireStaffPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'
import { getInitials } from '@/lib/utils/initials'
import type { StudentDetailResponse } from '@/types/api.types'

// Student Detail — the one trustworthy record that ends parent disputes
// (PRD). Same queries as GET /api/students/:id; RLS scopes what this staff
// member can actually see.
export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { supabase } = await requireStaffPage()
  const { studentId } = await params
  const t = await getT()

  const { data: student } = await supabase
    .from('students')
    .select('id, name')
    .eq('id', studentId)
    .maybeSingle()
  if (!student) notFound()

  const [enrollmentsRes, attendanceRes, progressRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select('class_id, classes(id, name)')
      .eq('student_id', studentId),
    supabase
      .from('attendance')
      .select('session_id, status, sessions(session_date)')
      .eq('student_id', studentId),
    supabase
      .from('student_lesson_progress')
      .select('lesson_id, status, lessons(class_id)')
      .eq('student_id', studentId)
      .eq('status', 'completed'),
  ])

  const classIds = (enrollmentsRes.data ?? []).map((e) => e.class_id)
  const { data: lessons } = classIds.length
    ? await supabase.from('lessons').select('id, class_id').in('class_id', classIds)
    : { data: [] as Array<{ id: string; class_id: string }> }

  const lessonsTotalByClass = new Map<string, number>()
  for (const lesson of lessons ?? []) {
    lessonsTotalByClass.set(
      lesson.class_id,
      (lessonsTotalByClass.get(lesson.class_id) ?? 0) + 1
    )
  }
  const completedByClass = new Map<string, number>()
  for (const row of progressRes.data ?? []) {
    const classId = row.lessons?.class_id
    if (classId) {
      completedByClass.set(classId, (completedByClass.get(classId) ?? 0) + 1)
    }
  }

  const sessionIds = (attendanceRes.data ?? []).map((a) => a.session_id)
  const { data: sessions } = sessionIds.length
    ? await supabase
        .from('sessions')
        .select('id, session_date, notes, session_videos(drive_link)')
        .in('id', sessionIds)
        .order('session_date', { ascending: false })
    : {
        data: [] as Array<{
          id: string
          session_date: string
          notes: string | null
          session_videos: Array<{ drive_link: string }>
        }>,
      }

  const detail: StudentDetailResponse = {
    student: {
      id: student.id,
      name: student.name,
      avatarInitials: getInitials(student.name),
    },
    enrollments: (enrollmentsRes.data ?? [])
      .filter((e) => e.classes !== null)
      .map((e) => ({
        classId: e.class_id,
        className: e.classes!.name,
        lessonsCompleted: completedByClass.get(e.class_id) ?? 0,
        lessonsTotal: lessonsTotalByClass.get(e.class_id) ?? 0,
      })),
    attendance: (attendanceRes.data ?? [])
      .map((a) => ({
        sessionId: a.session_id,
        date: a.sessions?.session_date ?? '',
        status: a.status,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    sessions: (sessions ?? []).map((s) => ({
      id: s.id,
      date: s.session_date,
      videoLink: s.session_videos[0]?.drive_link ?? null,
      notes: s.notes,
    })),
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {detail.student.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {detail.student.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('studentDetailTitle')}
            </p>
          </div>
        </div>
        <Button render={<Link href={`/students/${studentId}/report`} />}>
          <FileText className="size-4" /> {t('generateReport')}
        </Button>
      </div>
      <StudentHistoryTabs detail={detail} />
    </>
  )
}
