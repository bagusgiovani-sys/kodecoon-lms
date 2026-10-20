# Build Progress — KOMS

## 2026-10-20 ? Production assignment publication backend

- Completed the unfinished assignment migration/validators with staff create,
  list, edit, publish, and archive APIs; added child-scoped family brief reads.
  Publication captures enrolled learners and lesson title/objective. Published
  content stays immutable; archived work remains readable by linked families.
- Added database types, composite center constraints, private retry receipts,
  authorization checks on replay, and link/lesson locking. Fixed missing student
  composite uniqueness and creation retries after course unlink/replacement.
- Verification: 52 assignment SQL assertions, actual API-handler adapter checks,
  all 126 existing RLS checks, forward migration preservation, and 69 course SQL
  assertions pass. Course API regressions pass. Lint has zero errors and the two
  existing graph-script warnings. Production build including TypeScript passed; mock session/credit and report
  download regressions pass. The policy dependency graph has no cycles.
- Backend only: no visual changes or browser QA. Production UI, submissions,
  reviews, explicit learner roster changes, and unenrollment submission closure
  remain pending. No remote migration/deployment. Live Auth/PostgREST and
  separate-connection race tests remain release gates (see migration README).

## 2026-10-19 — Historical class course links

- Added an active course link per class with retained assignment history. Existing
  classes start unlinked. Course and class composite foreign keys enforce center
  consistency; archived courses cannot be newly linked.
- Teachers can change links for their assigned classes; admins are scoped to their
  center. Reads and writes follow those checks in RLS and a narrow RPC. Direct writes,
  receipt reads, and TRUNCATE are denied. Link, replacement, and unlink requests are
  idempotent and preserve prior history.
- Added `GET/PUT /api/classes/:id/course`, types, a forward migration, fresh schema,
  grant harness, and migration/release notes. Existing class lessons and progress are
  not changed. Existing 126 RLS checks pass; the course database suite passes 69
  assertions and actual API adapter checks pass.
- No UI changes. Build/lint and browser checks are pending for this slice. Live
  Auth/PostgREST and separate-connection race checks remain release gates; no remote
  database migration was applied.

## 2026-10-19 — Production course library database and APIs

- Added reusable courses/lessons with owner/center consistency, bounded content,
  unique lesson positions, archive/restore, and server-generated audit timestamps.
  Existing class lessons and learner progress are independent and unchanged.
- Staff read their center library; teachers edit only owned courses and admins
  edit within their center. Parents/managers/anonymous users cannot browse it.
  Direct mutations and private receipt access are blocked by database policies.
- Added an authenticated, revision-checked write RPC with actor/request receipts
  for exact retries. Course and lesson-ID locks serialize edits and creation;
  authorization is rechecked before returning a prior result. Archived courses
  block lesson changes until restored. API lists use bounded stable-ID pagination.
- Added the forward migration, matching fresh schema/types, API routes, rollback
  and release notes. Migration preservation and all 126 existing SQL checks pass;
  52 new course SQL assertions and actual-handler adapter tests pass. Credit API,
  report download, and mock session/credit regressions also pass.
- Production build/TypeScript passed; lint has zero errors and the two existing
  graph-script warnings. No visual changes or browser QA in this backend slice.
- Limits: class/course links, assignments, submissions/reviews, family lesson
  access, and production library UI remain pending. No remote migration/deployment
  occurred. Live Auth/PostgREST and separate-connection concurrency checks remain
  release gates; sequential PGlite checks do not establish race safety.

## 2026-10-18 — Production credit ledger and atomic attendance billing

- Added protected student credit accounts, append-only entries, private request
  receipts, and per-session charge state. Admins record verified top-ups or signed
  corrections; staff and linked families have scoped balance/history access.
  The new credit card includes pagination, original/recorded dates, and current
  session date when visible and rescheduled. No payments are collected.
