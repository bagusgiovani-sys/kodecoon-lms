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
import type { AddStudentResponse } from '@/types/api.types'

interface AddStudentFormProps {
  classId: string
}

// Manual entry — no OClass sync (PRD). Saving triggers the parent invite;
// duplicate names are allowed by design, identity rides on the internal id.
export function AddStudentForm({ classId }: AddStudentFormProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [name, setName] = useState('')
  const [parentEmail, setParentEmail] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson<AddStudentResponse>(`/api/classes/${classId}/students`, {
        method: 'POST',
        body: JSON.stringify({ name, parentEmail }),
      }),
    onSuccess: () => {
      toast.success(t('studentSaved'))
      router.push(`/classes/${classId}`)
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
        if (name.trim() && parentEmail.trim()) mutation.mutate()
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="student-name">{t('studentNameLabel')}</Label>
        <Input
          id="student-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="parent-email">{t('parentEmailLabel')}</Label>
        <Input
          id="parent-email"
          type="email"
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
          required
        />
      </div>
      <Button
        type="submit"
        disabled={mutation.isPending || !name.trim() || !parentEmail.trim()}
      >
        {mutation.isPending ? t('loading') : t('saveStudent')}
      </Button>
    </form>
  )
}
