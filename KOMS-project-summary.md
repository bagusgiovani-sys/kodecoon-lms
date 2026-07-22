# KOMS — Project Plan Summary
> Kodecoon Operations Management System | Summary generated 2026-07-20
> Sources: BRD.md, PRD.md, SDD.md, schema.sql, CLAUDE.md, build-progress.md, errors.md

---

## 1. What It Is

**KOMS** is a solo-built, installable PWA for **Kodecoon Academy Indonesia** — a robotics/coding school. It unifies class scheduling, session attendance, video documentation, and AI-assisted progress reporting into one source of truth.

**Built by:** Gio, solo, with Claude Code. Gio is simultaneously the teacher, the admin, and the developer.
**Budget:** Zero — free tiers only (Vercel, Supabase, Google Drive).
**Deadline:** July 31, 2026.

### The problem it solves
Today, Kodecoon spreads its operations across three tools that disagree with each other:
- **OClass** — a generic Singapore class-management SaaS built for dance studios and gyms, not a credit-based robotics curriculum
- **An Excel sheet** — separate credit tracking
- **A manual Telegram → WhatsApp relay** — teacher uploads a video to Telegram, a manager remembers to forward it to parents

When a parent disputes an absence or a credit deduction, nobody can produce one trustworthy record. Video documentation depends entirely on two people remembering to do a manual step.

### The critical political constraint
**Kodecoon's owner does not know this project exists.** There is no organizational mandate. This single fact shapes the entire scope:
- V1 must be fully usable by Gio alone, on his own classes, with nobody else's approval
- Org-wide rollout (replacing academy scheduling, onboarding other teachers) is deliberately **V2, gated on owner buy-in**
- Because the data involves **minors**, keeping the pilot scoped to Gio's own students — rather than pulling in other teachers' student data unsanctioned — is a deliberate risk boundary, not a technical limit

**The plan:** build and prove the pilot solo → demo a working system to the owner → expand org-wide only after buy-in.

---

## 2. Scope

### V1 — In (by July 31)
| Area | What ships |
|---|---|
| **Session record** | Attendance + Google Drive-backed video upload with in-app preview |
| **Progress ledger** | Lesson-completion tracking, replacing Excel + OClass credit checks |
| **Scheduling** | Calendar for Gio's own classes only |
| **AI reports** | Rough teacher notes → Claude-drafted report text → human-edited → PDF export |
| **Parent portal** | Magic-link login, Student Profile, snake-path Journey view, downloadable reports |
| **Admin screens** | Manage Teachers, Academy Schedule, Manage Lesson Plan, Center Switcher |
| **Multi-tenancy foundation** | `centers` table + center-scoped queries from day one (only 1 center seeded) |

### V1 — Explicitly Out
Academy-wide scheduling for all teachers · Payments/invoicing (stays on OClass) · CRM/lead management · Automated WhatsApp Business API push (the parent portal replaces the need) · Parent account self-editing (portal is strictly read-only) · Self-service report-template editor · Center Manager screens (role exists in schema, no UI) · OClass data migration (Gio has no admin access — everything starts fresh)

### Key conceptual decision
The old flat **"credit"** concept was replaced by **lessons**. A class has an ordered lesson plan (e.g. 24 lessons for RCB); a completed lesson *is* the progress unit. This is what makes the Journey view possible — each lesson is one node on a winding path, instead of a number in a spreadsheet.

---

## 3. Users & Roles

| Role | V1 status | Access |
|---|---|---|
| **Teacher** (Gio) | Active | Full read/write on his own classes |
| **Admin** (also Gio) | Active | Center-scoped management screens |
| **Parent/Student** | Active | Strictly read-only, own linked child only |
| **Center Manager** | Schema only | RLS-ready, no UI in v1 |

**Auth split:** staff use email + password; parents use magic link only (no password ever exists for that role). Teacher accounts are created via an admin invite flow — **there is no public signup form, by design.**

---

## 4. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript strict |
| Database + Auth | Supabase (Postgres + RLS), `@supabase/ssr` |
| Styling | Tailwind + shadcn/ui |
| Animation | Framer Motion (the Journey path) |
| Server state | TanStack Query |
| Validation | Zod |
| AI | Anthropic SDK, server-only |
| PDF | `@react-pdf/renderer` (serverless-friendly, not headless Chrome) |
| Video | Google Drive Picker (client) + Drive API v3 (server) |
| Deploy | Vercel |

