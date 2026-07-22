import { InviteTeacherDialog } from '@/components/admin/InviteTeacherDialog'
import { TeachersTable } from '@/components/admin/TeachersTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { requireAdminPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'
import type { AdminTeachersResponse } from '@/types/api.types'

// Manage Teachers — records exist so classes/sessions can be assigned;
// whether those teachers log in day-to-day is a later, owner-gated decision
// (PRD). Initial data is scoped to the admin's own center; the client
// refetches against the Center Switcher's selection.
export default async function ManageTeachersPage() {
  const { supabase, centerId } = await requireAdminPage()
  const t = await getT()

  const { data } = centerId
    ? await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'teacher')
        .eq('center_id', centerId)
        .order('name')
    : { data: [] as Array<{ id: string; name: string; email: string }> }

  const initialTeachers: AdminTeachersResponse = { teachers: data ?? [] }

  return (
    <>
      <PageHeader
        title={t('manageTeachersTitle')}
        action={<InviteTeacherDialog />}
      />
      <TeachersTable initialTeachers={initialTeachers} />
    </>
  )
}
