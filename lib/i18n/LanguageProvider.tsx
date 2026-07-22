'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import {
  dictionaries,
  LOCALE_COOKIE,
  type DictKey,
  type Locale,
} from '@/lib/i18n/dictionaries'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: DictKey, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

interface LanguageProviderProps {
  initialLocale: Locale
  children: React.ReactNode
}

export function LanguageProvider({
  initialLocale,
  children,
}: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
  }, [])

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => {
      let text = dictionaries[locale][key]
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value))
        }
      }
      return text
    },
    [locale]
  )

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return context
}
