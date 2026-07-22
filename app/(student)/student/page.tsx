import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { requireParentPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'

// Portal hub: one linked child → straight to their profile (PRD login flow).
// Multiple children also land on the first — the switcher lives on the
// profile itself.
export default async function StudentHubPage() {
  const { supabase, userId } = await requireParentPage()

  const { data: links } = await supabase
    .from('student_guardians')
    .select('student_id, students(id, name)')
    .eq('guardian_id', userId)
    .order('created_at', { ascending: true })

  const linked = (links ?? []).filter((link) => link.students !== null)

  if (linked.length > 0) {
    redirect(`/student/${linked[0].student_id}`)
  }

  const t = await getT()
  return <EmptyState icon={Users} message={t('portalNoStudent')} />
}
