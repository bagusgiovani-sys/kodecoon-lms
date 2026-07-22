import { CenterProvider } from '@/components/admin/CenterProvider'
import { CenterSwitcher } from '@/components/admin/CenterSwitcher'
import { AppNav } from '@/components/shared/AppNav'
import { requireAdminPage } from '@/lib/utils/pageAuth'

// (admin) route group — role: admin only, with the Center Switcher persistent
// in the header on every /admin/* route (PRD). One center in v1, but the
// scoping pattern exists from day one.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { supabase, name } = await requireAdminPage()

  const { data: centers } = await supabase
    .from('centers')
    .select('id, name, country')
    .order('name')

  return (
    <CenterProvider centers={centers ?? []}>
      <AppNav role="admin" userName={name} />
      <div className="border-border/60 border-b">
        <div className="mx-auto flex max-w-6xl justify-end px-4 py-2">
          <CenterSwitcher />
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </CenterProvider>
  )
}