- The security-definer log_session_credits RPC explicitly validates staff/class/
  center/enrollment scope, locks session/accounts in consistent order, and commits
  notes, attendance, progress, balance, ledger, and receipt together. Revisions
  reject stale edits; request IDs prevent duplicate operations. Negative balances
  roll back the entire class log. Refunds preserve independent learning progress.
- Blocked direct attendance writes and billing-field edits; revoked the legacy
  session writer. A charged learner can be refunded after unenrollment. Existing
  sessions become exempt at migration cutover; no historical attendance is billed
  and no demo balance is imported. Verified opening balances require admin entry.
- Added credit read/adjustment APIs and wired live staff/parent pages. Session
  creation accepts a stable client ID; the form preserves request metadata through
  errors/refresh, including when the server discovers a newly created session and
  the unsaved draft must move from a class key to a session key.
- Verification: 126 SQL checks passed, including permission denial, exact retries,
  request reuse, stale revisions, insufficient credit, whole-class rollback,
  refunds, and ledger reconciliation. Both forward migrations passed preservation
  checks. Actual API-handler adapter tests and existing mock/report checks passed.
- Local Chrome verified credit history, admin/family controls, interrupted top-up/
  session-create/session-save retries through refresh, and consistent request IDs.
  No page errors or overflow at 360, 390, 768, 1024, 1440px; reviewed the phone
  screenshot. In-app browser failed on sandbox metadata. Temporary QA page removed;
  the fixture script/screenshots remain in Temp outside Git.
- Release limits: live Supabase Auth/PostgREST/Storage and separate-connection
  PostgreSQL race tests remain unverified. The local harness is sequential; locks
  are implemented but this is not concurrency evidence. Migration notes contain
  the required race scenarios. No remote migration/deployment was performed.
- Resume verification: production build including TypeScript passed; lint has
  zero errors and two existing graph-script warnings. Re-ran all 126 SQL checks,
  both migration preservation checks, credit API, mock session/credit, and report
  download regressions successfully. Browser evidence above is from the prior
  implementation session; it was not repeated during this verification pass.

## 2026-10-18 — Private reports and explicit family publication

- Production PDF export now stores a private object path and returns an
  authorized download route. Export does not publish to families. Teachers
  explicitly publish immutable final-text/PDF snapshots and can withdraw them
  from a persistent report history list; same-center admins can manage reports.
- Removed guardian access to source report rows, including raw notes and AI
  drafts. Parent profile API/page read only active published snapshots. Downloads
  check caller RLS before privileged Storage signing, use 60-second URLs, and
  reject forged draft object paths. Publishing requires uploaded object metadata.
- Added a transactional forward migration and matching fresh schema/types. Old
  reports remain private; no automatic publication. Snapshot retries are
  idempotent and cannot reopen withdrawn reports. See supabase/migrations/README.md
  for rollout, class-less legacy records, and existing signed-link limitations.
- Verification: 95/95 SQL assertions passed; disposable legacy migration retained
  existing private data. Actual download-handler tests with isolated adapters
  passed auth denial, RLS-hidden rows, forged paths, failures, and short-lived
  redirects. Mock credit/session regressions passed. Production build/TypeScript
  passed; lint has zero errors and two existing graph-script warnings.
- Local Chrome exercised the actual ReportEditor with fixture API responses:
  private export, stale-text publication disabled, explicit publish, history after
  refresh, and withdrawal. No page errors or overflow at 360, 390, 768, 1024, 1440px.
  Reviewed phone screenshot; controls use 44px minimum heights. Temporary QA
  page removed; script/screenshots remain in Temp, excluded from Git.
- Browser logs exposed a Base UI warning on PDF links rendered through Button;
  marked those controls as links with nativeButton=false and rebuilt successfully.
- Browser skill could not connect due to sandbox metadata; approved local Chrome
  supplied UI evidence. Tests do not establish live Auth/PostgREST/Storage behavior.
  No remote migration/deployment occurred. Legacy signed URLs are not revoked;
  new URLs can remain valid for 60 seconds after withdrawal. History is limited
  to the most recent 100 publications per student. Credits remain the next slice.

