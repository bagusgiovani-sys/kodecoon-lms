'use client'

import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { formatDate } from '@/lib/utils/formatDate'
import type { JourneyResponse } from '@/types/api.types'

interface JourneyNodeDetailProps {
  lesson: JourneyResponse['lessons'][number] | null
  onClose: () => void
}

// Tap a node → date completed, linked session video, teacher notes (PRD P1)
export function JourneyNodeDetail({ lesson, onClose }: JourneyNodeDetailProps) {
  const { t, locale } = useLanguage()

  return (
    <Sheet open={lesson !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-xl">
        {lesson ? (
          <>
            <SheetHeader>
              <SheetTitle>
                {lesson.sequenceNumber}. {lesson.title}
              </SheetTitle>
              <SheetDescription render={<div />}>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={lesson.status === 'completed' ? 'default' : 'secondary'}
                  >
                    {lesson.status === 'completed'
                      ? t('journeyCompleted')
                      : lesson.status === 'unlocked'
                        ? t('journeyUnlocked')
                        : t('journeyLocked')}
                  </Badge>
                  {lesson.completedDate ? (
                    <span className="text-muted-foreground text-xs">
                      {t('completedOn')} {formatDate(lesson.completedDate, locale)}
                    </span>
                  ) : null}
                </div>
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4 pb-6">
              {lesson.notes ? (
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {lesson.notes}
                </p>
              ) : null}
              {lesson.videoLink ? (
                <Button
                  variant="outline"
                  render={
                    <a
                      href={lesson.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <ExternalLink className="size-4" /> {t('watchVideo')}
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
