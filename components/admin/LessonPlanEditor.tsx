'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ListX, Pencil, Trash2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { createBrowserClient } from '@/lib/supabase/browser'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { fetchJson } from '@/lib/utils/fetchJson'
import type {
  AddLessonResponse,
  AdminLessonsResponse,
  DeleteLessonResponse,
  UpdateLessonResponse,
} from '@/types/api.types'

type Lesson = AdminLessonsResponse['lessons'][number]

interface LessonPlanEditorProps {
  classId: string
  initialLessons: AdminLessonsResponse
}

// The curriculum template every enrolled student's journey path is generated
// from (PRD). A lesson is live the moment it's created — no publish step.
export function LessonPlanEditor({ classId, initialLessons }: LessonPlanEditorProps) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState<Lesson | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [pendingDelete, setPendingDelete] = useState<{
    lesson: Lesson
    studentsAffected: number
  } | null>(null)

  const lessonsQuery = useQuery({
    queryKey: ['admin-lessons', classId],
    queryFn: () =>
      fetchJson<AdminLessonsResponse>(`/api/admin/classes/${classId}/lessons`),
    initialData: initialLessons,
  })
  const lessons = lessonsQuery.data?.lessons ?? []

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-lessons', classId] })
  }

  const addMutation = useMutation({
    mutationFn: () =>
      fetchJson<AddLessonResponse>(`/api/admin/classes/${classId}/lessons`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      setTitle('')
      setDescription('')
      invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('genericError'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (input: {
      lessonId: string
      title?: string
      description?: string
      sequenceNumber?: number
    }) =>
      fetchJson<UpdateLessonResponse>(`/api/admin/lessons/${input.lessonId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          sequenceNumber: input.sequenceNumber,
        }),
      }),
    onSuccess: () => {
      setEditing(null)
      invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('genericError'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) =>
      fetchJson<DeleteLessonResponse>(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      setPendingDelete(null)
      invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('genericError'))
    },
  })

  // PRD edge case: never silently orphan progress rows — count completions
  // (RLS-scoped read) and name the number in the warning BEFORE deleting
  async function requestDelete(lesson: Lesson) {
    try {
      const supabase = createBrowserClient()
      const { count } = await supabase
        .from('student_lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('lesson_id', lesson.id)
        .eq('status', 'completed')
      setPendingDelete({ lesson, studentsAffected: count ?? 0 })
    } catch {
      setPendingDelete({ lesson, studentsAffected: 0 })
    }
  }

  function move(lesson: Lesson, direction: -1 | 1) {
    const index = lessons.findIndex((l) => l.id === lesson.id)
    const neighbor = lessons[index + direction]
    if (!neighbor) return
    updateMutation.mutate({
      lessonId: lesson.id,
      sequenceNumber: neighbor.sequenceNumber,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          if (title.trim()) addMutation.mutate()
        }}
      >
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="lesson-title">{t('lessonTitleLabel')}</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lesson-description">{t('lessonDescriptionLabel')}</Label>
            <Textarea
              id="lesson-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <Button type="submit" disabled={addMutation.isPending}>
          {addMutation.isPending ? t('loading') : t('addLesson')}
        </Button>
      </form>

      {lessons.length === 0 ? (
        <EmptyState icon={ListX} message={t('noLessonsYet')} />
      ) : (
        <ol className="divide-border divide-y rounded-xl border">
          {lessons.map((lesson, index) => (
            <li key={lesson.id} className="flex items-center gap-3 p-3">
              <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {lesson.sequenceNumber}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{lesson.title}</p>
                {lesson.description ? (
                  <p className="text-muted-foreground truncate text-xs">
                    {lesson.description}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={index === 0 || updateMutation.isPending}
                  onClick={() => move(lesson, -1)}
                  aria-label={t('moveUp')}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={index === lessons.length - 1 || updateMutation.isPending}
                  onClick={() => move(lesson, 1)}
                  aria-label={t('moveDown')}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(lesson)
                    setEditTitle(lesson.title)
                    setEditDescription(lesson.description ?? '')
                  }}
                  aria-label={t('edit')}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => requestDelete(lesson)}
                  aria-label={t('deleteLesson')}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('edit')}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (editing && editTitle.trim()) {
                updateMutation.mutate({
                  lessonId: editing.id,
                  title: editTitle,
                  description: editDescription.trim() || undefined,
                })
              }
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="edit-title">{t('lessonTitleLabel')}</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">{t('lessonDescriptionLabel')}</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('loading') : t('saveLesson')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('deleteLesson')}: {pendingDelete?.lesson.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && pendingDelete.studentsAffected > 0
                ? t('deleteLessonWarning', {
                    count: pendingDelete.studentsAffected,
                  })
                : t('confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.lesson.id)
              }}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
