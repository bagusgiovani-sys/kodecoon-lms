'use client'

import { ExternalLink, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { formatDate } from '@/lib/utils/formatDate'
import type { StudentDetailResponse } from '@/types/api.types'

interface StudentHistoryTabsProps {
  detail: StudentDetailResponse
}

// Attendance, lesson progress, videos, and notes on one screen — the record
// that ends parent disputes (PRD Student Detail).
export function StudentHistoryTabs({ detail }: StudentHistoryTabsProps) {
  const { t, locale } = useLanguage()
  const hasHistory =
    detail.attendance.length > 0 || detail.sessions.length > 0

  if (!hasHistory && detail.enrollments.length === 0) {
    return <EmptyState icon={History} message={t('noHistoryYet')} />
  }

  return (
    <Tabs defaultValue="progress">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="progress">{t('progressTab')}</TabsTrigger>
        <TabsTrigger value="attendance">{t('attendanceTab')}</TabsTrigger>
        <TabsTrigger value="videos">{t('videosTab')}</TabsTrigger>
        <TabsTrigger value="notes">{t('notesTab')}</TabsTrigger>
      </TabsList>

      <TabsContent value="progress" className="mt-4 grid gap-3 sm:grid-cols-2">
        {detail.enrollments.length === 0 ? (
          <EmptyState icon={History} message={t('notEnrolledYet')} />
        ) : (
          detail.enrollments.map((enrollment) => (
            <div key={enrollment.classId} className="rounded-xl border p-4">
              <p className="mb-2 text-sm font-semibold">{enrollment.className}</p>
              <Progress
                value={
                  enrollment.lessonsTotal > 0
                    ? (enrollment.lessonsCompleted / enrollment.lessonsTotal) * 100
                    : 0
                }
              />
              <p className="text-muted-foreground mt-2 text-xs">
                {enrollment.lessonsCompleted}/{enrollment.lessonsTotal}{' '}
                {t('lessonsProgress')}
              </p>
            </div>
          ))
        )}
      </TabsContent>

      <TabsContent value="attendance" className="mt-4">
        {detail.attendance.length === 0 ? (
          <EmptyState icon={History} message={t('noHistoryYet')} />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dateLabel')}</TableHead>
                  <TableHead>{t('attendanceTab')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.attendance.map((entry) => (
                  <TableRow key={`${entry.sessionId}-${entry.date}`}>
                    <TableCell>{formatDate(entry.date, locale)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.status === 'present'
                            ? 'default'
                            : entry.status === 'absent'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {entry.status === 'present'
                          ? t('present')
                          : entry.status === 'absent'
                            ? t('absent')
                            : t('unmarked')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="videos" className="mt-4 grid gap-2">
        {detail.sessions.filter((s) => s.videoLink).length === 0 ? (
          <EmptyState icon={History} message={t('noHistoryYet')} />
        ) : (
          detail.sessions
            .filter((session) => session.videoLink)
            .map((session) => (
              <a
                key={session.id}
                href={session.videoLink!}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-accent/50 flex items-center justify-between rounded-xl border p-3 text-sm"
              >
                <span>{formatDate(session.date, locale)}</span>
                <span className="text-primary flex items-center gap-1 text-xs">
                  {t('watchVideo')} <ExternalLink className="size-3" />
                </span>
              </a>
            ))
        )}
      </TabsContent>

      <TabsContent value="notes" className="mt-4 grid gap-2">
        {detail.sessions.filter((s) => s.notes).length === 0 ? (
          <EmptyState icon={History} message={t('noHistoryYet')} />
        ) : (
          detail.sessions
            .filter((session) => session.notes)
            .map((session) => (
              <div key={session.id} className="rounded-xl border p-3">
                <p className="text-muted-foreground mb-1 text-xs">
                  {formatDate(session.date, locale)}
                </p>
                <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
              </div>
            ))
        )}
      </TabsContent>
    </Tabs>
  )
}
