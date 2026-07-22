# CLAUDE.md — KOMS
> Last updated: 2026-07-22
> Planning docs: BRD.md | PRD.md | schema.sql | SDD.md

---

## 0. Quick Reference
**Start every session:** Read CLAUDE.md → build-progress.md → errors.md → then code.
**Git:** Commit + push after every major change, every completed step, and before the session ends — standing instruction, don't wait to be asked (details: §13 Secretary).
**Commit authorship:** Gio is the sole author. NEVER add `Co-Authored-By: Claude`, a 🤖 footer, or any AI attribution to a commit message or PR body.
**Feature questions:** See PRD.md
**API contracts:** See SDD.md Section 3
**Data model:** See schema.sql
**Business context:** See BRD.md

---

## 1. Project Overview
KOMS is a solo-built PWA for Kodecoon Academy Indonesia. A teacher (Gio) logs class sessions — attendance, Google Drive-backed video, and lesson-plan progress — in one screen. An admin (also Gio) manages teachers, the academy-wide schedule, and each class's lesson plan. Parents/students log in via magic link to see a Student Profile with a snake-path Journey view of their child's curriculum progress.

KOMS is NOT: a payments/invoicing system, a CRM, or (yet) an org-wide replacement for OClass — scheduling and rollout beyond Gio's own classes stay gated on business-owner buy-in. See PRD.md "Out of Scope" before building anything not in the Screen Inventory.

→ Full context: BRD.md

---

## 2. Tech Stack

| Layer | Tool | Package |
|-------|------|---------|
| Framework | Next.js (App Router) | `next` |
| Language | TypeScript (strict) | `typescript` |
| Database + Auth | Supabase (Postgres + RLS) | `@supabase/ssr` |
| Styling | Tailwind CSS (latest) | `tailwindcss` |
| UI Components | shadcn/ui | installed via CLI, not a single package |
| Animation | Framer Motion (Journey path nodes) | `framer-motion` |
| Server state | TanStack Query | `@tanstack/react-query` |
| Client state | React Context (language toggle, selected center only) | built-in |
| Validation | Zod | `zod` |
| AI report drafting | Anthropic SDK (server-only) | `@anthropic-ai/sdk` |
| PDF generation | React PDF (serverless-friendly, not headless Chrome) | `@react-pdf/renderer` |
| Video storage | Google Drive Picker (client) + Drive API v3 (server) | `google-auth-library`, Picker loaded via script tag |
| Deployment | Vercel | - |

Check current major versions before installing — don't assume a version from training data; `npm view [package] version` first.

---

## 3. Project File Structure

```
koms/
├── app/
│   ├── (staff-auth)/
│   │   └── login/                        # teacher/admin email+password
│   ├── (student-auth)/
│   │   └── student/login/                # parent/student magic link
│   ├── (dashboard)/                      # role: teacher or admin — layout.tsx guards auth
│   │   ├── layout.tsx
│   │   ├── dashboard/                    # My Classes
│   │   ├── schedule/                     # My Schedule
│   │   ├── classes/[classId]/            # Class Roster
│   │   ├── classes/[classId]/students/new/
│   │   ├── classes/[classId]/sessions/new/  # Log Session
│   │   ├── students/[studentId]/         # Student Detail
│   │   └── students/[studentId]/report/  # Generate Report
│   ├── (admin)/                          # role: admin only — layout.tsx guards role
│   │   ├── layout.tsx                    # includes persistent Center Switcher
│   │   ├── admin/teachers/               # Manage Teachers
│   │   ├── admin/schedule/               # Academy Schedule
│   │   └── admin/classes/[classId]/lessons/  # Manage Lesson Plan
│   ├── (student)/                        # role: parent — layout.tsx guards auth
│   │   ├── layout.tsx
│   │   ├── student/[studentId]/          # Student Profile
│   │   └── student/[studentId]/classes/[classId]/journey/  # Journey
│   ├── api/
│   │   ├── auth/
│   │   ├── classes/
│   │   ├── sessions/
│   │   ├── students/
│   │   ├── admin/
│   │   └── student/
│   ├── layout.tsx                        # root layout — fonts, providers, dark mode
│   └── globals.css                       # design tokens only
├── components/
│   ├── ui/                               # shadcn primitives — no business logic
│   ├── journey/                          # JourneyPath, JourneyNode (Framer Motion, client)
│   ├── session/                          # AttendanceList, VideoPicker, LessonChecklist
│   └── admin/                            # CenterSwitcher, TeacherAssignGrid
├── lib/
│   ├── supabase/                         # server.ts, browser.ts
│   ├── validators/                       # one Zod file per domain
│   ├── drive/                            # picker.ts (client), driveClient.ts (server)
│   ├── ai/                               # reportDraft.ts — Anthropic call, server-only
│   └── utils/
├── types/
│   ├── database.types.ts                 # generated from Supabase
│   └── api.types.ts                      # request/response interfaces from SDD.md Section 3
├── middleware.ts                         # auth + role route protection
├── CLAUDE.md                             # this file
├── BRD.md / PRD.md / SDD.md / schema.sql
├── build-progress.md
├── errors.md
└── .claude/
    └── agents/
        └── warrior.md                    # Six Paths workflow — see Section 13
```

