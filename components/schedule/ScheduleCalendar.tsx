'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { todayIsoDate } from '@/lib/utils/formatDate'
import { cn } from '@/lib/utils'
import type { ScheduleResponse } from '@/types/api.types'

type ScheduleSession = ScheduleResponse['sessions'][number]

interface ScheduleCalendarProps {
  sessions: ScheduleSession[]
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Month grid of the teacher's own sessions. Scheduled sessions link into Log
// Session; completed ones badge as done (PRD My Schedule).
export function ScheduleCalendar({ sessions }: ScheduleCalendarProps) {
  const { t, locale } = useLanguage()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const sessionsByDate = new Map<string, ScheduleSession[]>()
  for (const session of sessions) {
    const list = sessionsByDate.get(session.date) ?? []
    list.push(session)
    sessionsByDate.set(session.date, list)
  }

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = todayIsoDate()

  const cells: Array<{ day: number; iso: string } | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      return {
        day,
        iso: `${monthKey(cursor)}-${String(day).padStart(2, '0')}`,
      }
    }),
  ]

  const monthLabel = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-SG', {
    month: 'long',
    year: 'numeric',
  }).format(cursor)

  const weekdayFormatter = new Intl.DateTimeFormat(
    locale === 'id' ? 'id-ID' : 'en-SG',
    { weekday: 'short' }
  )
  // 2024-01-01 was a Monday — a stable anchor for weekday labels
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    weekdayFormatter.format(new Date(2024, 0, 1 + i))
  )

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-px p-2 text-center">
        {weekdays.map((weekday) => (
          <div
            key={weekday}
            className="text-muted-foreground py-1 text-[10px] font-medium uppercase"
          >
            {weekday}
          </div>
        ))}
        {cells.map((cell, index) =>
          cell === null ? (
            <div key={`empty-${index}`} />
          ) : (
            <div
              key={cell.iso}
              className={cn(
                'min-h-16 rounded-md p-1 text-left align-top',
                cell.iso === today && 'bg-accent/60'
              )}
            >
              <span
                className={cn(
                  'text-xs',
                  cell.iso === today
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground'
                )}
              >
                {cell.day}
              </span>
              <div className="mt-0.5 flex flex-col gap-0.5">
                {(sessionsByDate.get(cell.iso) ?? []).map((session) => (
                  <Link
                    key={session.id}
                    href={`/classes/${session.classId}/sessions/new?sessionId=${session.id}`}
                    className="block"
                  >
                    <Badge
                      variant={
                        session.status === 'completed' ? 'secondary' : 'default'
                      }
                      className="w-full justify-start truncate text-[10px]"
                      title={`${session.className}${session.time ? ` · ${session.time.slice(0, 5)}` : ''}`}
                    >
                      {session.className}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )
        )}
      </div>
      <div className="text-muted-foreground flex gap-4 border-t p-2 px-3 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="bg-primary size-2 rounded-full" /> {t('sessionScheduled')}
        </span>
        <span className="flex items-center gap-1">
          <span className="bg-secondary size-2 rounded-full" /> {t('sessionCompleted')}
        </span>
      </div>
    </div>
  )
}
