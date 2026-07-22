'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageToggle } from '@/components/shared/LanguageToggle'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { fetchJson } from '@/lib/utils/fetchJson'
import type { LogoutResponse } from '@/types/api.types'

// Parent-portal header — read-only surface, so just brand, language, logout.
export function PortalNav() {
  const { t } = useLanguage()
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

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-4 px-4">
        <Link href="/student" className="text-primary font-bold tracking-tight">
          KOMS
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={handleLogout}
            aria-label={t('navLogout')}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
