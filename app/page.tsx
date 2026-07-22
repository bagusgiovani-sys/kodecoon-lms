import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, GraduationCap, Users } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n/server'

// App entry: logged-out users pick their door (staff vs parent/student);
// logged-in users go straight to their role's home (PRD navigation map).
export default async function Home() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    redirect(profile?.role === 'parent' ? '/student' : '/dashboard')
  }

  const t = await getT()

  return (
    <main className="data-stream flex flex-1 flex-col items-center justify-center gap-10 p-6">
      <div className="text-center">
        <h1 className="text-primary text-4xl font-bold tracking-tight">
          {t('appName')}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{t('appTagline')}</p>
      </div>
      <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
        <Link
          href="/login"
          className="bg-card hover:border-primary/50 group rounded-xl border p-5 transition-colors"
        >
          <GraduationCap className="text-primary mb-3 size-6" aria-hidden />
          <p className="font-semibold">{t('loginTitle')}</p>
          <p className="text-muted-foreground mt-1 text-xs">{t('loginSubtitle')}</p>
          <span className="text-primary mt-3 flex items-center gap-0.5 text-xs font-medium">
            {t('loginButton')}
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link
          href="/student/login"
          className="bg-card hover:border-primary/50 group rounded-xl border p-5 transition-colors"
        >
          <Users className="text-accent-blue mb-3 size-6" aria-hidden />
          <p className="font-semibold">{t('studentLoginTitle')}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {t('studentLoginSubtitle')}
          </p>
          <span className="text-primary mt-3 flex items-center gap-0.5 text-xs font-medium">
            {t('magicLinkButton')}
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </main>
  )
}