## 2026-10-17 — Production parity implementation design

- Added PRODUCTION-PARITY.md: entities/constraints, permissions, atomic credit
  transactions, submission/review history, publication boundaries, API contracts,
  migration sequence, and acceptance gates. Linked from README, PRD, and SDD.
- Recorded proposed ADR-005. Business defaults are explicit assumptions.
- Existing parent report policy lacks a publication boundary; implementation
  starts with published snapshots separated from private draft rows.
- Reviewed against schema.sql, mock data/session/learning behavior, report export,
  Storage setup, and local Next.js Route Handler documentation. Documentation-only
  change; no runtime or live database changes. Concurrency and live integration
  tests are specified future gates, not verification performed for this change.

## 2026-10-17 — Documentation baseline and architecture decisions

- Replaced the starter README with a KodeHub document index, run/check guidance,
  and next production-parity design work. Added ADR.md for existing decisions.
- Added current-scope PRD/SDD addenda distinguishing the July KOMS baseline,
  delivered demo, and unverified production behavior.
- Checked claims against the proxy, schema, Drive helper, mock regression checks,
  and delivery notes. All 75 local SQL checks and mock credit/session regressions
  passed this session. No runtime code changed or external project was modified.

## 2026-10-16 — Parent demo assignment submissions

- Parents/students in the local preview can now submit an HTTPS project link and
  reflection from their child’s assignment card, then submit another version
  after teacher feedback. The submission appears in the existing teacher review
  page and returns there after approval.
- Reused the HTTPS link validation and versioned submission record. Existing
  submissions and prior feedback stay in history. The dialog labels this as a
  demo submission saved only in the current browser; there is no production API,
  authenticated student account, or file upload.
- Browser verified rejection of an HTTP URL, successful HTTPS submission,
  persistence after refresh, teacher review/approval round trip, sibling privacy,
  and no horizontal overflow at 360, 390, 768, 1024, and 1440px. Zero page errors.
- Production build and TypeScript passed. Lint had zero errors and the same two
  pre-existing warnings. Credit/session regression checks passed.
- Local Chrome supplied browser evidence after the in-app browser failed on its
  sandbox metadata configuration.

## 2026-10-16 — Parent view of class assignments

- Added a read-only assignments card to each parent-preview child record. It
  shows each class project, due date, that child’s latest submission status,
  reflection, and teacher feedback. Students without a submission see a clear
  “Not submitted” state.
- Submission lookup is scoped to the selected student, so siblings in one class
  do not see each other’s work. The preview remains browser-local demo data.
- Verified own-child submission privacy and both submitted/not-submitted states
  at 360, 390, 768, 1024, and 1440px. No horizontal overflow or page errors.
- `npm run build` and TypeScript passed. `npm run lint` had zero errors and the
  same two existing RLS graph warnings. Session/credit regression checks passed.
- Browser QA used local Chrome because the in-app browser remains unavailable
  due to sandbox metadata. No live student auth or cloud-persistence behavior
  was exercised.

## 2026-10-15 — Demo workflow verification and report printing

- Exercised the production build in an isolated Chrome session: profile edits
  and credit top-ups survive refresh; feedback drafts stay hidden in parent
  preview and become visible after publication; an uploaded WebM survives
  refresh in IndexedDB and plays; HTTPS video links persist and embed correctly.
- Verified attendance deduction, duplicate-save protection, session date changes
  propagating to ledger/video records, and absence correction refunds in the UI.
- Found that parent report printing included the entire student record and
  teacher printing could include toast notifications. Added a shared dedicated
  print layout containing only the selected report, learner name, and date.
  Closing print removes the temporary layout and restores the workspace.
- Verified report drafting/publication and parent persistence, generated teacher
  and parent PDFs, reviewed print screenshots, and checked extracted PDF text.
  A 60-observation report exported across five pages with its final entry intact.
  Screen/print overflow checks passed at 360, 390, 768, 1024, and 1440px.
