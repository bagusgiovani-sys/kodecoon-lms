import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/utils/apiAuth'
import { createSessionSchema } from '@/lib/validators/sessions'
import type { CreateSessionResponse } from '@/types/api.types'

export async function POST(request: Request) {
  try {
    const auth = await requireStaff()
    if (!auth.ok) return auth.response
    const { supabase, userId, role } = auth.ctx

    const body = await request.json().catch(() => null)
    const result = createSessionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }
    const { classId, date, time } = result.data

    const { data: cls } = await supabase
      .from('classes')
      .select('id, teacher_id')
      .eq('id', classId)
      .maybeSingle()
    if (!cls || (cls.teacher_id !== userId && role !== 'admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        class_id: classId,
        teacher_id: cls.teacher_id,
        session_date: date,
        session_time: time ?? null,
        status: 'scheduled',
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[sessions POST]', error?.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: CreateSessionResponse = { sessionId: data.id }
    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    console.error('[sessions POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
