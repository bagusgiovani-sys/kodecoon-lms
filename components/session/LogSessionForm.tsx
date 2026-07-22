'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AttendanceList,
  type AttendanceValue,
} from '@/components/session/AttendanceList'
import {
  LessonChecklist,
  type CompletionKey,
} from '@/components/session/LessonChecklist'
import { VideoPicker, type SessionVideo } from '@/components/session/VideoPicker'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { fetchJson } from '@/lib/utils/fetchJson'
import { todayIsoDate } from '@/lib/utils/formatDate'
import type {
  CreateSessionResponse,
  LogSessionRequest,
  LogSessionResponse,
} from '@/types/api.types'

interface LogSessionFormProps {
  classId: string
  // null → no session scheduled for today yet; one is created on submit
  sessionId: string | null
  students: Array<{ id: string; name: string }>
  lessons: Array<{ id: string; sequenceNumber: number; title: string }>
  existingCompletions: Record<string, string[]>
  initialNotes: string | null
}

interface DraftState {
  attendance: AttendanceValue
  video: SessionVideo | null
  notes: string
  completions: CompletionKey[]
}

// The core screen: attendance + video + lesson completion + notes in ONE
// submit (PRD). Draft persists to localStorage so a network drop mid-entry
// loses nothing.
export function LogSessionForm({
  classId,
  sessionId,
  students,
  lessons,
  existingCompletions,
  initialNotes,
}: LogSessionFormProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const queryClient = useQueryClient()

  const draftKey = `koms-session-draft-${sessionId ?? classId}`
  const [attendance, setAttendance] = useState<AttendanceValue>({})
  const [video, setVideo] = useState<SessionVideo | null>(null)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [completions, setCompletions] = useState<Set<CompletionKey>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const restored = useRef(false)

  // Restore an unsaved draft once, on mount (PRD: draft retained on refresh).
  // setState inside this effect is deliberate: localStorage is client-only, so
  // a lazy useState initializer would mismatch the server-rendered HTML.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    try {
      const raw = window.localStorage.getItem(draftKey)
      if (!raw) return
      const draft = JSON.parse(raw) as DraftState
      setAttendance(draft.attendance ?? {})
      setVideo(draft.video ?? null)
      setNotes(draft.notes ?? initialNotes ?? '')
      setCompletions(new Set(draft.completions ?? []))
      toast.info(t('draftRestored'))
    } catch {
      window.localStorage.removeItem(draftKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!restored.current) return
    const draft: DraftState = {
      attendance,
      video,
      notes,
      completions: [...completions],
    }
    window.localStorage.setItem(draftKey, JSON.stringify(draft))
  }, [attendance, video, notes, completions, draftKey])

  const mutation = useMutation({
    mutationFn: async () => {
      let targetSessionId = sessionId
      if (!targetSessionId) {
        const created = await fetchJson<CreateSessionResponse>('/api/sessions', {
          method: 'POST',
          body: JSON.stringify({ classId, date: todayIsoDate() }),
        })
        targetSessionId = created.sessionId
      }

      const payload: LogSessionRequest = {
        attendance: Object.entries(attendance)
          .filter(
            (entry): entry is [string, 'present' | 'absent'] =>
              entry[1] !== undefined
          )
          .map(([studentId, status]) => ({ studentId, status })),
        video: video
          ? { driveFileId: video.driveFileId, driveLink: video.driveLink }
          : undefined,
        notes: notes.trim() || undefined,
        lessonCompletions: [...completions].map((key) => {
          const [studentId, lessonId] = key.split(':')
          return { studentId, lessonId }
        }),
      }

      return fetchJson<LogSessionResponse>(
        `/api/sessions/${targetSessionId}/log`,
        { method: 'PATCH', body: JSON.stringify(payload) }
      )
    },
    onSuccess: () => {
      window.localStorage.removeItem(draftKey)
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['journey', classId] })
      toast.success(t('sessionLogged'))
      router.push('/dashboard')
      router.refresh()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('genericError'))
    },
  })

  function handleSubmit() {
    const anyMarked = Object.values(attendance).some((v) => v !== undefined)
    if (!anyMarked) {
      // Warn, don't block (PRD edge case)
      setConfirmOpen(true)
      return
    }
    mutation.mutate()
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
          {t('attendanceHeading')}
        </h2>
        <AttendanceList
          students={students}
          value={attendance}
          onChange={setAttendance}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
          {t('videoHeading')}
        </h2>
        <VideoPicker value={video} onChange={setVideo} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
          {t('lessonsHeading')}
        </h2>
        <LessonChecklist
          students={students}
          lessons={lessons}
          existingCompletions={existingCompletions}
          value={completions}
          onChange={setCompletions}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
          {t('notesHeading')}
        </h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('notesPlaceholder')}
          rows={4}
        />
      </section>

      <Button
        size="lg"
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="sticky bottom-4 shadow-lg"
      >
        {mutation.isPending ? t('loading') : t('submitSession')}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('attendanceHeading')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('noAttendanceWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                mutation.mutate()
              }}
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
