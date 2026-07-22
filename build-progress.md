# Build Progress — KOMS
> Started: 2026-07-17 | Last updated: 2026-07-17
> Read this at the start of EVERY Claude Code session before touching any file.

## Status
- [ ] Pending  [~] In Progress  [x] Done

---

## Phase 1 — Project Setup
- [x] Step 1: Create Next.js app (App Router, TypeScript strict) — Next 16; note: middleware.ts is now proxy.ts
- [x] Step 2: Install packages — Tailwind, shadcn/ui, Framer Motion, TanStack Query, Zod, @supabase/ssr, @anthropic-ai/sdk, @react-pdf/renderer
- [x] Step 3: Init git, link Supabase project — git done; **Supabase project link pending Gio** (see Step 9)

## Phase 2 — Design Tokens
- [x] Step 4: Claude Design tokens not delivered → PRD fallback baseline used (dark default, blue-green primary, maroon/red + blue accents)
- [x] Step 5: globals.css written with tokens + data-stream motif utilities
- [x] Step 6: Component inventory → component-inventory.md

## Phase 3 — Backend
- [~] Step 7: schema.sql ready; **running it against the real Supabase project pending Gio's credentials**
- [ ] Step 8: RLS manual verification per role — blocked on Step 7
- [ ] Step 9: Env vars — `.env.example` documented; **no `.env.local` yet, needs Gio's Supabase/Anthropic/Google keys**
- [x] Step 10: proxy.ts (Next 16's middleware.ts) — three route groups, three rules
- [x] Step 11: database.types.ts generated from schema
- [x] Step 12: seed.sql written (1 center Indonesia, Gio as admin, default report template) — runs after Step 7
- [ ] Step 13: Verify seed data against RLS — blocked on Steps 7–9
- [x] All API route handlers implemented per SDD.md §3 (auth, classes, roster, students, sessions/log, schedule, reports draft+export, admin teachers/schedule/lessons/centers, student profile/journey)

## Phase 4 — Components
- [x] Step 14: shadcn/ui init (21 primitives)
- [x] Step 15: Base UI components
- [x] Step 16: Feature components — AttendanceList, VideoPicker, LessonChecklist, LogSessionForm
- [x] Step 17: JourneyNode + JourneyPath + JourneyNodeDetail (Framer Motion), CenterSwitcher, + admin/schedule/students/student-portal/shared components

## Phase 5 — Pages
- [x] Step 18: Staff login + Student/Parent magic-link login; root layout (dark default, Providers, metadata); landing page with role redirect
- [x] Step 19: (dashboard) layout guard (lib/utils/pageAuth.ts) + Dashboard (My Classes)
- [x] Step 20: My Schedule + Add Session
- [x] Step 21: Class Roster + Add Student (parent invite) + Add Class
- [x] Step 22: Log Session — attendance + video + lesson completion + notes in one flow
- [x] Step 23: Student Detail (teacher side)
- [x] Step 24: (student) layout guard + PortalNav + hub redirect + Student Profile + Journey view
- [x] Step 25: (admin) layout guard (CenterProvider + CenterSwitcher header) + Manage Lesson Plan
- [x] Step 26: Generate Report (AI draft + PDF export) + Manage Teachers (+ TeachersTable) + Academy Schedule

## Phase 6 — Polish + Deploy
- [~] Step 27: PWA manifest + install-to-homescreen — manifest, icons, theme color, iOS standalone meta all done and verified in the build output. App is installable from the Chrome menu. **Service worker not built — pending Gio's call** (needed for the automatic install prompt + offline; see Current Status)
- [ ] Step 28: Dark mode QA across all three route groups
- [ ] Step 29: Desktop / tablet / mobile responsive QA — not mobile-only
- [ ] Step 30: Vercel deploy

---

## Session Log
| Session | Date | Steps completed | Token % at close | Notes |
|---------|------|-----------------|-----------------|-------|
| 1       | 2026-07-17 | 1–6, 10–12 (partial 7), API layer | — | Scaffold, tokens, backend files, all API routes |
| 2       | 2026-07-17 | 14–17 | — | All feature components |
| 3       | 2026-07-17 | 18–26 | — | All pages, guards, root layout; tsc + eslint clean |

---

## Current Status
**Last completed:** Step 27 (partial) — PWA manifest at `app/manifest.ts`, icons generated from the design tokens (`scripts/generate-icons.mjs` → teal-on-dark K monogram, incl. a maskable variant), `themeColor` + `appleWebApp` in the root layout. tsc + production build pass; `/manifest.webmanifest` verified serving valid JSON as `application/manifest+json`.
**In progress:** Step 27 — service worker deferred, see below.
**Open decision (Gio):** Chrome 108+/112+ makes KOMS installable from the browser menu on the manifest alone, but the *automatic* install prompt and any offline capability need a service worker with a fetch handler. KOMS is fully auth-gated over minors' data, so a naive cache-everything SW would leave student records in the Cache API on shared devices. Recommendation: a narrow SW that caches only static assets and the app shell, and never caches HTML or `/api/*` responses. Not built pending Gio's approval.
**Next action:** Steps 7–9 + 13 still need Gio and still block everything downstream (create Supabase project, run schema.sql + seed.sql, fill `.env.local`, verify RLS per role). `.env.local` still absent as of 2026-07-22. Steps 28–30 (dark mode QA, responsive QA, Vercel deploy) cannot start until the app runs against a real database.
