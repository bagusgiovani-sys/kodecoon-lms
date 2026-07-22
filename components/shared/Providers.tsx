'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
      <LanguageProvider initialLocale={initialLocale}>
        {children}
        <Toaster position="top-center" />
      </LanguageProvider>
    </QueryClientProvider>
  )
}
