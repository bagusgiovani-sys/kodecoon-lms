'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { getInitials } from '@/lib/utils/initials'
import { cn } from '@/lib/utils'

export type AttendanceValue = Record<string, 'present' | 'absent' | undefined>

interface AttendanceListProps {
  students: Array<{ id: string; name: string }>
  value: AttendanceValue
  onChange: (value: AttendanceValue) => void
}

// Present/absent toggle per student, defaulting to unmarked (PRD acceptance
// criteria) — optimistic local state, persisted on the single submit.
export function AttendanceList({ students, value, onChange }: AttendanceListProps) {
  const { t } = useLanguage()

  function setStatus(studentId: string, status: 'present' | 'absent') {
    onChange({
      ...value,
      // Tapping the active state again un-marks the student
      [studentId]: value[studentId] === status ? undefined : status,
    })
  }

  return (
    <ul className="divide-border divide-y rounded-xl border">
      {students.map((student) => {
        const status = value[student.id]
        return (
          <li key={student.id} className="flex items-center gap-3 p-3">
            <Avatar className="size-9">
              <AvatarFallback className="text-xs">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {student.name}
            </span>
            <div className="flex gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={status === 'present' ? 'default' : 'outline'}
                className={cn(status === 'present' && 'shadow-sm')}
                onClick={() => setStatus(student.id, 'present')}
                aria-pressed={status === 'present'}
              >
                {t('present')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={status === 'absent' ? 'destructive' : 'outline'}
                onClick={() => setStatus(student.id, 'absent')}
                aria-pressed={status === 'absent'}
              >
                {t('absent')}
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
