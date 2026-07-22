import { CalendarDays } from 'lucide-react'
import { AddSessionDialog } from '@/components/schedule/AddSessionDialog'
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { requireStaffPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'
import type { ScheduleResponse } from '@/types/api.types'

// My Schedule — this teacher's own sessions only, never academy-wide (PRD).
// Same query as GET /api/schedule.
export default async function SchedulePage() {
  const { supabase, userId } = await requireStaffPage()
  const t = await getT()

  const [sessionsRes, classesRes] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, class_id, session_date, session_time, status, classes(name)')
      .eq('teacher_id', userId)
      .order('session_date', { ascending: true }),
    supabase
      .from('classes')
      .select('id, name')
      .eq('teacher_id', userId)
      .order('name'),
  ])

  const sessions: ScheduleResponse['sessions'] = (sessionsRes.data ?? []).map(
    (session) => ({
      id: session.id,
      classId: session.class_id,
      className: session.classes?.name ?? '',
      date: session.session_date,
      time: session.session_time,
      status: session.status === 'completed' ? 'completed' : 'scheduled',
    })
  )
  const classes = classesRes.data ?? []

  return (
    <>
      <PageHeader
        title={t('scheduleTitle')}
        action={classes.length > 0 ? <AddSessionDialog classes={classes} /> : null}
      />
      {sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          message={t('noSessionsYet')}
          action={
            classes.length > 0 ? <AddSessionDialog classes={classes} /> : null
          }
        />
      ) : (
        <ScheduleCalendar sessions={sessions} />
      )}
    </>
  )
}