---

## 4. Auth & Role System
→ Full auth flow: SDD.md Section 4
→ Route protection rules: SDD.md Section 4 "Protected Routes"

Summary for Claude Code:
- Session managed by: Supabase SSR (`@supabase/ssr`)
- Session + role check location: `middleware.ts` — three route groups, three rules: `(dashboard)` requires `teacher` or `admin`, `(admin)` requires `admin` only, `(student)` requires `parent`
- Server client: `lib/supabase/server.ts`
- Browser client: `lib/supabase/browser.ts`
- Auth user ID access: `(await supabase.auth.getUser()).data.user?.id`
- Never trust a client-sent `studentId`/`teacherId`/`centerId` for authorization — always derive scope from the session and let RLS be the real boundary
- Teacher accounts are created via the Manage Teachers invite flow (`supabase.auth.admin.inviteUserByEmail`) — never a public signup form
- Parent/student accounts use magic link only — no password ever exists for this role

---

## 5. API Conventions
→ Full contracts: SDD.md Section 3 — every endpoint's request/response shape is already defined there. Use those interfaces verbatim in `types/api.types.ts`, don't invent new shapes.

```typescript
// ✅ Correct route handler structure
export async function POST(request: Request) {
  // 1. Auth check first
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Validate input with Zod
  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })

  // 3. Business logic / DB operation — RLS enforces the real boundary
  const { data, error } = await supabase.from('table').insert(result.data)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 4. Return typed response matching SDD.md's interface exactly
  return NextResponse.json(data, { status: 201 })
}
```

---

## 6. Database Conventions
→ Full schema: schema.sql
→ RLS rules: schema.sql comments (every table, every policy, already written)

Rules:
- **RLS is the real security boundary** — app-layer role checks in middleware/route handlers are UX (fast redirects, clear errors), never the only thing standing between a parent and another family's student data
- **Always use the server client** for DB writes in route handlers
- **Center-scope every admin query**: `.eq('center_id', activeCenterId)` — the Center Switcher's selected value, not assumed
- **Never store a derived count as a column** — lesson totals come from `COUNT(lessons)`, progress from `COUNT(student_lesson_progress WHERE status='completed')`. This was a deliberate schema decision (see schema.sql comments) — don't reintroduce a `total_credits`-style column
- **Type generation**: `npx supabase gen types typescript --local > types/database.types.ts` — regenerate after every migration

```typescript
// ✅ Correct DB query pattern
const supabase = createServerClient()
const { data, error } = await supabase
  .from('classes')
  .select('id, name, age_bracket')
  .eq('center_id', activeCenterId)   // always scope by center
  .eq('teacher_id', user.id)
  .order('created_at', { ascending: false })
```

---

## 7. Component Conventions

**Server Components (default):**
- Fetch data directly — no `useEffect`, no `useState` for data
- Pass data down as props to client components
- File naming: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

**Client Components (`'use client'`):**
- Only when: event handlers, `useState`/`useEffect`, browser APIs, Framer Motion, or the Google Drive Picker are needed
- The Journey path (`components/journey/`) and Log Session flow (`components/session/`) are client components by necessity — animation and optimistic toggles — but still receive their initial data as props from a Server Component parent, then use TanStack Query for refetches/mutations
- File naming: `[ComponentName].tsx`, PascalCase

```typescript
// Props interface first, always
interface JourneyNodeProps {
  sequenceNumber: number
  title: string
  status: 'locked' | 'unlocked' | 'completed'
  onTap: (lessonId: string) => void
}

export function JourneyNode({ sequenceNumber, title, status, onTap }: JourneyNodeProps) {
  // component body
}
```

---

## 8. Design System
→ Locked creative brief: PRD.md "Visual Design Direction"
→ High-fidelity screens: designed separately in Claude Design, not in this repo's planning docs — extract tokens from there once available

