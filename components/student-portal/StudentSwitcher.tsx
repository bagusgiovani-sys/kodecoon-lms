'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

interface StudentSwitcherProps {
  students: Array<{ id: string; name: string }>
  activeStudentId: string
}

// Shown only when a parent has more than one linked child (PRD).
export function StudentSwitcher({ students, activeStudentId }: StudentSwitcherProps) {
  const router = useRouter()
  const { t } = useLanguage()

  if (students.length < 2) return null

  return (
    <Select
      value={activeStudentId}
      onValueChange={(id) => {
        if (id) router.push(`/student/${id}`)
      }}
    >
      <SelectTrigger size="sm" aria-label={t('switchStudent')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {students.map((student) => (
          <SelectItem key={student.id} value={student.id}>
            {student.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
