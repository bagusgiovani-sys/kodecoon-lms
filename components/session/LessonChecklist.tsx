'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

export type CompletionKey = `${string}:${string}` // studentId:lessonId

interface LessonChecklistProps {
  students: Array<{ id: string; name: string }>
  lessons: Array<{ id: string; sequenceNumber: number; title: string }>
  // lessons already completed in earlier sessions — shown checked + locked
  existingCompletions: Record<string, string[]>
  value: Set<CompletionKey>
  onChange: (value: Set<CompletionKey>) => void
}

// Mark lesson(s) complete per student, this session — updates
// student_lesson_progress and feeds the Journey (CLAUDE.md §1).
export function LessonChecklist({
  students,
  lessons,
  existingCompletions,
  value,
  onChange,
}: LessonChecklistProps) {
  const { t } = useLanguage()
  const [openStudent, setOpenStudent] = useState<string | null>(
    students[0]?.id ?? null
  )

  if (lessons.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
        {t('noLessonPlanYet')}
      </p>
    )
  }

  function toggle(studentId: string, lessonId: string) {
    const key: CompletionKey = `${studentId}:${lessonId}`
    const next = new Set(value)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    onChange(next)
  }

  return (
    <ul className="divide-border divide-y rounded-xl border">
      {students.map((student) => {
        const done = new Set(existingCompletions[student.id] ?? [])
        const markedNow = lessons.filter((lesson) =>
          value.has(`${student.id}:${lesson.id}`)
        ).length
        const open = openStudent === student.id

        return (
          <li key={student.id}>
            <button
              type="button"
              className="flex w-full items-center gap-2 p-3 text-left"
              onClick={() => setOpenStudent(open ? null : student.id)}
              aria-expanded={open}
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {student.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                {done.size + markedNow}/{lessons.length} {t('lessonsProgress')}
              </Badge>
              <ChevronDown
                className={cn(
                  'text-muted-foreground size-4 transition-transform',
                  open && 'rotate-180'
                )}
                aria-hidden
              />
            </button>
            {open ? (
              <ul className="grid gap-1 px-3 pb-3 sm:grid-cols-2">
                {lessons.map((lesson) => {
                  const already = done.has(lesson.id)
                  const key: CompletionKey = `${student.id}:${lesson.id}`
                  return (
                    <li key={lesson.id}>
                      <label
                        className={cn(
                          'hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                          already && 'text-muted-foreground cursor-default'
                        )}
                      >
                        <Checkbox
                          checked={already || value.has(key)}
                          disabled={already}
                          onCheckedChange={() => toggle(student.id, lesson.id)}
                        />
                        <span className="min-w-0 truncate">
                          {lesson.sequenceNumber}. {lesson.title}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
