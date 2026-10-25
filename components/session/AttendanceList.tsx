'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AttendanceOptions } from './AttendanceOptions'
import { getInitials } from '@/lib/utils/initials'

export type AttendanceValue = Record<string, 'present' | 'mia' | 'excused' | 'absent' | undefined>

interface AttendanceListProps {
  students: Array<{ id: string; name: string }>
  value: AttendanceValue
  onChange: (value: AttendanceValue) => void
}

export function AttendanceList({ students, value, onChange }: AttendanceListProps) {
  return (
    <ul className="divide-border divide-y rounded-xl border">
      {students.map((student) => {
        const status = value[student.id]
        return (
          <li key={student.id} className="flex flex-wrap items-center gap-3 p-3">
            <Avatar className="size-9">
              <AvatarFallback className="text-xs">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {student.name}
            </span>
            <AttendanceOptions value={status ?? 'unmarked'} label={`Attendance for ${student.name}`}
              onChange={next => onChange({ ...value, [student.id]: next === 'unmarked' ? undefined : next })} />
          </li>
        )
      })}
    </ul>
  )
}
