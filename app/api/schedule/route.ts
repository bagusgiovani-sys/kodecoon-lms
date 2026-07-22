import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/utils/apiAuth'
import type { ScheduleResponse } from '@/types/api.types'

export async function GET() {
  try {
    const auth = await requireStaff()
    if (!auth.ok) return auth.response
    const { supabase, userId } = auth.ctx

    const { data, error } = await supabase
      .from('sessions')
      .select('id, class_id, session_date, session_time, status, classes(name)')
      .eq('teacher_id', userId)
      .order('session_date', { ascending: false })
      .order('session_time', { ascending: true })

    if (error) {
      console.error('[schedule GET]', error.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: ScheduleResponse = {
      sessions: (data ?? []).map((session) => ({
        id: session.id,
        classId: session.class_id,
        className: session.classes?.name ?? '',
        date: session.session_date,
        time: session.session_time,
        status: session.status === 'completed' ? 'completed' : 'scheduled',
      })),
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[schedule GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
