import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaff } from '@/lib/utils/apiAuth'
import { addStudentSchema } from '@/lib/validators/classes'
import type { AddStudentResponse } from '@/types/api.types'

// Adds a student to a class and invites their parent (SDD.md §3).
// The admin client is used ONLY for the auth invite + parent users-row —
// an auth.admin operation from a staff-only route, per CLAUDE.md §4.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStaff()
    if (!auth.ok) return auth.response
    const { supabase, userId, role } = auth.ctx
    const { id: classId } = await params

    const body = await request.json().catch(() => null)
    const result = addStudentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Enter the student name and a valid parent email' },
        { status: 400 }
      )
    }
    const { name, parentEmail } = result.data
    const email = parentEmail.toLowerCase()

    const { data: cls } = await supabase
      .from('classes')
      .select('id, teacher_id, center_id')
      .eq('id', classId)
      .maybeSingle()
    if (!cls) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (cls.teacher_id !== userId && role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // 1. Student + enrollment — through the RLS-scoped client
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({ center_id: cls.center_id, name })
      .select('id')
      .single()
    if (studentError || !student) {
      console.error('[students POST] insert student:', studentError?.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({ student_id: student.id, class_id: classId })
    if (enrollError) {
      console.error('[students POST] enrollment:', enrollError.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // 2. Parent account: reuse if the email already has one, else invite
    const admin = createAdminClient()
    let guardianId: string | null = null

    const { data: existingParent } = await admin
      .from('users')
      .select('id, role')
      .eq('email', email)
      .maybeSingle()

    if (existingParent) {
      // A staff email can never double as a guardian login
      guardianId = existingParent.role === 'parent' ? existingParent.id : null
    } else {
      const { data: invited, error: inviteError } =
        await admin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
        })
      if (inviteError || !invited.user) {
        console.error('[students POST] invite:', inviteError?.message)
      } else {
        const { error: userRowError } = await admin.from('users').insert({
          id: invited.user.id,
          email,
          name: `Parent of ${name}`,
          role: 'parent',
          center_id: null,
        })
        if (userRowError) {
          console.error('[students POST] parent users row:', userRowError.message)
        } else {
          guardianId = invited.user.id
        }
      }
    }

    // 3. Guardian link — parent invite failure never blocks the student save
    if (guardianId) {
      const { error: linkError } = await supabase
        .from('student_guardians')
        .insert({ student_id: student.id, guardian_id: guardianId })
      if (linkError) {
        console.error('[students POST] guardian link:', linkError.message)
      }
    }

    const response: AddStudentResponse = { studentId: student.id }
    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    console.error('[students POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
