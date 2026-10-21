'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Check, Link2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/utils/fetchJson'
import type { CourseCurriculumMappingResponse } from '@/types/api.types'

type CourseLesson = { id: string; sequence: number; title: string; objective: string }
type ClassLesson = {
  id: string; sequence_number: number; title: string; description: string | null
  course_id: string | null; course_lesson_id: string | null
}
type MappingRequest = {
  courseId: string
  requestId: string
  mappings: Array<{ courseLessonId: string; lessonId: string | null }>
}

export function CurriculumMapper({
  classId,
  courseId,
  courseTitle,
  courseLessons,
  classLessons,
}: {
  classId: string
  courseId: string
  courseTitle: string
  courseLessons: CourseLesson[]
  classLessons: ClassLesson[]
}) {
  const router = useRouter()
  const mappedBySource = useMemo(() => new Map(classLessons
    .filter((lesson) => lesson.course_id === courseId && lesson.course_lesson_id)
    .map((lesson) => [lesson.course_lesson_id as string, lesson])), [classLessons, courseId])
  const unmapped = courseLessons.filter((lesson) => !mappedBySource.has(lesson.id))
  const availableClassLessons = classLessons.filter((lesson) => !lesson.course_lesson_id)
  const [choices, setChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(unmapped.map((lesson) => [lesson.id, 'create'])))
  const [pending, setPending] = useState<MappingRequest | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function saveMappings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const operation = pending ?? {
      courseId,
      requestId: crypto.randomUUID(),
      mappings: unmapped.map((lesson) => ({
        courseLessonId: lesson.id,
        lessonId: choices[lesson.id] && choices[lesson.id] !== 'create' ? choices[lesson.id] : null,
      })),
    }
    if (operation.mappings.length === 0) return
    const targets = operation.mappings.flatMap((mapping) => mapping.lessonId ? [mapping.lessonId] : [])
    if (!pending && new Set(targets).size !== targets.length) {
      setError('Choose a different existing journey lesson for each course lesson.')
      return
    }
    setPending(operation)
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const result = await fetchJson<CourseCurriculumMappingResponse>(
        `/api/classes/${classId}/course`,
        { method: 'POST', body: JSON.stringify(operation) },
      )
      setPending(null)
      setNotice(`${result.mappedCount} lesson${result.mappedCount === 1 ? '' : 's'} mapped; ${result.createdCount} new journey lesson${result.createdCount === 1 ? '' : 's'} added.`)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save these mappings.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="mt-6 space-y-5 rounded-2xl border bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-primary"><BookOpen className="size-4" />{courseTitle}</p>
        <h2 className="mt-1 text-xl font-semibold">Course to class journey</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Match course lessons to existing class lessons, or add new journey lessons. Matching preserves existing titles and completion history.
        </p>
      </div>
    </div>
    <form onSubmit={saveMappings} className="space-y-3">
      {courseLessons.map((lesson) => {
        const mapped = mappedBySource.get(lesson.id)
        return <article key={lesson.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,1fr)_minmax(250px,0.8fr)] md:items-center">
          <div className="flex min-w-0 items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{lesson.sequence}</span><div className="min-w-0"><h3 className="font-medium">{lesson.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{lesson.objective || 'No objective provided.'}</p></div></div>
          {mapped ? <div className="flex min-h-11 items-center gap-2 rounded-lg bg-primary/5 px-3 text-sm"><Link2 className="size-4 shrink-0 text-primary" /><span className="truncate">Journey {mapped.sequence_number}: {mapped.title}</span><Check className="ml-auto size-4 shrink-0 text-primary" /></div> : <label className="grid gap-2 text-sm"><span className="font-medium">Journey lesson</span><select aria-label={`Journey lesson for ${lesson.title}`} disabled={saving || !!pending} className="min-h-11 w-full rounded-lg border bg-background px-3" value={choices[lesson.id] ?? 'create'} onChange={(event) => setChoices((current) => ({ ...current, [lesson.id]: event.target.value }))}>
            <option value="create">Add as a new journey lesson</option>
            {availableClassLessons.map((row) => <option key={row.id} value={row.id}>{row.sequence_number}. {row.title}</option>)}
          </select></label>}
        </article>
      })}
      {courseLessons.length === 0 && <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">This course has no detailed lesson plans to map yet. Add them in the course workspace first.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}{pending ? ' Retry resends the exact same request.' : ''}</p>}
      {notice && <p role="status" className="text-sm text-primary">{notice}</p>}
      <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-6 text-muted-foreground">
        New lessons append after the current class plan. Matching an existing lesson only links it; it does not rename, reorder, or reset student progress.
      </p>
      <Button type="submit" disabled={saving || (!pending && unmapped.length === 0) || courseLessons.length === 0} className="min-h-11">
        {saving ? <><RefreshCw className="animate-spin" />Saving mappings…</> : pending ? <><RefreshCw />Retry mapping</> : <><Plus />Save lesson mappings</>}
      </Button>
    </form>
    {classLessons.length > 0 && <details className="rounded-xl border p-4"><summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">Existing class journey ({classLessons.length})</summary><ol className="mt-2 divide-y">{classLessons.map((lesson) => <li key={lesson.id} className="flex flex-wrap items-center gap-3 py-3 text-sm"><span className="w-8 text-primary">{lesson.sequence_number}.</span><span className="min-w-0 flex-1">{lesson.title}</span>{lesson.course_id === courseId && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary"><Link2 className="size-3" />Mapped</span>}</li>)}</ol></details>}
  </section>
}
