import Link from 'next/link'
import { GraduationCap, NotebookPen, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { requireStaffPage } from '@/lib/utils/pageAuth'
import { getT } from '@/lib/i18n/server'
import { formatTime, todayIsoDate } from '@/lib/utils/formatDate'

// My Classes — every class this teacher teaches, with today's session one tap
// away (PRD Dashboard). Same query as GET /api/classes.
export default async function DashboardPage() {
  const { supabase, userId } = await requireStaffPage()
  const t = await getT()

  const { data } = await supabase
    .from('classes')
    .select('id, name, age_bracket, sessions(id, session_date, session_time)')
    .eq('teacher_id', userId)
    .eq('sessions.session_date', todayIsoDate())
    .order('created_at', { ascending: false })

  const classes = data ?? []

  return (
    <>
      <PageHeader
        title={t('dashboardTitle')}
        action={
          <Button render={<Link href="/classes/new" />} variant="outline">
            <Plus className="size-4" /> {t('addClass')}
          </Button>
        }
      />
      {classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          message={t('noClassesYet')}
          action={
            <Button render={<Link href="/classes/new" />}>
              <Plus className="size-4" /> {t('addClass')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const today = cls.sessions[0] ?? null
            return (
              <Card key={cls.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <Link href={`/classes/${cls.id}`} className="hover:text-primary min-w-0 truncate transition-colors">
                      {cls.name}
                    </Link>
                    {cls.age_bracket ? (
                      <Badge variant="secondary" className="shrink-0">
                        {cls.age_bracket}
                      </Badge>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-3">
                  {today ? (
                    <>
                      <p className="text-muted-foreground text-xs">
                        {t('todaySession')}
                        {today.session_time
                          ? ` · ${formatTime(today.session_time)}`
                          : ''}
                      </p>
                      <Button
                        render={
                          <Link
                            href={`/classes/${cls.id}/sessions/new?sessionId=${today.id}`}
                          />
                        }
                      >
                        <NotebookPen className="size-4" /> {t('logTodaySession')}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      render={<Link href={`/classes/${cls.id}`} />}
                    >
                      {t('rosterTitle')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
