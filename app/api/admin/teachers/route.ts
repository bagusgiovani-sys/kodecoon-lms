import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, resolveActiveCenterId } from '@/lib/utils/apiAuth'
import { addTeacherSchema } from '@/lib/validators/admin'
import type { AddTeacherResponse, AdminTeachersResponse } from '@/types/api.types'

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
      .from('users')
      .select('id, name, email')
      .eq('role', 'teacher')
      .eq('center_id', centerId)
      .order('name')

    if (error) {
      console.error('[admin/teachers GET]', error.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: AdminTeachersResponse = { teachers: data ?? [] }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[admin/teachers GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// The ONLY way teacher accounts come into existence — no public signup form,
// by design (CLAUDE.md §11).
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const centerId = await resolveActiveCenterId(auth.ctx, request)
    if (!centerId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const result = addTeacherSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Enter a name and a valid email' },
        { status: 400 }
      )
    }
    const { name } = result.data
    const email = result.data.email.toLowerCase()

    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      })
    if (inviteError || !invited.user) {
      console.error('[admin/teachers POST] invite:', inviteError?.message)
      const alreadyExists = inviteError?.message
        ?.toLowerCase()
        .includes('already')
      return NextResponse.json(
        {
          error: alreadyExists
            ? 'A user with this email already exists'
            : 'Internal server error',
        },
        { status: alreadyExists ? 409 : 500 }
      )
    }

    const { error: rowError } = await admin.from('users').insert({
      id: invited.user.id,
      email,
      name,
      role: 'teacher',
      center_id: centerId,
    })
    if (rowError) {
      console.error('[admin/teachers POST] users row:', rowError.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: AddTeacherResponse = { userId: invited.user.id }
    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    console.error('[admin/teachers POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
