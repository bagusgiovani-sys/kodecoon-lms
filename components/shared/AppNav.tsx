'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LanguageToggle } from '@/components/shared/LanguageToggle'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { fetchJson } from '@/lib/utils/fetchJson'
import { cn } from '@/lib/utils'
import type { DictKey } from '@/lib/i18n/dictionaries'
import type { LogoutResponse } from '@/types/api.types'

interface AppNavProps {
  role: 'teacher' | 'admin'
  userName: string
}

interface NavTab {
  href: string
  labelKey: DictKey
  adminOnly?: boolean
}

const TABS: NavTab[] = [
  { href: '/dashboard', labelKey: 'navDashboard' },
  { href: '/schedule', labelKey: 'navSchedule' },
  { href: '/admin/teachers', labelKey: 'navAdminTeachers', adminOnly: true },
  { href: '/admin/schedule', labelKey: 'navAdminSchedule', adminOnly: true },
]

export function AppNav({ role, userName }: AppNavProps) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    try {
      const { redirectTo } = await fetchJson<LogoutResponse>('/api/auth/logout', {
        method: 'POST',
      })
      router.replace(redirectTo)
      router.refresh()
    } catch {
      router.replace('/')
    }
  }

  const tabs = TABS.filter((tab) => !tab.adminOnly || role === 'admin')

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/dashboard" className="text-primary font-bold tracking-tight">
          KOMS
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const active =
              pathname === tab.href || pathname.startsWith(`${tab.href}/`)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t(tab.labelKey)}
              </Link>
            )
          })}
        </nav>
        <LanguageToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="icon" aria-label={userName} />}
          >
            <User className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="max-w-48 truncate">
              {userName}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="size-4" /> {t('navLogout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
