'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import type { StaffLoginResponse } from '@/types/api.types'

// Teacher/Admin email+password login. Wrong credentials → inline error, no
// redirect; network failure → retry message, not a blank screen (PRD).
export default function StaffLoginPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { redirectTo } = await fetchJson<StaffLoginResponse>(
        '/api/auth/staff-login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      )
      router.replace(redirectTo)
      router.refresh()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(
          err.status === 401
            ? t('loginError')
            : err.status === 400
              ? t('loginMissingFields')
              : t('genericError')
        )
      } else {
        setError(t('networkError'))
      }
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
          <CardTitle>{t('loginTitle')}</CardTitle>
          <CardDescription>{t('loginSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="grid gap-2">
              <Label htmlFor="password">{t('passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? t('loading') : t('loginButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