- Production build/TypeScript passed; lint has zero errors and the same two
  existing RLS harness warnings. Workflow browser run had zero page errors.
- In-app browser still failed on missing sandboxPolicy metadata; local Chrome
  ran with approved escalation. QA script/PDF/screenshots are in the local Temp
  kodehub-workflow-check.mjs and kodehub-workflow-qa directory, outside Git.
- Limits: browser print emulation/PDF generation does not verify a physical
  printer or every native print dialog. External YouTube/Drive playback remains
  dependent on sharing permissions/network. All workflows are browser-local
  demo behavior; live authentication, storage, and deployment remain pending.

## 2026-10-15 — Course, lesson, and assignment pages

- Continued the agreed LMS direction with five connected demo page types:
  course library, course detail, lesson workspace, assignments board, and
  assignment detail/submission review. Courses and Assignments are in the main
  navigation; class rosters link to their assigned course.
- Added three starter courses with six substantive lesson plans, search/subject
  filters, class linking, lesson editing, project briefs/due dates, class filters,
  enrolled-student selection, HTTPS project links, reflections, review outcomes,
  and versioned submission history.
- Kept the dark-blue modular layout, responsive grids, touch-sized actions,
  scrollable dialogs, and explicit labels for form controls.
- Existing browser-local records remain compatible through optional learning
  data. Credits, attendance, and original module progress are kept independent.
- Production auth/API behavior is unchanged; these pages are only rewritten in
  mock mode. Teacher-recorded submissions are explicitly labeled. Real student
  submission access, uploads, cloud persistence, and assessment rubrics remain
  future work. Detailed route inventory is in MOCK-MVP.md.
- Browser validation: all five new page types passed at 360, 390, 768, 1024,
  and 1440px (25 checks), with no document overflow or page errors. Verified
  search, class linking, lesson-edit persistence, assignment creation, rejection
  of non-HTTPS links, roster filtering, review/revision/approval persistence,
  retained earlier submission feedback, unique learner counts, and old-data
  compatibility (credits and attendance unchanged). Reviewed phone/tablet/
  desktop screenshots and a 360px submission dialog.
- Fixed two issues found in QA: explicit input/select labels and demo portal
  dialogs inheriting the same font as the main app.
- Final production build and TypeScript passed. Lint passed with zero errors
  and two existing warnings in the RLS graph harness. Credit/session regression
  assertions passed.
- Existing-page regression passed against the production build: six routes at
  360, 390, 768, 1024, and 1440px (30 checks), no document overflow or page
  errors; student search, record navigation, and credit dialog also passed.
  In-app browser connection remained blocked by missing sandboxPolicy metadata;
  the existing local Chrome regression script completed successfully.


## 2026-10-15 — Dark-blue responsive student experience

- User approved futuristic dark/blue styling, modular student cards, phone and
  tablet support, and documentation plus commit/push for each major change.
- Added DESIGN.md and persistent AGENTS.md guidance. Updated shared dark tokens
  and browser/PWA theme colors; navy surfaces, blue accents, visible focus.
- Added reusable StudentCard to demo student directory and parent hub: name,
  enrolled classes, credit balance/status, module progress, and record link.
- Wrapped student identity in its own card; improved shared panel surfaces,
  touch targets, mobile form text, reduced-motion and print styling.
- Chrome browser checks passed across six routes at 360, 390, 768, 1024, and
  1440px: 30 route/viewport checks, no document horizontal overflow or page
  errors. Student search, navigation, credit tab and top-up dialog also passed.
  Screenshots reviewed for phone, tablet directory, and desktop student record.
- Mock credit/session regression script passed. Final production build including
  TypeScript passed. Lint: zero errors, two pre-existing harness warnings.
