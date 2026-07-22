'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarX2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import { useCenter } from '@/components/admin/CenterProvider'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { fetchJson } from '@/lib/utils/fetchJson'
import { formatDate, formatTime } from '@/lib/utils/formatDate'
import type {
  AdminScheduleResponse,
  AdminTeachersResponse,
  AssignSessionResponse,
} from '@/types/api.types'

interface TeacherAssignGridProps {
  initialSessions: AdminScheduleResponse
  initialTeachers: AdminTeachersResponse
}

// Academy Schedule: every session across every teacher in the active center,
// assign ANY teacher to ANY session (PRD admin epic).
export function TeacherAssignGrid({
  initialSessions,
  initialTeachers,
}: TeacherAssignGridProps) {
  const { t, locale } = useLanguage()
  const { activeCenterId } = useCenter()
  const queryClient = useQueryClient()

  const sessionsQuery = useQuery({
    queryKey: ['admin-schedule', activeCenterId],
    queryFn: () =>
      fetchJson<AdminScheduleResponse>(
        `/api/admin/schedule?centerId=${activeCenterId}`
      ),
    initialData: initialSessions,
  })

  const teachersQuery = useQuery({
    queryKey: ['admin-teachers', activeCenterId],
    queryFn: () =>
      fetchJson<AdminTeachersResponse>(
        `/api/admin/teachers?centerId=${activeCenterId}`
      ),
    initialData: initialTeachers,
  })

  const assignMutation = useMutation({
    mutationFn: ({
      sessionId,
      teacherId,
    }: {
      sessionId: string
      teacherId: string
    }) =>
      fetchJson<AssignSessionResponse>(`/api/admin/sessions/${sessionId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ teacherId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedule'] })
      toast.success(t('teacherAssigned'))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('genericError'))
    },
  })

  const sessions = sessionsQuery.data?.sessions ?? []
  const teachers = teachersQuery.data?.teachers ?? []

  if (sessions.length === 0) {
    return <EmptyState icon={CalendarX2} message={t('noSessionsYet')} />
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('dateLabel')}</TableHead>
            <TableHead>{t('timeLabel')}</TableHead>
            <TableHead>{t('classLabel')}</TableHead>
            <TableHead>{t('assignTeacher')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="whitespace-nowrap">
                {formatDate(session.date, locale)}
              </TableCell>
              <TableCell>{formatTime(session.time) ?? '—'}</TableCell>
              <TableCell className="font-medium">{session.className}</TableCell>
              <TableCell>
                <Select
                  value={session.teacherId}
                  onValueChange={(teacherId) => {
                    if (teacherId) {
                      assignMutation.mutate({ sessionId: session.id, teacherId })
                    }
                  }}
                  disabled={assignMutation.isPending}
                >
                  <SelectTrigger size="sm" className="min-w-40">
                    <SelectValue>{session.teacherName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
