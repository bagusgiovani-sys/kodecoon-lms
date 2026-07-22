'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCenter } from '@/components/admin/CenterProvider'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { ApiRequestError, fetchJson } from '@/lib/utils/fetchJson'
import type { AddTeacherResponse } from '@/types/api.types'

// The invite flow is the ONLY way teacher accounts are created — no public
// signup form, by design (CLAUDE.md §4).
export function InviteTeacherDialog() {
  const { t } = useLanguage()
  const { activeCenterId } = useCenter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson<AddTeacherResponse>(
        `/api/admin/teachers?centerId=${activeCenterId}`,
        { method: 'POST', body: JSON.stringify({ name, email }) }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] })
      toast.success(t('inviteSent'))
      setOpen(false)
      setName('')
      setEmail('')
      setError(null)
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError(t('emailExists'))
      } else {
        setError(err instanceof Error ? err.message : t('genericError'))
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <UserPlus className="size-4" /> {t('inviteTeacher')}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('inviteTeacher')}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            mutation.mutate()
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="teacher-name">{t('teacherNameLabel')}</Label>
            <Input
              id="teacher-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="teacher-email">{t('teacherEmailLabel')}</Label>
            <Input
              id="teacher-email"
              type="email"
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
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('loading') : t('sendInvite')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
