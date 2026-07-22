'use client'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

// EN ⇄ Bahasa Indonesia, top-right on every screen (PRD resolved question)
export function LanguageToggle() {
  const { locale, setLocale } = useLanguage()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="font-mono text-xs tracking-widest"
      onClick={() => setLocale(locale === 'en' ? 'id' : 'en')}
      aria-label="Switch language"
    >
      <span className={locale === 'en' ? 'text-primary' : 'text-muted-foreground'}>
        EN
      </span>
      <span className="text-muted-foreground">/</span>
      <span className={locale === 'id' ? 'text-primary' : 'text-muted-foreground'}>
        ID
      </span>
    </Button>
  )
}
