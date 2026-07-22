import type { Locale } from '@/lib/i18n/dictionaries'

const LOCALE_TAGS: Record<Locale, string> = { en: 'en-SG', id: 'id-ID' }

export function formatDate(isoDate: string, locale: Locale = 'en'): string {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

// 'HH:mm:ss' | 'HH:mm' → 'HH:mm' for display
export function formatTime(time: string | null): string | null {
  if (!time) return null
  return time.slice(0, 5)
}

export function todayIsoDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
