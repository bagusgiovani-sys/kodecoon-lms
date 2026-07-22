import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/utils/apiAuth'
import { createClassSchema } from '@/lib/validators/classes'
import { todayIsoDate } from '@/lib/utils/formatDate'
import type { ClassListResponse, CreateClassResponse } from '@/types/api.types'

export async function GET() {
  try {
    const auth = await requireStaff()
    if (!auth.ok) return auth.response
    const { supabase, userId } = auth.ctx

    const { data, error } = await supabase
      .from('classes')
      .select('id, name, age_bracket, sessions(id, session_date, session_time)')
      .eq('teacher_id', userId)
      .eq('sessions.session_date', todayIsoDate())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[classes GET]', error.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: ClassListResponse = {
      classes: (data ?? []).map((cls) => {
        const today = cls.sessions[0] ?? null
        return {
          id: cls.id,
          name: cls.name,
          ageBracket: cls.age_bracket,
          todaySession: today
            ? {
                id: today.id,
                date: today.session_date,
                time: today.session_time,
              }
            : null,
        }
      }),
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[classes GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireStaff()
    if (!auth.ok) return auth.response
    const { supabase, userId, centerId } = auth.ctx

    const body = await request.json().catch(() => null)
    const result = createClassSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Enter a class name' }, { status: 400 })
    }
    if (!centerId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        center_id: centerId,
        teacher_id: userId,
        name: result.data.name,
        age_bracket: result.data.ageBracket ?? null,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[classes POST]', error?.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: CreateClassResponse = { id: data.id }
    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    console.error('[classes POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
