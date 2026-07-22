import { TeacherAssignGrid } from '@/components/admin/TeacherAssignGrid'
import { PageHeader } from '@/components/shared/PageHeader'
import { requireAdminPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'
import type {
  AdminScheduleResponse,
  AdminTeachersResponse,
} from '@/types/api.types'

// Academy Schedule — every session across every teacher in the center, the
// demo-ready view of the whole vision (PRD). Same queries as
// GET /api/admin/schedule and GET /api/admin/teachers.
export default async function AcademySchedulePage() {
  const { supabase, centerId } = await requireAdminPage()
  const t = await getT()

  const [sessionsRes, teachersRes] = await Promise.all([
    centerId
      ? supabase
          .from('sessions')
          .select(
            'id, teacher_id, class_id, session_date, session_time, users(name), classes!inner(name, center_id)'
          )
          .eq('classes.center_id', centerId)
          .order('session_date', { ascending: false })
          .order('session_time', { ascending: true })
      : Promise.resolve({ data: null }),
    centerId
      ? supabase
          .from('users')
          .select('id, name, email')
          .eq('role', 'teacher')
          .eq('center_id', centerId)
          .order('name')
      : Promise.resolve({ data: null }),
  ])

  const initialSessions: AdminScheduleResponse = {
    sessions: (sessionsRes.data ?? []).map((session) => ({
      id: session.id,
      teacherId: session.teacher_id,
      teacherName: session.users?.name ?? '',
      classId: session.class_id,
      className: session.classes.name,
      date: session.session_date,
      time: session.session_time,
    })),
  }
  const initialTeachers: AdminTeachersResponse = {
    teachers: teachersRes.data ?? [],
  }

  return (
    <>
      <PageHeader title={t('academyScheduleTitle')} />
      <TeacherAssignGrid
        initialSessions={initialSessions}
        initialTeachers={initialTeachers}
      />
    </>
  )
}
