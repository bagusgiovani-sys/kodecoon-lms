import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaff } from '@/lib/utils/apiAuth'
import { exportReportSchema } from '@/lib/validators/reports'
import { getStudentClassSummary } from '@/lib/reports/summary'
import { renderReportPdf } from '@/lib/reports/reportPdf'
import { todayIsoDate } from '@/lib/utils/formatDate'
import type { ExportReportResponse } from '@/types/api.types'

// PDFs live in the private 'reports' storage bucket (see
// supabase/storage-setup.sql). One-year signed URLs — reports are minors'
// data, the bucket is never public.
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 365

// React PDF rendering is CPU-bound and runs before two storage round-trips,
// so this route can also exceed Vercel's default function window.
export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStaff()
    if (!auth.ok) return auth.response
    const { supabase } = auth.ctx
    const { id: studentId } = await params

    const body = await request.json().catch(() => null)
    const result = exportReportSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Report text cannot be empty' },
        { status: 400 }
      )
    }
    const { classId, finalText, templateId } = result.data

    const summary = await getStudentClassSummary(supabase, studentId, classId)
    if (!summary) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const generatedDate = todayIsoDate()
    const pdfBuffer = await renderReportPdf({
      studentName: summary.studentName,
      className: summary.className,
      lessonsCompleted: summary.lessonsCompleted,
      lessonsTotal: summary.lessonsTotal,
      attendanceSummary: summary.attendanceSummary,
      finalText,
      generatedDate,
    })

    // Storage write via the admin client — staff-only route, and storage
    // policies aren't part of schema.sql. Reads still go through signed URLs.
    const admin = createAdminClient()
    const storagePath = `${studentId}/${Date.now()}.pdf`
    const { error: uploadError } = await admin.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf' })
    if (uploadError) {
      console.error('[report/export] upload:', uploadError.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const { data: signed, error: signError } = await admin.storage
      .from('reports')
      .createSignedUrl(storagePath, SIGNED_URL_SECONDS)
    if (signError || !signed) {
      console.error('[report/export] sign:', signError?.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        student_id: studentId,
        class_id: classId,
        template_id: templateId,
        raw_notes: null,
        ai_draft_text: null,
        final_text: finalText,
        final_pdf_url: signed.signedUrl,
        generated_date: generatedDate,
      })
      .select('id')
      .single()

    if (insertError || !report) {
      console.error('[report/export] insert:', insertError?.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const response: ExportReportResponse = {
      reportId: report.id,
      pdfUrl: signed.signedUrl,
    }
    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    console.error('[report/export]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
