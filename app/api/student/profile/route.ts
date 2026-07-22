import { NextResponse } from 'next/server'
import { requireParent } from '@/lib/utils/apiAuth'
import { getInitials } from '@/lib/utils/initials'
import type { StudentProfileResponse } from '@/types/api.types'

// Parent-facing — every query below runs through the RLS-scoped client;
// the service-role client is NEVER used on this surface (CLAUDE.md §11).
export async function GET() {
  try {
    const auth = await requireParent()
    if (!auth.ok) return auth.response
    const { supabase, userId } = auth.ctx

    const { data: links, error: linksError } = await supabase
      .from('student_guardians')
      .select('student_id, students(id, name)')
      .eq('guardian_id', userId)

    if (linksError) {
      console.error('[student/profile GET]', linksError.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const students = (links ?? [])
      .map((link) => link.students)
      .filter((student): student is NonNullable<typeof student> => student !== null)

    const response: StudentProfileResponse = { students: [] }

    for (const student of students) {
      const [enrollmentsRes, progressRes, reportsRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select('class_id, classes(id, name)')
          .eq('student_id', student.id),
        supabase
          .from('student_lesson_progress')
          .select('lesson_id, lessons(class_id)')
          .eq('student_id', student.id)
          .eq('status', 'completed'),
        supabase
          .from('reports')
          .select('id, generated_date, final_pdf_url')
          .eq('student_id', student.id)
          .order('generated_date', { ascending: false }),
      ])

      const classIds = (enrollmentsRes.data ?? []).map((e) => e.class_id)
      const { data: lessons } = classIds.length
        ? await supabase
            .from('lessons')
            .select('id, class_id')
            .in('class_id', classIds)
        : { data: [] as Array<{ id: string; class_id: string }> }

      const totalByClass = new Map<string, number>()
      for (const lesson of lessons ?? []) {
        totalByClass.set(
          lesson.class_id,
          (totalByClass.get(lesson.class_id) ?? 0) + 1
        )
      }
      const completedByClass = new Map<string, number>()
      for (const row of progressRes.data ?? []) {
        const classId = row.lessons?.class_id
        if (classId) {
          completedByClass.set(classId, (completedByClass.get(classId) ?? 0) + 1)
        }
      }

      const activePrograms: StudentProfileResponse['students'][number]['activePrograms'] =
        []
      const completedPrograms: StudentProfileResponse['students'][number]['completedPrograms'] =
        []

      for (const enrollment of enrollmentsRes.data ?? []) {
        if (!enrollment.classes) continue
        const total = totalByClass.get(enrollment.class_id) ?? 0
        const completed = completedByClass.get(enrollment.class_id) ?? 0
        // A program is completed only when it has lessons and all are done
        if (total > 0 && completed >= total) {
          completedPrograms.push({
            classId: enrollment.class_id,
            className: enrollment.classes.name,
          })
        } else {
          activePrograms.push({
            classId: enrollment.class_id,
            className: enrollment.classes.name,
            lessonsCompleted: completed,
            lessonsTotal: total,
          })
        }
      }

      response.students.push({
        id: student.id,
        name: student.name,
        avatarInitials: getInitials(student.name),
        activePrograms,
        completedPrograms,
        reports: (reportsRes.data ?? [])
          .filter((report) => report.final_pdf_url !== null)
          .map((report) => ({
            id: report.id,
            generatedDate: report.generated_date,
            pdfUrl: report.final_pdf_url!,
          })),
      })
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[student/profile GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
