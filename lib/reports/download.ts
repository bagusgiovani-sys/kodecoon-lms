import 'server-only'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthContext, requireStaff } from '@/lib/utils/apiAuth'

export async function downloadReport(id: string, published: boolean) {
  const auth = await (published ? getAuthContext() : requireStaff())
  if (!auth.ok) return auth.response
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }
  const { supabase } = auth.ctx
  // Resolve the path through caller RLS BEFORE touching privileged Storage.
  const query = published
    ? supabase.from('published_reports').select('pdf_storage_path').eq('id', id).is('withdrawn_at', null)
    : supabase.from('reports').select('pdf_storage_path, student_id').eq('id', id)
  const { data, error } = await query.maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to load report' }, { status: 500 })
  if (!data?.pdf_storage_path) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }
  if (!published && (!('student_id' in data) || data.pdf_storage_path !== `${data.student_id}/${id}.pdf`)) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }
  const { data: signed, error: signError } = await createAdminClient().storage
    .from('reports').createSignedUrl(data.pdf_storage_path, 60)
  if (signError || !signed) {
    return NextResponse.json({ error: 'Unable to load report' }, { status: 500 })
  }
  return NextResponse.redirect(signed.signedUrl, {
    status: 303,
    headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
  })
}
