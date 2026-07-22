'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { fetchJson } from '@/lib/utils/fetchJson'
import type { CreateClassResponse } from '@/types/api.types'

// Define a class only — the lesson plan is authored separately in Manage
// Lesson Plan (PRD Add/Edit Class).
export function AddClassForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const [name, setName] = useState('')
  const [ageBracket, setAgeBracket] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson<CreateClassResponse>('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          name,
          ageBracket: ageBracket.trim() || undefined,
        }),
      }),
    onSuccess: (data) => {
      toast.success(t('classSaved'))
      router.push(`/classes/${data.id}`)
      router.refresh()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('genericError'))
    },
  })

  return (
    <form
      className="grid max-w-sm gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim()) mutation.mutate()
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="class-name">{t('classLabel')}</Label>
        <Input
          id="class-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="age-bracket">{t('ageBracketLabel')}</Label>
        <Input
          id="age-bracket"
          value={ageBracket}
          onChange={(e) => setAgeBracket(e.target.value)}
          placeholder="8-12"
        />
      </div>
      <Button type="submit" disabled={mutation.isPending || !name.trim()}>
        {mutation.isPending ? t('loading') : t('saveClass')}
      </Button>
    </form>
  )
}
