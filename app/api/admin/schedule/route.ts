import { NextResponse } from 'next/server'
import { requireAdmin, resolveActiveCenterId } from '@/lib/utils/apiAuth'
import type { AdminScheduleResponse } from '@/types/api.types'

// Every session across every teacher in the active center — the demo-ready
// view of the whole vision (PRD).
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth.ctx

    const centerId = await resolveActiveCenterId(auth.ctx, request)
    if (!centerId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('sessions')
      .select(
        'id, teacher_id, class_id, session_date, session_time, users(name), classes!inner(name, center_id)'
      )
      .eq('classes.center_id', centerId)
      .order('session_date', { ascending: false })
      .order('session_time', { ascending: true })

    if (error) {
      console.error('[admin/schedule GET]', error.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: AdminScheduleResponse = {
      sessions: (data ?? []).map((session) => ({
        id: session.id,
        teacherId: session.teacher_id,
        teacherName: session.users?.name ?? '',
        classId: session.class_id,
        className: session.classes.name,
        date: session.session_date,
        time: session.session_time,
      })),
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[admin/schedule GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
