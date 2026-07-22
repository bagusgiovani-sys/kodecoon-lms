'use client'

import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
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
import type { AdminTeachersResponse } from '@/types/api.types'

interface TeachersTableProps {
  initialTeachers: AdminTeachersResponse
}

// Teacher records for the active center — refetches on the same query key
// InviteTeacherDialog invalidates, so a fresh invite appears immediately.
export function TeachersTable({ initialTeachers }: TeachersTableProps) {
  const { t } = useLanguage()
  const { activeCenterId } = useCenter()

  const teachersQuery = useQuery({
    queryKey: ['admin-teachers', activeCenterId],
    queryFn: () =>
      fetchJson<AdminTeachersResponse>(
        `/api/admin/teachers?centerId=${activeCenterId}`
      ),
    initialData: initialTeachers,
  })

  const teachers = teachersQuery.data.teachers

  if (teachers.length === 0) {
    return <EmptyState icon={Users} message={t('noTeachersYet')} />
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('teacherNameLabel')}</TableHead>
            <TableHead>{t('teacherEmailLabel')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell className="font-medium">{teacher.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {teacher.email}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
