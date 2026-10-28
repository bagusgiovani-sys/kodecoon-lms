import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from '@/components/shared/Providers'
import { getLocale } from '@/lib/i18n/server'
import './globals.css'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'KodeNexus — Kodecoon Academy',
  description:
    'Attendance, session videos, and lesson-progress journeys for Kodecoon Academy classes.',
  applicationName: 'KodeNexus',
  // iOS ignores the manifest's display mode — these drive install-to-homescreen there.
  appleWebApp: {
    capable: true,
    title: 'KodeNexus',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  // Single value, not a light/dark pair: the root <html> pins `dark` unconditionally.
  themeColor: '#080e20',
  // Let the standalone shell paint under the notch/status bar on iOS.
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  )
}
