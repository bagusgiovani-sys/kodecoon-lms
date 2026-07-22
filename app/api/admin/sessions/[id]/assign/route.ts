import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/apiAuth'
import { assignSessionSchema } from '@/lib/validators/admin'
import type { AssignSessionResponse } from '@/types/api.types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth.ctx
    const { id: sessionId } = await params

    const body = await request.json().catch(() => null)
    const result = assignSessionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid teacher' }, { status: 400 })
    }
    const { teacherId } = result.data

    const { data: session } = await supabase
      .from('sessions')
      .select('id, classes!inner(center_id)')
      .eq('id', sessionId)
      .maybeSingle()
    if (!session) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Teacher must exist AND belong to the same center as the session's class
    const { data: teacher } = await supabase
      .from('users')
      .select('id, center_id')
      .eq('id', teacherId)
      .in('role', ['teacher', 'admin'])
      .maybeSingle()
    if (!teacher) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (teacher.center_id !== session.classes.center_id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('sessions')
      .update({ teacher_id: teacherId, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
    if (error) {
      console.error('[admin/assign PATCH]', error.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: AssignSessionResponse = { sessionId }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[admin/assign PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
