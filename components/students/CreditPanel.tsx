'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchJson } from '@/lib/utils/fetchJson'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

interface CreditHistory {
  balance: number
  hasMore: boolean
  entries: Array<{ id: string; amount: number; kind: string; reason: string; effective_date: string; recorded_at: string; sessions?: { session_date: string } | null }>
}

export function CreditPanel({ studentId, canAdjust = false }: { studentId: string; canAdjust?: boolean }) {
  const { locale } = useLanguage()
  const en = locale === 'en'
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [amount, setAmount] = useState('1')
  const [kind, setKind] = useState('top_up')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const query = useQuery({ queryKey: ['credits', studentId, page],
    queryFn: () => fetchJson<CreditHistory>(`/api/students/${studentId}/credits?page=${page}`) })
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { amount: Number(amount), kind, reason: reason.trim() }
      const signature = JSON.stringify(payload)
      const key = `kodehub-credit-request-${studentId}`
      let saved: { signature: string; requestId: string } | null = null
      try { saved = JSON.parse(localStorage.getItem(key) ?? 'null') } catch { /* Replace invalid retry metadata. */ }
      const requestId = saved?.signature === signature ? saved.requestId : crypto.randomUUID()
      localStorage.setItem(key, JSON.stringify({ signature, requestId }))
      return fetchJson(`/api/students/${studentId}/credit-adjustments`, { method: 'POST', body: JSON.stringify({ ...payload, requestId }) })
    },
    onSuccess: () => {
      localStorage.removeItem(`kodehub-credit-request-${studentId}`)
      setReason(''); setPage(0)
      setMessage(en ? 'Credit adjustment recorded.' : 'Penyesuaian kredit disimpan.')
      void queryClient.invalidateQueries({ queryKey: ['credits', studentId] })
    },
    onError: error => setMessage(error instanceof Error ? error.message : 'Unable to save credits'),
  })

  return <section className="my-6 grid gap-4 rounded-xl border bg-card p-4 sm:p-6" aria-label={en ? 'Session credits' : 'Kredit sesi'}>
    <h2 className="font-semibold">{en ? 'Session credits' : 'Kredit sesi'}</h2>
    {query.isPending ? <p>{en ? 'Loading credits…' : 'Memuat kredit…'}</p> : null}
    {query.isError ? <p role="alert">{en ? 'Unable to load credits.' : 'Tidak dapat memuat kredit.'}</p> : null}
    {query.data ? <><p className="text-2xl font-semibold">{query.data.balance} <span className="text-sm text-muted-foreground">{en ? 'credits remaining' : 'kredit tersisa'}</span></p>
      <p className="text-sm text-muted-foreground">{en ? 'One credit per attended session. Learning progress is tracked separately.' : 'Satu kredit per sesi yang dihadiri. Kemajuan belajar dicatat terpisah.'}</p>
      <ul className="grid gap-2">{query.data.entries.map(entry => <li key={entry.id} className="flex min-w-0 items-start justify-between gap-4 rounded-lg border p-3">
        <div className="min-w-0"><p className="break-words text-sm">{entry.reason}</p><p className="text-xs text-muted-foreground">{entry.effective_date}</p>
          <p className="text-xs text-muted-foreground">{en ? 'Recorded (UTC): ' : 'Dicatat (UTC): '}{entry.recorded_at.slice(0,10)}</p>
          {entry.sessions && entry.sessions.session_date !== entry.effective_date ? <p className="text-xs text-muted-foreground">{en ? 'Session now: ' : 'Jadwal sesi kini: '}{entry.sessions.session_date}</p> : null}
        </div>
        <span className="shrink-0 font-semibold">{entry.amount > 0 ? '+' : ''}{entry.amount}</span>
      </li>)}</ul>
      {!query.data.entries.length ? <p className="text-sm text-muted-foreground">{en ? 'No credit entries yet.' : 'Belum ada catatan kredit.'}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button className="min-h-11" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>{en ? 'Newer entries' : 'Catatan lebih baru'}</Button>
        <Button className="min-h-11" variant="outline" disabled={!query.data.hasMore} onClick={() => setPage(page + 1)}>{en ? 'Older entries' : 'Catatan lebih lama'}</Button>
      </div></> : null}
    {canAdjust ? <form className="grid gap-3 border-t pt-4" onSubmit={event => { event.preventDefault(); setMessage(''); mutation.mutate() }}>
      <p className="text-sm text-muted-foreground">{en ? 'Record verified credits only. This does not collect a payment.' : 'Catat kredit yang telah diverifikasi. Ini bukan pembayaran.'}</p>
      <Label htmlFor={`credit-kind-${studentId}`}>{en ? 'Entry type' : 'Jenis catatan'}</Label>
      <select id={`credit-kind-${studentId}`} className="min-h-11 rounded-md border bg-background px-3 text-base" value={kind} disabled={mutation.isPending} onChange={event => setKind(event.target.value)}>
        <option value="top_up">{en ? 'Top-up' : 'Tambah kredit'}</option><option value="adjustment">{en ? 'Correction' : 'Koreksi'}</option>
      </select>
      <Label htmlFor={`credit-amount-${studentId}`}>{en ? 'Credit change (negative for a correction deduction)' : 'Perubahan kredit (negatif untuk pengurangan)'}</Label>
      <Input className="min-h-11 text-base" id={`credit-amount-${studentId}`} type="number" step="1" min={kind === 'top_up' ? 1 : -10000} max={10000} value={amount} required disabled={mutation.isPending} onChange={event => setAmount(event.target.value)} />
      <Label htmlFor={`credit-reason-${studentId}`}>{en ? 'Reason / reference' : 'Alasan / referensi'}</Label>
      <Input className="min-h-11 text-base" id={`credit-reason-${studentId}`} value={reason} maxLength={500} required disabled={mutation.isPending} onChange={event => setReason(event.target.value)} />
      <Button className="min-h-11 justify-self-start" type="submit" disabled={mutation.isPending || !reason.trim() || Number(amount) === 0}>{en ? 'Record credit change' : 'Simpan perubahan kredit'}</Button>
    </form> : null}
    {message ? <p role="status" className="text-sm">{message}</p> : null}
  </section>
}
