'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { Toaster } from '@/components/ui/sonner'
import { LanguageProvider } from '@/lib/i18n/LanguageProvider'
import type { Locale } from '@/lib/i18n/dictionaries'

interface ProvidersProps {
  initialLocale: Locale
  children: React.ReactNode
}

export function Providers({ initialLocale, children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Small, low-traffic app — freshness over cache hit rate (SDD §7)
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* "user" defers to the OS reduced-motion setting: transform and layout
          animations are dropped, opacity fades are kept. Components running
          infinite loops gate on useReducedMotion() themselves — MotionConfig
          alone would leave an opacity pulse cycling. */}
      <MotionConfig reducedMotion="user">
        <LanguageProvider initialLocale={initialLocale}>
          {children}
          <Toaster position="top-center" />
        </LanguageProvider>
      </MotionConfig>
    </QueryClientProvider>
  )
}
