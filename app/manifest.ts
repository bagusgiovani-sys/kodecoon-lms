import type { MetadataRoute } from 'next'

// Next.js serves this at /manifest.webmanifest and injects the <link rel="manifest">
// automatically — no manual tag needed in the root layout.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'KOMS — Kodecoon Operations Management System',
    short_name: 'KOMS',
    description:
      'Attendance, session videos, and lesson-progress journeys for Kodecoon Academy classes.',
    // Landing page redirects by role, so one start_url serves teacher, admin, and parent.
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // No orientation lock: KOMS targets desktop, tablet, and mobile (PRD), not mobile-only.
    background_color: '#030d12',
    theme_color: '#030d12',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
