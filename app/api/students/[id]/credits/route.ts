import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext } from '@/lib/utils/apiAuth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext()
  if (!auth.ok) return auth.response
  const { id } = await params
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const page = z.coerce.number().int().min(0).max(10000).safeParse(new URL(request.url).searchParams.get('page') ?? 0)
  if (!page.success) return NextResponse.json({ error: 'Invalid page' }, { status: 400 })
  const { supabase } = auth.ctx
  const { data: allowed, error: scopeError } = await supabase.rpc('can_read_credits', { p_student: id })
  if (scopeError) return NextResponse.json({ error: 'Unable to load credits' }, { status: 500 })
  if (!allowed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [account, entries] = await Promise.all([
    supabase.from('credit_accounts').select('balance, revision').eq('student_id', id).maybeSingle(),
    supabase.from('credit_entries').select('id, amount, kind, reason, session_id, effective_date, recorded_at, sessions(session_date)')
      .eq('student_id', id).order('recorded_at', { ascending: false }).order('id', { ascending: false })
      .range(page.data * 25, page.data * 25 + 25),
  ])
  if (account.error || entries.error) return NextResponse.json({ error: 'Unable to load credits' }, { status: 500 })
  return NextResponse.json({ balance: account.data?.balance ?? 0, revision: account.data?.revision ?? 0,
    entries: (entries.data ?? []).slice(0,25), hasMore: (entries.data?.length ?? 0) > 25 },
    { headers: { 'Cache-Control': 'private, no-store' } })
}
