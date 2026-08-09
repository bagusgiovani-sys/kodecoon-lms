import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/utils/apiAuth'
import { draftReportSchema } from '@/lib/validators/reports'
import { getStudentClassSummary } from '@/lib/reports/summary'
import { draftReportText } from '@/lib/ai/reportDraft'
import type { DraftReportResponse } from '@/types/api.types'

// Claude drafting is the one route that can outlive Vercel's default function
// window. Without this the platform kills the request before our own timeout
// fires, and the teacher gets a raw 504 instead of the "write it manually"
// fallback the PRD requires.
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
    const result = draftReportSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Write some notes first' }, { status: 400 })
    }
    const { classId, rawNotes } = result.data

    // Visibility through the RLS client doubles as the ownership check —
    // a student outside the requester's classes resolves to null
    const summary = await getStudentClassSummary(supabase, studentId, classId)
    if (!summary) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    try {
      const draftText = await draftReportText({ ...summary, rawNotes })
      const response: DraftReportResponse = { draftText }
      return NextResponse.json(response)
    } catch (aiErr) {
      // Claude API failure never blocks report creation (PRD edge case) —
      // the client falls back to manual writing
      console.error('[report/draft] Claude call failed:', aiErr)
      return NextResponse.json(
        { error: 'Couldn’t generate a draft — write the report manually' },
        { status: 502 }
      )
    }
  } catch (err) {
    console.error('[report/draft]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
