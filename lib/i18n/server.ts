import { cookies } from 'next/headers'
import {
  dictionaries,
  LOCALE_COOKIE,
  type DictKey,
  type Locale,
} from '@/lib/i18n/dictionaries'

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get(LOCALE_COOKIE)?.value
  return value === 'id' ? 'id' : 'en'
}

// Server Component translation helper — same dictionary, no context needed.
export async function getT() {
  const locale = await getLocale()
  return function t(key: DictKey, vars?: Record<string, string | number>) {
    let text = dictionaries[locale][key]
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(value))
      }
    }
    return text
  }
}