- In-app browser was blocked by missing sandboxPolicy metadata; local Chrome
  checks ran with approved escalation. Live Supabase QA and full upload/print
  workflows remain outside this visual change's verification.
- Commit includes the previously uncommitted demo source required by these
  changes. Unrelated checkpoint archives and security slides are excluded.

> Started: 2026-07-17 | Last updated: 2026-10-06
> Read this at the start of EVERY Claude Code session before touching any file.

## Status
- [ ] Pending  [~] In Progress  [x] Done

## Current delivery — mock MVP (2026-10-06)

**User direction:** ship a quick fake-data demo with one-click login, student
video documentation, credits left, and end-of-module teacher feedback.
**Delivered:** mock mode is enabled by default; no service credentials are
needed. Open `http://127.0.0.1:3000/login` and press **Log in**.
Usage and persistence are documented in [MOCK-MVP.md](MOCK-MVP.md).

**Save checkpoint (2026-10-06):** implementation files and Markdown updates
are saved locally. Git staging is blocked: `.git/index.lock` cannot be created
under the current read-only Git permissions. A file checkpoint is saved at
`checkpoints/kodehub-mock-mvp-2026-10-06.zip`. `README.md` and
`KOMS-project-summary.md` could not be updated because writes to those files
were denied; current handoff information is in this log, `CLAUDE.md`,
`errors.md`, and `MOCK-MVP.md`. No commit or push was made.

- [x] Separate demo surface in `pages/demo.tsx`, routed through `proxy.ts`.
- [x] One-click teacher login and parent preview; six students and three programs.
- [x] Student profiles, class rosters, student creation, and profile editing.
- [x] Video documentation: local uploads up to 100 MB or HTTPS links; previews.
- [x] Credit balances, top-ups, ledger, attendance deductions, and correction refunds.
- [x] Module completion and editable teacher feedback; drafts hidden from parent views.
- [x] Session scheduling/rescheduling and attendance logging/correction.
- [x] Demo teacher records, program assignments, and curriculum module creation.
- [x] Local report drafts, teacher review, parent publication, and Print / Save PDF.
- [x] Browser-local persistence: localStorage for records, IndexedDB for video blobs.
- [x] `npm run build`: passed, including TypeScript.
- [x] `npm run lint`: zero errors; two existing harness warnings.
- [x] `node scripts/mock-check.mjs`: passed credit/session regression assertions.
- [x] Eleven demo routes returned HTTP 200 without Supabase credentials.
- [ ] Browser interaction, upload/playback, print, and visual/mobile QA.

**Verification limit:** the in-app browser failed to connect with a missing
`sandboxPolicy` metadata error. The fallback Chrome launch failed with
`spawn EPERM`. Route and logic checks do not replace browser QA.

**Next action:** manually exercise the demo at desktop/mobile widths, including
video upload + refresh, feedback draft/publication, session correction, and
report printing. To resume live Supabase work, set `NEXT_PUBLIC_MOCK_MODE=false`
and restart/rebuild, then address the production checklist below.

