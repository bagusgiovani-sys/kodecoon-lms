'use client'

import { useState } from 'react'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageToggle } from '@/components/shared/LanguageToggle'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { ApiRequestError, fetchJson } from '@/lib/utils/fetchJson'
import type { MagicLinkResponse } from '@/types/api.types'

// Passwordless entry for parents/students — one shared login (PRD). An email
// with no linked student gets a clear message, never a silent failure.
export default function StudentLoginPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await fetchJson<MagicLinkResponse>('/api/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.status === 404 ? t('magicLinkNotFound') : t('genericError'))
      } else {
        setError(t('networkError'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="data-stream flex flex-1 items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('studentLoginTitle')}</CardTitle>
          <CardDescription>{t('studentLoginSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div
              className="flex flex-col items-center gap-3 py-6 text-center"
              role="status"
            >
              <MailCheck className="text-primary size-8" aria-hidden />
              <p className="text-sm">{t('magicLinkSent')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={submitting}>
                {submitting ? t('loading') : t('magicLinkButton')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