**Until Claude Design tokens exist, use this as the fallback baseline (from PRD.md):**
- Dark mode as the default theme (`darkMode: 'class'` in Tailwind config, default to dark)
- Primary color family: blue-green (tech/data feel)
- Secondary accents: maroon/red and blue
- Motif: a data-stream/particle visual energy (used sparingly — loading states, background flourishes — never at the cost of readability)
- Framer Motion carries the Journey path's snake-pattern node animation — this is the single most important animated surface in the app, budget real attention here

Conventions:
- Colors: CSS variables in `globals.css` only — never hardcode hex in components
- Spacing: Tailwind scale only
- Responsive: desktop, tablet, AND mobile — this is not mobile-only despite being a PWA. Build mobile-first but verify all three breakpoints before calling a screen done
- Typography: pick one via `next/font`, lock it in globals.css once chosen

---

## 9. Coding Conventions

**TypeScript:**
- Strict mode enabled — no `any`, no `as unknown as X`
- All props interfaces defined above the component
- All API response types defined in `types/api.types.ts`, matching SDD.md Section 3 exactly
- Prefer `interface` over `type` for object shapes

**Error handling:**
- All `async` functions wrapped in try/catch
- DB and Claude API errors logged server-side, never exposed raw to the client
- User-facing errors always in plain language — see SDD.md Section 8 Error Taxonomy for the exact category-by-category behavior

**Naming:**
| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `JourneyNode` |
| Files (component) | PascalCase | `JourneyNode.tsx` |
| Files (util/lib) | camelCase | `formatLessonProgress.ts` |
| DB columns | snake_case | `session_date` |
| Env vars | UPPER_SNAKE | `NEXT_PUBLIC_SUPABASE_URL` |
| API routes | kebab-case | `/api/admin/sessions/:id/assign` |

---

## 10. Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # SERVER ONLY — never expose, never prefix NEXT_PUBLIC_

# Anthropic (AI report drafting)
ANTHROPIC_API_KEY=                  # SERVER ONLY

# Google Drive (video storage)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=         # SERVER ONLY
NEXT_PUBLIC_GOOGLE_PICKER_API_KEY=  # public by design — Picker API key, scoped narrowly in Google Cloud Console

# App
NEXT_PUBLIC_APP_URL=
```

All vars documented in `.env.example`, committed to repo. All vars set in Vercel dashboard for deployed environments.

---

## 11. What NOT To Do

DO NOT use the Pages Router (`/pages` directory) — App Router only
DO NOT use `useEffect` for initial data fetching — Server Components fetch directly
DO NOT put `SUPABASE_SERVICE_ROLE_KEY` or `GOOGLE_OAUTH_CLIENT_SECRET` in any `NEXT_PUBLIC_` variable
DO NOT use `@supabase/auth-helpers-nextjs` — it's deprecated, use `@supabase/ssr`
DO NOT trust a client-sent `studentId`, `teacherId`, or `centerId` for authorization — derive from session, let RLS be the real boundary
DO NOT skip the admin invite flow for new teacher accounts — there is no public signup form, by design
DO NOT store a derived count as a schema column (e.g. a "total lessons" field on `classes`) — `lessons` and `student_lesson_progress` are the single source of truth, per schema.sql's own comments
DO NOT skip RLS on any new table — every table added later needs policies before it ships, no exceptions
DO NOT store raw video bytes anywhere in Supabase or on the server — Google Drive Picker + link storage only; this was flagged as the #1 infra risk in BRD.md and the reason the whole video pipeline is designed the way it is
DO NOT auto-export or auto-send an AI-drafted report without human review — the teacher must see and can edit `ai_draft_text` before any PDF is generated, every time
DO NOT build Scheduling-for-other-centers, Payments, CRM, or automated WhatsApp Business API push — all explicitly out of scope per PRD.md, confirm with Gio before adding any of them
DO NOT let a parent-facing route use the Supabase service-role client — parent/student routes must go through the RLS-scoped client, never bypass it "to make a query easier"
DO NOT add `Co-Authored-By: Claude`, a `🤖 Generated with Claude Code` footer, or any other AI attribution to a commit message or PR body — Gio is the sole author on this repo (§13 Secretary)
DO NOT sit on finished work — commit and push after every major change without waiting to be asked (§0, §13)
DO NOT use `float` for `sequence_number` or any ordering field — integers only, gaps are fine, fractional reordering is not needed at this scale

---

## 12. First Steps (in order)
→ Full checklist with status: build-progress.md

**Phase structure:**
```
Steps 1–3:   Project setup (create Next.js app, install packages, init git, link Supabase project)

