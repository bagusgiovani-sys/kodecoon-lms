'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JourneyNodeProps {
  sequenceNumber: number
  title: string
  status: 'locked' | 'unlocked' | 'completed'
  index: number
  onTap: () => void
}

// One lesson node on the snake path — the app's highest-attention visual
// surface (CLAUDE.md §8). Entrance staggers along the path; the "up next"
// node breathes.
export function JourneyNode({
  sequenceNumber,
  title,
  status,
  index,
  onTap,
}: JourneyNodeProps) {
  const locked = status === 'locked'
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex w-16 flex-col items-center gap-1.5 sm:w-20">
      <motion.button
        type="button"
        onClick={onTap}
        disabled={locked}
        aria-label={`${sequenceNumber}. ${title}`}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: index * 0.06,
          type: 'spring',
          stiffness: 260,
          damping: 18,
        }}
        whileHover={locked ? undefined : { scale: 1.1 }}
        whileTap={locked ? undefined : { scale: 0.92 }}
        className={cn(
          'relative flex size-12 items-center justify-center rounded-full border-2 text-sm font-bold shadow-md transition-colors sm:size-14',
          status === 'completed' &&
            'border-journey-completed bg-journey-completed text-primary-foreground',
          status === 'unlocked' &&
            'border-journey-unlocked bg-journey-unlocked/15 text-journey-unlocked',
          locked &&
            'border-journey-locked bg-journey-locked/40 text-muted-foreground cursor-not-allowed'
        )}
      >
        {status === 'completed' ? (
          <Check className="size-5" strokeWidth={3} aria-hidden />
        ) : locked ? (
          <Lock className="size-4" aria-hidden />
        ) : (
          sequenceNumber
        )}
        {status === 'unlocked' ? (
          reduceMotion ? (
            // Reduced motion: keep the "up next" ring, drop the pulse. The ring
            // carries meaning, so it stays — only the looping animation goes.
            <span
              className="border-journey-unlocked absolute inset-0 rounded-full border-2 opacity-70"
              aria-hidden
            />
          ) : (
            <motion.span
              className="border-journey-unlocked absolute inset-0 rounded-full border-2"
              animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              aria-hidden
            />
          )
        ) : null}
      </motion.button>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.06 + 0.15 }}
        className={cn(
          'line-clamp-2 text-center text-[10px] leading-tight sm:text-xs',
          locked ? 'text-muted-foreground/60' : 'text-foreground/80'
        )}
      >
        {title}
      </motion.span>
    </div>
  )
}
