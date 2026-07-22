import { AddClassForm } from '@/components/classes/AddClassForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { requireStaffPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'

export default async function NewClassPage() {
  await requireStaffPage()
  const t = await getT()

  return (
    <>
      <PageHeader title={t('addClass')} />
      <AddClassForm />
    </>
  )
}
