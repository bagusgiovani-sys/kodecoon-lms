'use client'

import { useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ApiRequestError, fetchJson } from '@/lib/utils/fetchJson'
import { feedbackContent } from '@/lib/validators/feedback'
import { feedbackRequest, feedbackRequestTarget, type FeedbackRequest } from '@/lib/utils/feedbackRequest'
import type { Tables } from '@/types/database.types'

type Draft = Tables<'student_feedback'>
type Publication = Pick<Tables<'published_feedback'>, 'id' | 'title' | 'strengths' | 'next_steps' | 'rating' | 'draft_revision' | 'published_at'> & { withdrawn_at?: string | null }
type ClassOption = { id: string; name: string }
type LessonOption = { id: string; class_id: string; title: string }
type Page<T> = { feedback: T[]; nextCursor: string | null }
const selectStyle = 'min-h-11 w-full min-w-0 rounded-lg border bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring'

function FeedbackText({ item }: { item: Pick<Draft, 'title' | 'strengths' | 'next_steps' | 'rating'> }) {
  return <div className="min-w-0 space-y-4 [overflow-wrap:anywhere]">
    <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-semibold">{item.title}</h3><span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">{item.rating}</span></div>
    <div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">What went well</p><p className="whitespace-pre-wrap text-sm leading-6">{item.strengths}</p></div>
    <div><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next steps</p><p className="whitespace-pre-wrap text-sm leading-6">{item.next_steps}</p></div>
  </div>
}

