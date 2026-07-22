'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { CalendarPlus } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { fetchJson } from '@/lib/utils/fetchJson'
import { todayIsoDate } from '@/lib/utils/formatDate'
import type { CreateSessionResponse } from '@/types/api.types'

interface AddSessionDialogProps {
  classes: Array<{ id: string; name: string }>
}

export function AddSessionDialog({ classes }: AddSessionDialogProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [date, setDate] = useState(todayIsoDate())
  const [time, setTime] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson<CreateSessionResponse>('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ classId, date, time: time || undefined }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      toast.success(t('sessionSaved'))
      setOpen(false)
      router.refresh()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('genericError'))
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <CalendarPlus className="size-4" /> {t('addSession')}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('addSession')}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (classId && date) mutation.mutate()
          }}
        >
          <div className="grid gap-2">
            <Label>{t('classLabel')}</Label>
            <Select
              value={classId}
              onValueChange={(id) => {
                if (id) setClassId(id)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('classLabel')} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="session-date">{t('dateLabel')}</Label>
            <Input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="session-time">{t('timeLabel')}</Label>
            <Input
              id="session-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={mutation.isPending || !classId}>
            {mutation.isPending ? t('loading') : t('saveSession')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
