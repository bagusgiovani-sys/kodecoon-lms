'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

interface ProgramCardProps {
  studentId: string
  classId: string
  className: string
  lessonsCompleted?: number
  lessonsTotal?: number
  completed?: boolean
  index: number
}

// One program (class) on the Student Profile — tap → Journey (PRD).
export function ProgramCard({
  studentId,
  classId,
  className,
  lessonsCompleted,
  lessonsTotal,
  completed = false,
  index,
}: ProgramCardProps) {
  const { t } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Link
        href={`/student/${studentId}/classes/${classId}/journey`}
        className="hover:border-primary/50 bg-card group flex items-center gap-4 rounded-xl border p-4 transition-colors"
      >
        <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
          <GraduationCap className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{className}</p>
            {completed ? (
              <Badge className="shrink-0">{t('journeyCompleted')}</Badge>
            ) : null}
          </div>
          {!completed && lessonsTotal !== undefined ? (
            <>
              <Progress
                className="mt-2"
                value={
                  lessonsTotal > 0
                    ? ((lessonsCompleted ?? 0) / lessonsTotal) * 100
                    : 0
                }
              />
              <p className="text-muted-foreground mt-1 text-xs">
                {lessonsCompleted}/{lessonsTotal} {t('lessonsProgress')}
              </p>
            </>
          ) : null}
        </div>
        <span className="text-primary flex shrink-0 items-center gap-0.5 text-xs font-medium">
          {t('viewJourney')}
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </motion.div>
  )
}
