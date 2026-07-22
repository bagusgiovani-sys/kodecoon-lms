import { PortalNav } from '@/components/student-portal/PortalNav'
import { requireParentPage } from '@/lib/utils/pageAuth'

// (student) route group — role: parent only (CLAUDE.md §4). Strictly
// read-only in v1; every query inside runs through the RLS-scoped client,
// never the service role (CLAUDE.md §11).
export default async function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireParentPage()

  return (
    <>
      <PortalNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  )
}