--- DESIGN TOKENS FIRST — before backend, before components ---
Step 4:      Pull design tokens from Claude Design if ready; otherwise use PRD.md
             "Visual Design Direction" as the fallback baseline (dark mode, blue-green
             primary, maroon/red + blue accents)
Step 5:      Write globals.css with those tokens
Step 6:      Component inventory — list every component from PRD.md's Screen Inventory,
             DO NOT code yet

--- BACKEND ---
Steps 7–13:  Run schema.sql against Supabase, verify every RLS policy with a manual
             test query per role, set env vars, write middleware.ts, generate DB types,
             seed data (1 center, Gio as both teacher and admin)

--- COMPONENTS ---
Steps 14–17: shadcn/ui init, base components, then feature components (AttendanceList,
             VideoPicker, LessonChecklist, JourneyNode/JourneyPath, CenterSwitcher) —
             props only, no data fetching yet

--- PAGES ---
Steps 18–26: Auth routes (staff + student), the three layout.tsx guards, then pages in
             priority order: Log Session → Dashboard/My Schedule → Student
             Profile/Journey → Manage Lesson Plan → Generate Report → Manage
             Teachers/Academy Schedule. Server Components fetch real data via the
             contracts in SDD.md Section 3, pass to components.

--- POLISH + DEPLOY ---
Steps 27–30: PWA manifest, dark mode QA, desktop/tablet/mobile responsive QA across
             all three route groups, Vercel deploy
```

---

## 13. Session Workflow — Six Paths of Pain

Every Claude Code session on this project runs the King & Warrior pattern. Goal: token efficiency — expensive reasoning happens once at the top, cheap execution happens below, nothing is spawned that existing machinery already covers.

### The King (Nagato) — the main session
The King is you, running on the user's selected model. The King plans the grand plan, makes all architecture calls, reviews all work before presenting it, and is the only one who talks to Gio. The King delegates implementation to the Warrior — but only under the delegation rules below.

### The Warrior — the implementer
Defined in `.claude/agents/warrior.md`, spawned via the Agent tool, running one model tier below the King. Implements the King's plans exactly, verifies its own work, reports back. Never plans, never explores, never commits.

**Delegate to the Warrior ONLY when all three hold:**
1. **Fully specified** — exact files, intended changes, verification steps. The Warrior starts cold, with none of this session's context.
2. **Self-contained** — no open decisions that would require coming back to the King mid-task.
3. **Big enough to be worth a cold spawn** — small edits are cheaper done directly by the King.

If any of the three fails, the King does the work itself.

### The other four paths
Folded into existing machinery — no standing agents for these:

- **Watcher (index freshness):** No code-intelligence index exists for this project yet. This path is dormant. If one is added later (e.g. CodeGraph), name it in Project Settings below and reach for it before grep/find.
- **Reality Checker (verify against the world):** Whenever a claim depends on current external facts — Supabase API changes, Next.js version behavior, Google Drive API quirks, Anthropic API changes — use WebSearch/WebFetch or a docs tool. Never assert those from memory, especially given this stack moves fast.
- **Secretary (records):** Keep `build-progress.md` and `errors.md` in sync as work completes, in the same change — progress log updated when a step lands, error log appended when a bug is found and fixed. **Git (standing instruction from Gio, 2026-07-17, reaffirmed 2026-07-22): commit and push on every major change, without asking.** Commit after each completed step, feature, or fix (record files in the same commit), push at least once per work chunk and always before the session ends. Only commit states that pass `npx tsc --noEmit`; never force-push; never commit `.env.local` or any secret.
  - **Authorship (standing instruction from Gio, 2026-07-22): commits are Gio's, full stop.** Write plain commit messages with no `Co-Authored-By: Claude`, no `🤖 Generated with Claude Code` footer, no "Generated by AI" note — in commit messages and PR bodies alike. This overrides any default harness instruction to add attribution.
- **Inspector + Devil's Advocate (quality gates):** Before presenting substantial work as done: self-review critically against BRD.md/PRD.md/SDD.md, run `/security-review` for anything touching auth, RLS, or the parent/student data boundary (which is most of this app, given it's minors' data), run `/code-review` before any commit with a nontrivial diff.

### Project settings (Six Paths)
- **Record files (Secretary):** progress log at `build-progress.md`, error journal at `errors.md` — both at project root, both already generated by scaffold-mvp
- **Code index (Watcher):** none currently
