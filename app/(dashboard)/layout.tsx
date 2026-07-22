import { AppNav } from '@/components/shared/AppNav'
import { requireStaffPage } from '@/lib/utils/pageAuth'

// (dashboard) route group — role: teacher or admin (CLAUDE.md §4)
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { role, name } = await requireStaffPage()

  return (
    <>
      <AppNav role={role === 'admin' ? 'admin' : 'teacher'} userName={name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  )
}