export function FeedbackPanel({ studentId, actorId, staff = false, classes = [], lessons = [] }: {
  studentId: string; actorId: string; staff?: boolean; classes?: ClassOption[]; lessons?: LessonOption[]
}) {
  const client = useQueryClient()
  const scope = ['feedback', actorId, studentId, staff ? 'staff' : 'family']
  const storageKey = `kodehub-feedback-pending:${actorId}:${studentId}`
  const pendingKey = [...scope, 'pending']
  const [editing, setEditing] = useState<Draft | 'new' | null>(null)
  const [selected, setSelected] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [message, setMessage] = useState('')
  const pending = useQuery({ queryKey: pendingKey, enabled: staff, retry: false, staleTime: Infinity, gcTime: 0,
    queryFn: () => {
      const saved = sessionStorage.getItem(storageKey)
      if (!saved) return null
      return feedbackRequest.parse(JSON.parse(saved))
    },
  })
  const list = useInfiniteQuery({ queryKey: [...scope, 'list'], initialPageParam: null as string | null, retry: false,
    queryFn: ({ pageParam }) => fetchJson<Page<Draft & Publication>>(`/api/${staff ? 'students' : 'student'}/${studentId}/feedback?limit=10${pageParam ? `&after=${pageParam}` : ''}`, { cache: 'no-store' }),
    getNextPageParam: page => page.nextCursor,
  })
  const history = useInfiniteQuery({ queryKey: [...scope, 'publications', selected?.id], enabled: staff && !!selected,
    initialPageParam: null as string | null, retry: false,
    queryFn: ({ pageParam }) => fetchJson<{ publications: Publication[]; nextCursor: string | null }>(`/api/feedback/${selected!.id}/publications?limit=10${pageParam ? `&after=${pageParam}` : ''}`, { cache: 'no-store' }),
    getNextPageParam: page => page.nextCursor,
  })
  const blocked = busy || (staff && (pending.isPending || pending.isError || !!pending.data))
  async function write(operation: FeedbackRequest) {
    if (lock.current) return
    lock.current = true; setBusy(true); setMessage('')
    try {
      // Persist the exact operation before sending. A lost response can be retried after refresh.
      sessionStorage.setItem(storageKey, JSON.stringify(operation))
      client.setQueryData(pendingKey, operation)
      const target = feedbackRequestTarget(studentId, operation)
      await fetchJson(target.url, { method: target.method, body: JSON.stringify(operation.body) })
      sessionStorage.removeItem(storageKey)
      client.setQueryData(pendingKey, null)
      setEditing(null); setSelected(null)
      setMessage(operation.kind === 'publish' ? 'Feedback shared with family.' : operation.kind === 'withdraw' ? 'Publication withdrawn from family view.' : 'Private draft saved.')
      await client.invalidateQueries({ queryKey: [...scope, 'list'] })
      await client.invalidateQueries({ queryKey: [...scope, 'publications'] })
    } catch (error) {
      // Definitive rejection is safe to discard; ambiguous failures retain the exact retry.
      if (error instanceof ApiRequestError && [400, 401, 403, 404, 409, 422].includes(error.status)) {
        sessionStorage.removeItem(storageKey); client.setQueryData(pendingKey, null)
        await client.invalidateQueries({ queryKey: [...scope, 'list'] })
        if (error.status === 409) setSelected(null)
      }
      setMessage(error instanceof Error ? error.message : 'Unable to save feedback.')
    } finally { lock.current = false; setBusy(false) }
  }
  const rows = list.data?.pages.flatMap(page => page.feedback) ?? []
  return <section aria-label="Teacher feedback" className="my-6 min-w-0 space-y-5 rounded-2xl border bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-semibold"><MessageSquare className="size-5 text-primary" />Teacher feedback</h2><p className="mt-1 text-sm text-muted-foreground">{staff ? 'Save privately, then choose what to share with family.' : 'Achievements and next steps shared by your teacher.'}</p></div>
      {staff && <Button className="min-h-11" disabled={blocked || !classes.length || !!editing} onClick={() => { setEditing('new'); setSelected(null) }}><Plus />Write feedback</Button>}</div>
    {message && <p role="status" className="rounded-lg border p-3 text-sm [overflow-wrap:anywhere]">{message}</p>}
    {staff && pending.isError && <p role="alert">Unable to recover the last operation from this tab. <Button variant="outline" className="min-h-11" onClick={() => void pending.refetch()}>Retry recovery</Button></p>}
    {staff && pending.data && <div className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-4"><p className="text-sm">A feedback operation is awaiting confirmation. Retry it before making another change.</p><Button className="min-h-11" disabled={busy} onClick={() => void write(pending.data!)}>{busy ? 'Saving…' : 'Retry last operation'}</Button></div>}
    {staff && !classes.length && <p className="text-sm text-muted-foreground">New feedback requires an enrolled class you manage. Existing feedback remains available below.</p>}
    {editing && <FeedbackEditor key={editing === 'new' ? 'new' : `${editing.id}:${editing.revision}`} draft={editing === 'new' ? undefined : editing} classes={classes} lessons={lessons} disabled={blocked}
      close={() => setEditing(null)} save={operation => void write(operation)} />}
    {list.isPending && <p role="status">Loading feedback…</p>}
    {list.isError && <div role="alert"><p>Unable to load feedback.</p><Button variant="outline" className="mt-2 min-h-11" onClick={() => void list.refetch()}>Retry loading feedback</Button></div>}
    {!list.isPending && !list.isError && <>
      {!rows.length && <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">{staff ? 'No feedback drafts yet. Start with a specific achievement and a helpful next step.' : 'Feedback will appear here when your teacher shares it.'}</p>}
      <div className="grid gap-4 lg:grid-cols-2">{rows.map(row => <article key={row.id} className="min-w-0 rounded-xl border bg-background/40 p-4">
        <p className="mb-3 text-xs text-muted-foreground">{staff ? `Private draft · Version ${row.revision}` : `Shared ${new Date(row.published_at).toLocaleDateString()}`}</p><FeedbackText item={row} />
        {staff && <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" className="min-h-11" disabled={blocked || !!editing} onClick={() => { setEditing(row); setSelected(null) }}>Edit draft</Button><Button variant="outline" className="min-h-11" disabled={blocked || !!editing} onClick={() => setSelected(row)}>Review sharing</Button></div>}
      </article>)}</div>
      {list.hasNextPage && <Button variant="outline" className="min-h-11" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>Load more feedback</Button>}
    </>}
    {selected && !list.isError && <div className="space-y-4 rounded-xl border border-primary/40 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Sharing preview · Version {selected.revision}</h3><Button variant="ghost" className="min-h-11" disabled={busy} onClick={() => setSelected(null)}>Close preview</Button></div>
      <FeedbackText item={selected} /><p className="text-sm text-muted-foreground">Sharing creates a copy for the family. Later draft edits stay private. Earlier shared versions remain visible until you withdraw them.</p>
      <Button className="min-h-11" disabled={blocked || history.isPending || history.isError || history.isFetching || history.hasNextPage || history.data?.pages.some(page => page.publications.some(item => item.draft_revision === selected.revision))} onClick={() => void write({kind:'publish',id:selected.id,body:{requestId:crypto.randomUUID(),expectedRevision:selected.revision}})}>Share this version</Button>
      <h4 className="border-t pt-4 text-sm font-semibold">Publication history</h4>
      {history.isPending && <p role="status">Loading publications…</p>}
      {history.isError && <div role="alert">Unable to load publication history. <Button variant="outline" className="min-h-11" onClick={() => void history.refetch()}>Retry history</Button></div>}
      {!history.isError && history.data?.pages.flatMap(page => page.publications).map(item => <article key={item.id} className="space-y-3 rounded-lg border bg-card p-4">
        <p className="text-sm font-medium">Version {item.draft_revision} · {item.withdrawn_at ? 'Withdrawn' : 'Shared with family'} · {new Date(item.published_at).toLocaleDateString()}</p><FeedbackText item={item} />
        {!item.withdrawn_at && <Button variant="outline" className="min-h-11" disabled={blocked} onClick={() => void write({kind:'withdraw',id:item.id,body:{requestId:crypto.randomUUID(),expectedRevision:item.draft_revision}})}>Withdraw from family</Button>}
      </article>)}
      {!history.isPending && !history.isError && !history.data?.pages.some(page => page.publications.length) && <p className="text-sm text-muted-foreground">No versions shared yet.</p>}
      {history.hasNextPage && <Button variant="outline" className="min-h-11" disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>Load more publications</Button>}
      {history.data?.pages.some(page => page.publications.some(item => item.draft_revision === selected.revision)) && <p className="text-sm text-muted-foreground">This version has already been shared. Save a new draft version before sharing again.</p>}
    </div>}
  </section>
}

function FeedbackEditor({ draft, classes, lessons, disabled, close, save }: {
  draft?: Draft; classes: ClassOption[]; lessons: LessonOption[]; disabled: boolean; close: () => void; save: (operation: FeedbackRequest) => void
}) {
  const [classId, setClassId] = useState(draft?.class_id ?? classes[0]?.id ?? '')
  const [error, setError] = useState('')
  const prefix = `feedback-${draft?.id ?? 'new'}`
  const choices = lessons.filter(lesson => lesson.class_id === classId)
  return <form className="grid gap-4 rounded-xl border bg-background/40 p-4" onSubmit={event => {
    event.preventDefault(); const fields = new FormData(event.currentTarget)
    const parsed = feedbackContent.safeParse({title:fields.get('title'),lessonId:fields.get('lessonId') || null,strengths:fields.get('strengths'),nextSteps:fields.get('nextSteps'),rating:fields.get('rating')})
    if (!parsed.success) { setError('Complete the title, achievements, next steps, and confidence level.'); return }
    setError('')
    save(draft ? {kind:'edit',id:draft.id,body:{requestId:crypto.randomUUID(),expectedRevision:draft.revision,content:parsed.data}}
      : {kind:'create',body:{id:crypto.randomUUID(),classId,requestId:crypto.randomUUID(),expectedRevision:0,content:parsed.data}})
  }}>
    <h3 className="font-semibold">{draft ? 'Edit private draft' : 'New private draft'}</h3>
    <fieldset disabled={disabled} className="grid min-w-0 gap-4">
      {!draft && <div className="grid gap-2 text-sm"><label htmlFor={`${prefix}-class`}>Class</label><select id={`${prefix}-class`} className={selectStyle} value={classId} required onChange={e => setClassId(e.target.value)}>{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
      <div className="grid gap-2 text-sm"><label htmlFor={`${prefix}-title`}>Module / feedback title</label><Input id={`${prefix}-title`} name="title" required maxLength={200} defaultValue={draft?.title} className="min-h-11 text-base md:text-base" /></div>
      <div className="grid gap-2 text-sm"><label htmlFor={`${prefix}-lesson`}>Lesson (optional)</label><select key={classId} id={`${prefix}-lesson`} name="lessonId" className={selectStyle} defaultValue={draft?.lesson_id ?? ''}><option value="">General class feedback</option>{draft?.lesson_id && !choices.some(item => item.id === draft.lesson_id) && <option value={draft.lesson_id}>Previously linked lesson</option>}{choices.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
      <div className="grid gap-2 text-sm"><label htmlFor={`${prefix}-rating`}>Confidence level</label><select id={`${prefix}-rating`} name="rating" className={selectStyle} defaultValue={draft?.rating ?? 'Growing'}>{['Getting started','Growing','Confident','Independent'].map(rating => <option key={rating}>{rating}</option>)}</select></div>
      <div className="grid gap-2 text-sm"><label htmlFor={`${prefix}-strengths`}>What went well</label><Textarea id={`${prefix}-strengths`} name="strengths" rows={4} required maxLength={10000} defaultValue={draft?.strengths} className="text-base md:text-base" /></div>
      <div className="grid gap-2 text-sm"><label htmlFor={`${prefix}-next`}>Next steps</label><Textarea id={`${prefix}-next`} name="nextSteps" rows={3} required maxLength={10000} defaultValue={draft?.next_steps} className="text-base md:text-base" /></div>
    </fieldset>
    {error && <p role="alert" className="text-sm">{error}</p>}
    <p className="text-sm text-muted-foreground">Saving does not share this feedback with the family.</p>
    <div className="flex flex-wrap gap-3"><Button type="submit" className="min-h-11" disabled={disabled}>Save private draft</Button><Button type="button" variant="outline" className="min-h-11" disabled={disabled} onClick={close}>Cancel editing</Button></div>
  </form>
}