**Production scope remains open:** real auth, live Supabase/storage setup,
email callbacks and invite recovery, real session transaction/retry fixes,
remaining edit flows, Drive/AI/PDF integration, deployment, and live QA.
Mock completion does not mark those production items complete. The older
phase checklist and status notes below describe the original Supabase build.

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
- [x] Step 8: RLS verification — **EXECUTED AND PASSING as of 2026-08-27: 68 checks, 0 failures, `ALL CHECKS PASSED`.** Run it yourself with `npm run rls:verify`. This no longer needs Step 7 or Gio: `supabase/local-harness/` runs schema.sql and the harness against real Postgres 18 via PGlite (WASM, in-process, no Docker, no Supabase project) with a shim supplying only `auth.uid()`, `auth.users` and the anon/authenticated roles. **Executing it immediately found two more critical `42P17` policy-recursion cycles that three static passes had missed** — `students` <-> `student_guardians` and `classes` <-> `enrollments` — each masking the next, and between them making every parent-facing table plus the teacher roster and Log Session writes unqueryable. Fixed with two more security definer helpers (`is_staff_for_student`, `is_teacher_of_class`) following the Session 7 pattern; both return boolean so they disclose nothing. Added `npm run rls:graph`, which builds the policy dependency graph and reports cycles — the check that would have caught all three defects. Details in errors.md. Still worth re-running against the live project once Step 7 lands, since the shim does not cover Supabase's auth integration, PostgREST, or Storage. Prior static-audit history: **static audit done; harness written 2026-08-12 (`supabase/rls-verification.sql`), execution still needs Step 7.** The harness is 60+ per-role checks in one rolled-back transaction: it seeds two centers, two peer teachers, two families, an admin and an orphan auth account, then impersonates teacher / cross-center teacher / parent / admin / anon and asserts exactly what each can read and write. Every hole found in Sessions 5–7 has a named regression check. Run it straight after schema.sql — it is safe against production, since it ends in `rollback`. **Third pass (2026-08-12) found a critical defect: `users_admin_manage_center` was a policy on `users` that read from `users`, which aborts every statement touching the table with `42P17 infinite recursion` — the role lookup in proxy.ts runs on every request, so the app would have bounced every user to login on first boot.** Fixed with `security definer` helpers (`current_user_role()`, `current_user_center()`); `report_templates_select_staff` tightened from "any authenticated user" to actual staff in the same pass. Details in errors.md.
  Earlier passes: **static audit 2026-08-10, found and fixed a critical privilege-escalation hole**; the per-role live query test still needs Step 7. `users_update_own` had no `WITH CHECK`, so any parent could `update users set role='admin'` and inherit every admin policy — full access to all students' data. Fixed with an explicit `WITH CHECK` + a `before update` trigger blocking self-edits of `role`/`center_id`. Also hardened `student_guardians_all_teacher` (missing role filter), `classes_all_teacher` (unconstrained `center_id`), and added a `users_parent_has_no_center` CHECK so the invariant several policies rely on is enforced, not just commented. Details in errors.md.
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
- [x] Step 27: PWA manifest + install-to-homescreen — manifest, icons, theme color, iOS standalone meta done and verified in the build output. Installable from the browser menu. **Decision (Gio, 2026-07-22): online-only, no service worker.** Classroom wifi is reliable, offline is unrequested in BRD/PRD/SDD, and a cache layer over minors' data carries risk with no matching benefit. Final install verification happens post-deploy at Step 30, since installability needs HTTPS.
- [~] Step 28: Dark mode QA — **static pass done**, runtime pass blocked on the DB. Audited every `app/` + `components/` file for hardcoded color, light-mode-only palette classes, and theme handling. Findings fixed: Toaster resolved its theme from the OS while the app pins dark; modal scrim (`bg-black/10`) invisible against `#030d12`; no `prefers-reduced-motion` support anywhere despite two infinite CSS loops and an infinite Journey pulse. Verified clean: no hardcoded hex in components (the three hits are PWA metadata + React PDF, both of which can't take CSS vars); `themeColor` `#030d12` matches `--background` exactly; tables already wrap in `overflow-x-auto`. Note: `<html>` pins `dark` unconditionally, so there is no light mode to QA — the light `:root` block is an unused fallback.
- [~] Step 29: Responsive QA — **static pass done, clean.** Audited every layout-bearing file. The low count of `sm:`/`md:`/`lg:` prefixes (35 across 75 files) is not a gap: the layouts use intrinsically-responsive patterns instead — `AppNav` scrolls its tabs via `min-w-0 flex-1 overflow-x-auto` with `shrink-0` items, every table wraps in `overflow-x-auto`, and grids are mobile-first (`grid gap-4 sm:grid-cols-2 lg:grid-cols-3`). No fixed pixel widths outside two shadcn primitives. Runtime pass at three breakpoints still needs a live DB.
- [ ] Step 30: Vercel deploy

---

## Session Log
| Session | Date | Steps completed | Token % at close | Notes |
|---------|------|-----------------|-----------------|-------|
| 1       | 2026-07-17 | 1–6, 10–12 (partial 7), API layer | — | Scaffold, tokens, backend files, all API routes |
| 2       | 2026-07-17 | 14–17 | — | All feature components |
| 3       | 2026-07-17 | 18–26 | — | All pages, guards, root layout; tsc + eslint clean |
| 4       | 2026-08-09 | 28 (static half) | — | Dark-mode + motion audit; 3 fixes; tsc/eslint/build clean, verified in compiled CSS |
| 5       | 2026-08-10 | 8 + 29 (static halves) | — | **Remote found compromised — see Security below.** RLS audit: critical parent→admin escalation fixed. Report-route timeout/token fixes. Responsive audit clean. |
| 6       | 2026-08-10 | 8 (second pass) | — | Full route re-audit: Log Session trusted client-sent studentId (cross-class record corruption) — fixed in route + RLS. staff-login half-provisioned UX. Push still blocked on credential rotation. |
| 7       | 2026-08-12 | 8 (third pass + harness) | — | Remediation push confirmed landed; remote clean. Found `users_admin_manage_center` self-referencing → 42P17 on every query touching `users`; fixed via security definer helpers. report_templates opened to parents — tightened. RLS verification harness written, ready to run the moment Step 7 lands. |
| 8       | 2026-08-27 | **8 + 13 (RLS half) DONE** | — | Ran the harness for the first time via PGlite — no Supabase project needed. Two more 42P17 recursion cycles found and fixed; 68/68 checks pass. Committed the runner so it is repeatable. `.env.example` corrected. |
| 9       | 2026-10-06 | Mock MVP delivered | — | One-click demo login, student videos/credits/module feedback, browser persistence, scheduling/attendance, parent preview, reports. Build, lint, credit regressions, and 11 HTTP routes checked. Browser QA remains pending. |
| 10      | 2026-10-16 | Atomic session logging | — | Session status, notes, attendance, and lesson completion now commit through one authenticated RLS-scoped RPC; validation prevents cross-class writes and duplicate keys. Video storage is idempotent and remains best-effort. Local harness passes 75/75, policy graph is cycle-free, mock checks and production build pass; lint has 0 errors and 2 existing graph-harness warnings. Production Supabase setup and live-project verification remain pending project credentials/selection. |

---

## Security incident — 2026-08-10
`origin/main` was **force-pushed with malware** (rewrote `2b23648` → `300f1e7`, preserving Gio's name, email, author date, and commit subject). Two payload files:
- `postcss.config.mjs` (94 B → 9328 B): obfuscated RCE backdoor hidden after `export default config;` behind a long whitespace run. Resolves its C2 by reading the latest transaction from a hardcoded ETH address and decoding the `to` field as two IPv4 addresses, then fetches XOR-encrypted payloads, `eval`s them, and `spawn`s them detached. Executes on **every `next build` / `next dev`**.
- `.gitignore`: deletes the `.env*` line and adds `config.bat` — so the next routine `git add -A` would sweep `.env.local` (Supabase service-role key, Anthropic key, Google OAuth secret) into a commit pushed to the attacker, while a dropped `config.bat` stays invisible to `git status`.

**This machine was never infected** — the commit was fetched but never checked out, and `git fetch` doesn't touch the working tree. Local `postcss.config.mjs` is still the original 94 bytes; no `config.bat`; no IOC matches in tracked files or `node_modules`; no git hooks; git config clean. `CLAUDE.md` and `build-progress.md` on the malicious commit are byte-identical to ours — no prompt injection. Committer timezone on the malicious commit is **+0200**; Gio's is **+0700**.

**RESOLVED 2026-08-10 05:53 +0700 — clean history restored.** The force-push landed: `origin/main` is `51f02f0`, confirmed live via `git ls-remote`, and the malicious `300f1e7` is no longer reachable from the branch. Re-verified 2026-08-12: no IOC matches in tracked files, `postcss.config.mjs` still 94 bytes, `.gitignore` still carries `.env*`, no `config.bat`, no git hooks installed.

**Still open, and Gio's call:** the malicious commit's objects survive in the remote's object store until GitHub garbage-collects them, so anyone with the SHA can still fetch `300f1e7` directly. If credential rotation, PAT/SSH-key revocation, the security-log review (`git.push` events, to find how the attacker got write access), and branch protection with force-push disabled have not all happened, they still need to — restoring the branch closed the symptom, not the entry point.

---

## Original Supabase Status (historical; see current mock delivery above)
**Last completed:** Step 8's third static pass (2026-08-12) — the `users` policy recursion fix and the RLS verification harness. Before that, Step 27 (partial) — PWA manifest at `app/manifest.ts`, icons generated from the design tokens (`scripts/generate-icons.mjs` → teal-on-dark K monogram, incl. a maskable variant), `themeColor` + `appleWebApp` in the root layout. tsc + production build pass; `/manifest.webmanifest` verified serving valid JSON as `application/manifest+json`.
**In progress:** — Phase 6 is blocked below Step 27; Phase 3 is blocked at Step 7.
**Settled (2026-07-22):** KOMS is **online-only**. No service worker, no offline mode. Installable from the browser menu, which satisfies BRD's "install-to-homescreen"; the automatic install banner is skipped since it would require a service worker. If offline ever comes up, the version worth building is "never lose a session log" (queue writes offline, sync on reconnect) — a scoped feature with conflict-resolution design, not PWA polish.
**Next action (updated 2026-08-27):** Step 8 is now genuinely closed — the harness has been executed and passes 68/68. What is left is entirely credentials: Steps 7, 9, 13 and 30. Nothing further can be verified locally without them. Re-checked 2026-08-12: `.env.local` still absent, Docker still not installed, so a local `supabase start` stack remains unavailable. The Supabase CLI itself is present (2.113.0), so only the project and its credentials are missing.

**The run order once a project exists**, now that the harness is written — schema.sql → `supabase/storage-setup.sql` (the private `reports` bucket; `app/api/students/[id]/report/export/route.ts` uploads to it and signs URLs from it, so the export route 404s on its own storage call without this — it was missing from this list until 2026-08-12) → `supabase/rls-verification.sql` (expect `ALL CHECKS PASSED`; any failure is a boundary hole, stop and fix before going further) → create Gio's auth user in the dashboard → seed.sql → `npx supabase gen types typescript > types/database.types.ts` (the two new helper functions will appear under `Functions`) → fill `.env.local` → `npm run dev` for the runtime halves of Steps 8, 13, 28 and 29 that no static pass can reach. That closes Steps 7, 8, 9 and 13 in one sitting.

**Blocking on Gio, in priority order:** (1) the remaining security remediation — the branch is restored, but credential rotation, PAT/SSH revocation, the push-log review and branch protection are what actually close the entry point; (2) Steps 7–9 + 13.

Steps 8, 28, and 29 have now been taken as far as static analysis allows (see those steps above). What remains genuinely needs a running app against real data: executing the RLS harness, rendering each of the three route groups to check contrast and layering in situ, and exercising desktop/tablet/mobile breakpoints on screens whose height depends on row counts (roster, schedule calendar, journey with a full 24-lesson plan). Step 30 (Vercel deploy) also waits on Steps 7–9, since the deploy needs the same env vars.

**A note on how much static review is left worth doing.** Three passes over the same schema have now found three separate critical defects, and the third — a policy that would have made the app unbootable — sat in the most-reviewed file in the repo through two prior audits. The honest read is not that a fourth pass would find nothing, but that the returns have shifted: what is left is the class of bug that only a running Postgres reports. Step 7 is now the highest-value unblock in the project by some distance, ahead of any further reading.