### Architecture principles
- **Video never touches the server or DB as bytes.** The Drive Picker runs client-side; the server stores only a file ID and link. This was flagged as the #1 infra risk in the BRD — it's the reason the whole video pipeline is shaped this way, and it protects the free tiers from video bandwidth.
- **RLS is the real security boundary.** App-layer role checks in middleware are UX (fast redirects, clear errors) — never the only thing between a parent and another family's data.
- **No derived counts stored as columns.** Lesson totals come from `COUNT(lessons)`, progress from `COUNT(student_lesson_progress WHERE status='completed')`. Deliberate — avoids a second source of truth.
- **Center-scope every admin query** from day one, even with one center, so Singapore expansion isn't an expensive retrofit.
- Route protection lives in `proxy.ts` (Next 16's renamed `middleware.ts`): three route groups, three rules.

---

## 5. Screens

**Teacher:** Login · Dashboard (My Classes) · My Schedule · Class Roster · **Log Session** (the core screen — attendance + video + notes + lesson completion in one flow) · Student Detail · Generate Report · Add/Edit Student · Add/Edit Class

**Admin:** Manage Teachers · Academy Schedule · Manage Lesson Plan · Center Switcher (persistent header dropdown, not a screen)

**Parent/Student:** Magic-link Login · Student Profile (avatar, active/completed program cards, reports) · **Journey** (snake-path lesson nodes — the single most important animated surface in the app)

---

## 6. Data Model (11 tables)

`users` (role: teacher/center_manager/admin/parent) · `centers` · `classes` · `students` · `enrollments` · `lessons` (the curriculum template) · `student_lesson_progress` (replaces the old credits ledger) · `sessions` · `attendance` · `session_videos` (link only, never bytes) · `reports` + `report_templates` · `student_guardians` (supports multiple kids per parent and multiple guardians per kid)

---

## 7. Build Status (as of last session, 2026-07-17)

### Done
- **Phase 1** — Next.js 16 scaffold, all packages installed, git initialized
- **Phase 2** — Design tokens (Claude Design never delivered → PRD fallback used: dark default, blue-green primary, maroon/red + blue accents), `globals.css`, component inventory
- **Phase 3 (partial)** — `proxy.ts` route guards, `database.types.ts`, `seed.sql`, and **every API route handler** per SDD §3
- **Phase 4** — shadcn/ui init (21 primitives), all feature components (AttendanceList, VideoPicker, LessonChecklist, JourneyNode/JourneyPath, CenterSwitcher, etc.)
- **Phase 5** — **All pages built.** All three layout guards, staff + student auth, Dashboard, Schedule, Roster, Log Session, Student Detail, Student Profile, Journey, Manage Lesson Plan, Generate Report, Manage Teachers, Academy Schedule
- eslint + `tsc` + production build all pass — 39 routes + proxy

### Blocked — needs Gio personally
These are the only things standing between "code complete" and "working app":
- **Step 7** — Create the real Supabase project, run `schema.sql`
- **Step 9** — Fill `.env.local` with Supabase / Anthropic / Google credentials
- **Steps 8 + 13** — Verify every RLS policy with a manual test query per role, then verify seed data against RLS

### Remaining after unblocking (Phase 6)
Step 27 PWA manifest · Step 28 dark mode QA · Step 29 desktop/tablet/mobile responsive QA · Step 30 Vercel deploy

**Bottom line: the app is fully built but has never run against a real database.** Everything is waiting on the Supabase project being created and credentials filled in.

---

## 8. Known Issues Already Resolved (errors.md)

1. **create-next-app clobbered CLAUDE.md** — Next 16's scaffold emits its own `CLAUDE.md` (a one-line `@AGENTS.md` pointer); a forced move overwrote the 19KB project file. Restored. *Rule: never `-Force` a merge into a non-empty directory without diffing both sides first.*
2. **lucide-react `Map` icon shadowed the global `Map`** — `new Map()` targeted the icon component, cascading bogus type errors. *Rule: alias lucide icons that collide with JS globals.*
3. **proxy.ts infinite redirect loop** — an authenticated session with no `public.users` row bounced between `/dashboard` and itself until cookies were cleared. *Rule: every role-based redirect needs an explicit branch for "authenticated but unprovisioned."*

---

## 9. Hard Rules (from CLAUDE.md §11)

- App Router only — never the Pages Router
- No `useEffect` for initial data fetching — Server Components fetch directly
- Service-role key and Google OAuth secret **never** in a `NEXT_PUBLIC_` var
- `@supabase/ssr` only — `@supabase/auth-helpers-nextjs` is deprecated
- Never trust a client-sent `studentId` / `teacherId` / `centerId` for authorization
- Never skip RLS on a new table
- Never store raw video bytes anywhere
- Never auto-send an AI report without human review — the teacher must see and can edit the draft, every time
- Parent-facing routes must **never** use the service-role client
- Integers only for `sequence_number` — no float-based reordering

---

## 10. Working Process — "Six Paths of Pain"

Sessions run a **King & Warrior** pattern for token efficiency. The King (main session) plans, makes architecture calls, and reviews everything. The Warrior (`.claude/agents/warrior.md`, one model tier down) implements — but only for tasks that are fully specified, self-contained, and big enough to justify a cold spawn. Otherwise the King does it directly.

Supporting paths: **Reality Checker** (verify fast-moving external APIs via web search, never from memory) · **Secretary** (keep `build-progress.md` and `errors.md` in sync; commit and push often without being asked; only commit states that pass `tsc --noEmit`) · **Inspector/Devil's Advocate** (`/security-review` for anything touching auth, RLS, or the parent/student boundary — which is most of this app, given it's minors' data).

---

## 11. Open Questions

1. No OClass historical data migration is possible — Gio lacks admin access. Everything starts fresh. Confirm that's acceptable.
2. **i18n has not been built.** English default with a Bahasa Indonesia toggle was resolved as a requirement back in the PRD, and the PRD explicitly warned that retrofitting i18n after screens are hardcoded in English is "real, avoidable rework." All screens are now built. This gap is worth a decision.
3. Success metrics and failure condition in the BRD are inferred, not confirmed.
4. What "KOMS" actually stands for (cosmetic).
