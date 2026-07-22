'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { JourneyNode } from '@/components/journey/JourneyNode'
import { JourneyNodeDetail } from '@/components/journey/JourneyNodeDetail'
import { cn } from '@/lib/utils'
import type { JourneyResponse } from '@/types/api.types'

type JourneyLesson = JourneyResponse['lessons'][number]

interface JourneyPathProps {
  lessons: JourneyLesson[]
}

const COLUMNS = 4

// Snake-path layout: rows of nodes in alternating direction (boustrophedon),
// horizontal connectors within a row, a vertical connector where the path
// turns. Node = one lesson from the class's lesson plan.
export function JourneyPath({ lessons }: JourneyPathProps) {
  const [selected, setSelected] = useState<JourneyLesson | null>(null)

  const rows: JourneyLesson[][] = []
  for (let i = 0; i < lessons.length; i += COLUMNS) {
    rows.push(lessons.slice(i, i + COLUMNS))
  }

  return (
    <div className="mx-auto max-w-xl">
      {rows.map((row, rowIndex) => {
        const reversed = rowIndex % 2 === 1
        // The turn connector sits under the row's LAST node in path order —
        // visually right side for left-to-right rows, left side otherwise
        const turnOnRight = !reversed
        const lastInRow = row[row.length - 1]

        return (
          <div key={rowIndex}>
            <div
              className={cn(
                'flex items-start justify-between gap-1',
                reversed && 'flex-row-reverse'
              )}
            >
              {row.map((lesson, colIndex) => {
                const pathIndex = rowIndex * COLUMNS + colIndex
                return (
                  <div
                    key={lesson.id}
                    className={cn(
                      'flex flex-1 items-start',
                      reversed && 'flex-row-reverse'
                    )}
                  >
                    <JourneyNode
                      sequenceNumber={lesson.sequenceNumber}
                      title={lesson.title}
                      status={lesson.status}
                      index={pathIndex}
                      onTap={() => setSelected(lesson)}
                    />
                    {colIndex < row.length - 1 ? (
                      <motion.div
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ delay: pathIndex * 0.06 + 0.1 }}
                        className={cn(
                          'mt-6 h-1 flex-1 rounded-full sm:mt-7',
                          lesson.status === 'completed'
                            ? 'bg-journey-completed'
                            : 'bg-journey-locked'
                        )}
                        aria-hidden
                      />
                    ) : null}
                  </div>
                )
              })}
              {/* pad short final rows so nodes keep their column width */}
              {row.length < COLUMNS
                ? Array.from({ length: COLUMNS - row.length }).map((_, i) => (
                    <div key={`pad-${i}`} className="w-16 flex-1 sm:w-20" aria-hidden />
                  ))
                : null}
            </div>
            {rowIndex < rows.length - 1 ? (
              <div
                className={cn(
                  'flex',
                  turnOnRight ? 'justify-end' : 'justify-start'
                )}
                aria-hidden
              >
                <div className="flex w-16 justify-center sm:w-20">
                  <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ delay: (rowIndex + 1) * COLUMNS * 0.06 }}
                    className={cn(
                      'h-8 w-1 rounded-full',
                      lastInRow.status === 'completed'
                        ? 'bg-journey-completed'
                        : 'bg-journey-locked'
                    )}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )
      })}

      <JourneyNodeDetail lesson={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
