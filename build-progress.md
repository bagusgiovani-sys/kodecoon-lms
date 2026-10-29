# Build Progress — KOMS

## 2026-10-28 - Straight logo-reveal wire and selector redesign

- Splash wire is a single straight vertical path from the Kode Nexus title to the
  reveal point. It fades away after arriving; the Kodecoon logo and “Beyond Coding”
  tagline are concealed until the arrival. Removed the loading bar.
- Login and workspace header use a cropped Kodecoon icon only, beside “Kode Nexus by
  Kodecoon.” Login logo reveals bottom-up with slow upward streams.
- Replaced native center/theme selects with matching animated option menus. Renamed
  palettes Ion Blue, Inferno Red, Emerald Green and Obsidian Mono; increased red saturation.
- Splash duration allows the logo reveal and scan to complete. TypeScript passes.

## 2026-10-28 - Logo reveal wire and login branding

- Replaced splash grid/rain backdrop with a still, soft-focus deep-space palette.
- Added one glowing SVG wire that draws upward from the Kode Nexus title to a point;
  the point triggers a bottom-up Kodecoon logo reveal and the existing logo scan.
- Added the Kodecoon logo and a slow upward stream treatment to the staff/parent login.
  Main workspace header now reads “Kode Nexus by Kodecoon” with the logo.
- `npx tsc --noEmit` passes; no browser preview was run.

## 2026-10-28 - Refine splash movement

- Removed the butterfly overlay and expanding pulse rings from the splash.
- Kept the data streams, reversed their travel to bottom-to-top, and slowed each to
  6–9.3 seconds with staggered starts for a calmer, rain-like movement.


## 2026-10-28 - Restore the Framer Motion animations

- Found the root cause of static motion: the app-wide MotionConfig used
  `reducedMotion="user"`, which strips transform animations, and the demo repeated that
  setting. On systems requesting reduced motion, some splash code also explicitly set
  moving elements to static states.
- Set the demo/app MotionConfig to `never` for the motion-heavy experience, and removed
  splash branches that froze movement. The selected top navigation now uses a persistent
  Web Animations API indicator that slides between active tabs.
- Rebuilt the splash with three center-outward expanding pulse rings, counter-rotating
  HUD rings, falling data streams, a traveling logo scan, moving loading bar and separate
  flapping butterfly wings. Page/section entrances have more visible movement.
- `npx tsc --noEmit` passes. Browser playback was not run in this pass.

## 2026-10-28 - Four HUD palettes and visible motion

- Added persistent Visual theme selector: Azure Command, Crimson Orbit, Emerald
  Terminal and Obsidian Signal. Palette tokens cover nested dark surfaces and portals.
  Added faint grid, sharper panel outlines and stronger selected-navigation treatment.
- Fixed page entrances occurring behind the splash: content now mounts after its
  2.4-second presentation. Framer Motion staggers panels, animates shared tab indicators,
  student tab interactions, counter-rotating splash rings and moving logo scan/text.
  Reduced-motion preference remains supported.
- TypeScript and lint pass (two existing graph.mjs warnings). Five isolated browser
  checks passed for distinct palettes at 360/390/768/1024/1440, persistence, navigation
  indicator, changing splash transform and reduced-motion readability.
  Evidence: C:/Users/kodec/AppData/Local/Temp/kodenexus-browser-1793177171575.
- Official hosting terms/limits reviewed in docs/hosting-assessment.md. Vercel Hobby
  is unsuitable for this commercial academy use. No deployment performed.

## 2026-10-28 - Class groups, 12-class feedback PDFs and completion certificates

- Added center-scoped Class Groups cards, codes, schedules and learner links.
- Revised splash order and typography: logo, close Beyond Coding tagline, large spaced
  blue animated Kode Nexus. Reduced-motion support retained.
- Feedback now follows every 12 unique Present records across centers, independently
  of module completion. Added dedicated PDF generation/upload and publication page,
  historical versions, due/upcoming status, five skill grades and grade legend.
- Completed learner modules support certificate PDF upload and parent download in a
  separate Certificates tab. Existing text reports and additional notes are preserved.
- PDFs are stored in IndexedDB and metadata in localStorage; this is a browser-local
  demo, not production parent delivery. Real finance security and shared private document
  storage remain required. Parent UI denies staff routes, finance and unrelated children.
- Verified: TypeScript, production build, helper/session regression checks; lint has only
  two pre-existing graph.mjs warnings. Nine isolated Chrome checks passed: center cards,
  pre-12 blocking, actual PDF generation across centers, report upload/version history,
  certificate upload, five responsive widths (360/390/768/1024/1440), parent access/download
  controls, denied routes and splash wording. Generated PDF signature/content checked.
- Browser evidence: C:/Users/kodec/AppData/Local/Temp/kodenexus-browser-1793176318375.
  Built-in browser connection was unavailable; used isolated headless Chrome fallback.

## 2026-10-28 - Dashboard previews, center course activity and digital splash

- Added a dashboard-only center selector. It reads academy records for that dashboard
  without changing the main workspace/session selection. Other tabs retain the main
  center; returning to Dashboard resets the preview. Cross-center previews show summaries
  and direct staff to the main selector before opening another center's learner records.
- Courses now shows courses taken in the main center, ordered by distinct active learners
  descending (title breaks ties). A separate /courses/library view includes all courses,
  including zero-enrollment entries. Competition replaces Engineering in the subject
  filter, course labels and new demo seed; legacy categories normalize for display.
- Added optional library course links to individual module editing. Counts deduplicate
  learners, exclude completed-only records and other centers, and prefer individual
  links over old class-course defaults. Unlinked custom modules display a clear notice.
- Replaced the white logo splash with the user's transparent PNG, blue/cyan logo mask,
  scanning illumination, orbit and flowing data trails, plus "Beyond Coding". The source
  PNG is unchanged. Animation uses Framer Motion and honors reduced-motion settings.
- Verification: TypeScript, lint (only the two pre-existing graph.mjs warnings), optimized
  production build, and helper regression suite passed. Helper checks cover unique course
  counting, completed/other-center exclusion and precedence over class defaults.
- All eight targeted Chrome workflow checks passed with no captured runtime exceptions:
  dashboard scope/reset, main selector changes, library/filter, counts/order, center
  isolation, layouts at 360/390/768/1024/1440px, digital splash and reduced motion.
  Reviewed desktop/mobile course views and splash; final previews are in docs/previews.
- Changes apply to the browser-local MVP. Existing demo records are preserved; there are
  no SQL migrations, production authorization changes, commits or pushes in this slice.

## 2026-10-28 - Center workspaces, documentation-only family view and loading experience

- Latest user direction supersedes the earlier requirement for student assignments:
  removed assignment navigation, parent project/submission UI, and demo assignment
  creation/review screens. Old assignment URLs show a retirement message; existing
  stored history, production APIs and schema remain intact. Parent demo writes are denied.
- Center selection now sits above navigation. Center cards open Dashboard; Schedule
  has a separate tab and retains the weekly timetable. Summary cards show learner/class
  counts, low credits (<=2), classes today, weekly activity and documentation coverage.
- Center scope filters demo students, class records, attendance, documentation,
  learner modules, assigned teachers and student-linked finance records. Canonical
  writes retain the complete academy dataset. Course content is shared academy-wide.
  Payment records lack transaction-center attribution, so this is not center revenue
  accounting; a learner enrolled across centers can appear in several views.
- Added an isolated demo navigation adapter using browser history; this avoids
  Pages/App Router alias data requests losing the proxy's path parameter. Route changes
  retain the shell; direct links and refresh still use the existing server demo rewrite.
- Added the user-supplied Kodecoon logo, cocoon/butterfly splash on full loads, Framer
  Motion page/student-tab/chart/hover/press transitions, and reduced-motion support.
- Finance, profiles, attendance and course workspaces are dynamically loaded with
  skeleton fallbacks. Video cards defer blob reads until near view; embeds lazy-load.
  Search waits 250 ms; shared buttons reject repeat clicks within 500 ms. Uploads
  also use an in-flight lock; finance keeps its existing operation-ID retry protection.
- Confirmed uploaded files remain in browser IndexedDB, not Supabase or Google Drive.
  The documentation dialog now states this explicitly. Drive links can be embedded;
  automated private academy Drive uploads and verified family playback remain pending.
- Verification: TypeScript, lint and optimized production build passed. Lint retains
  only the two existing graph.mjs warnings. Both local helper suites passed, including
  new center-scope isolation/non-mutation checks. The original 14 browser regression
  checks passed (editable student/class/module, payment/receipt/retry, attendance,
  refresh, guardian restrictions and staff role parity). Additional workspace checks
  cover center switching, browser history, debounce, duplicate documentation saves,
  removed assignment controls, route guards and widths 360/390/768/1024/1440.
  All 12 additional browser checks passed with zero captured runtime exceptions;
  verified normal butterfly animation and reduced-motion behavior. Reviewed desktop,
  mobile and splash screenshots in docs/previews/kodenexus-center-dashboard*.png
  and docs/previews/kodenexus-splash.png. Total: 26 browser workflow checks passed.
- Demo only: browser storage and simulated accounts are not production authorization.
  No live Drive/finance integration, schema migrations, commit or push in this slice.
  Current usage and limitations: docs/kodenexus-mvp.md.

## 2026-10-28 - KodeNexus editable academy demonstration

- User chose KodeNexus and requested an immediately usable demonstration with
  staff-entered student/class data. Finance is a first-party staff section; there is
  no external payment application dependency. Updated displayed name and app metadata.
- Added STB/PIK/BSD center cards, weekly timetables and class-code rosters. Staff can
  add centers, create/edit class codes, teacher/day/time and duration, create/edit
  students/guardians, and enrol existing learners. Dated recurring slots preserve
  earlier schedule records; student enrolment changes retain a history.
- Individual learner modules and lesson counts are editable independently of classmates;
  Journey, roster summaries and parent profiles use those records. Existing saved demo
  balances/progress are preserved by a repeat-safe upgrade. Larger profile photo display.
- Staff Finance records whole-IDR amounts, references, method/date and optional local
  receipt files. Payment/credit grants save together, exact retries do not grant twice,
  changed-payload retries conflict, and parent credit history excludes monetary details.
- Added per-tab teacher/center-manager/guardian demo identities. Parent routes restrict
  views to email-linked children and deny staff, finance, peer-child and report-edit
  paths; parent writes are limited to new work submissions for their own enrolled child.
  Both staff roles have equal demo access. Internal class notes are hidden from parents.
- Present / Leave / Absent replaces Attend / Izin / MIA labels while retaining the
  legacy stored status codes and billing transitions. Present->Absent never charges
  twice; correction to Leave refunds the charge. Old `absent` history remains free.
- Verification: TypeScript and production build passed. Lint has zero errors and the
  two existing graph-harness warnings. `node scripts/nexus-demo-check.mjs` and
  `node scripts/mock-check.mjs` pass. Local Chrome passed 14 workflow checks including
  create/edit, guardian scope, payment receipt/double-click, refresh and credit corrections.
  Five screens passed overflow checks at 360/390/768/1024/1440px; screenshots inspected.
- Browser skill connection failed with the existing sandboxPolicy metadata error;
  used local headless Chrome. Driver, fixture receipts/results/screenshots remain in Temp.
- This is a browser-local demonstration, not deployed Supabase auth/finance, secure
  shared storage, live payment collection or private Drive integration. No migrations,
  real credentials, live account data, commits or pushes were used. New guide:
  `docs/kodenexus-mvp.md`. Dedicated graded module reports, Hall of Fame and the full
  supervising checklist workflow remain outside this editable-data demonstration slice.

## 2026-10-28 - Table-based ERD handoff export

- Replaced the shareable PDF with `docs/erd/KodeHub-ERD-and-Data-Ownership.pdf`:
  field-level PK/FK tables, types, orthogonal connectors and crow's-foot markers.
- Presents one logical model based on confirmed academy-wide individual learning,
  without current/proposed comparison sections. The model defines integration
  requirements and does not claim the database changes have been deployed.
- Added source model, 41 entity dictionaries and all 69 FK relationships in CSV.
  Shared-core ownership and finance exclusions are explicit; the colleague's physical
  schema still requires integration mapping. Preserved internal audit sources.
- Rendered all 13 pages and checked text bounds, entity/FK coverage and relationship
  register completeness; visually inspected diagrams. No application code, database,
  security settings, commits or pushes changed.

## 2026-10-28 - Shareable ERD review and checklist analysis

- Added `docs/erd/KodeHub-ERD-Review-2026-10-28.pdf`, a 13-page review separating the
  existing 38-table local schema from proposed individual-learning/checklist models.
- Read and visually inspected the supplied three-page teacher checklist: 38 checkbox
  items across eight stages; the third page is guidance, not extra scored tasks.
- Included selected-key diagrams, ownership proposals, finance exclusion, report
  grading, family/staff boundaries, complete table inventory and editable references.
- Document checks cover all 38 table names, page text bounds, reference extraction
  and new Markdown files under 300 lines. Rendered all pages for visual inspection.
- The colleague's migrated schema remains unknown. Proposed models are not migrations.
  No app/runtime tests, database changes, security changes, commits or pushes occurred.
  See `docs/erd/README.md` for evidence, limitations and regeneration instructions.

## 2026-10-25 - Daily attendance, private student media, and feedback formatting (in progress)

- Added production and demo daily attendance views, shared profile controls, credit-safe MIA/Attend/Izin corrections, weekly rosters, profile photos, private media upload/read paths, a staff learner selector, feedback outlines and PDF word styling.
- Hardened data access: peer balances are redacted, MIA lesson completion is rejected, manual sessions are reused, RPC-only tables have deny policies, and family media reads only finalized records for their linked child.
- Local PGlite RLS harness: 159/159 checks pass, including migration, billing/retry, roster access, pending/final media, and parent/peer boundaries. TypeScript and production build pass. Lint has zero errors and two existing graph-harness warnings. `git diff --check` passes.
- Headless Chrome confirms MIA deduction, Attend correction without a second deduction, Izin refund, shared profile attendance, and no overflow at 360/390/768/1024/1440px. Browser testing ran against demo-local records, not Supabase. No project, credentials, live schema, or storage bucket were accessed.
- Still open: broader authorized multi-center access; retry/race hardening and production-route tests; live storage upload verification; review generated feedback publication across staff/family profiles; multilingual and production responsive QA. Apply `supabase/student-media-storage.sql` in the Supabase SQL Editor only after the project bucket exists. The user has explicitly requested a push of this in-progress slice; do not describe it as fully complete or deployed. Live Supabase setup remains pending.

## 2026-10-24 - Daily attendance and student profile expansion (paused)

- User requested Daily Attendance by date/time and center, editable rosters,
  Attend/MIA/Izin status controls, shared profile attendance, profile photos,
  video uploads with descriptions, and customizable feedback/PDF generation.
- Confirmed billing: Attend and MIA cost one credit; Izin and unmarked cost zero.
  Started local demo/production attendance components, weekly roster RPCs,
  migration changes, and private media metadata/storage setup SQL.
- Work is unfinished and unverified. No live Supabase changes, deployment,
  commit, or push. User explicitly paused the session.
- See SESSION-HANDOFF.md for the full saved scope, changed files, known security
  and integration gaps, pending checks, and manual-dashboard Supabase preference.

## 2026-10-21 - Family module and lesson progress visibility

- Family program cards show the active module name and `Lesson X/Y` for a
  learner's enrolled class. Existing completion records supply X; the staff-set
  module target supplies Y. Classes without an assigned module keep existing totals.
- Family access is limited to the active module row. Detailed lesson plans remain
  staff-only; course reads are skipped while `LEARNING_UI_ENABLED=false`.
- Migration `202610210004_course_lesson_targets.sql` adds the independent target
  (0–10,000), backfills existing modules from active lessons, and persists target
  updates through the secure course-content RPC with retry protection. Two-family
  fixtures and six scoped-read assertions verify that guardians see only the
  assigned module's title and target.
- Verification after the target-count change: `npm run rls:verify` passes 137
  checks including migration application; `npx tsc --noEmit` passes; lint has zero
  errors and two existing graph-harness warnings. The first `npm run build` attempt
  could not fetch Google Fonts in the restricted network; rerunning with network
  access passed. No live migration or real-account QA was performed.
- Limitation: progress completion comes from the existing class lesson log while
  the displayed total is now explicitly configured by staff. Keep the target
  aligned with the class's lesson plan before enabling this in a live center.

## 2026-10-21 - Staff course library and module progress display

- Added production staff course library and course workspace for creating and
  editing named modules, setting the expected lesson total independently of
  optional detailed lesson plans, archiving/restoring lessons and courses, and
  linking a module to a class.
- Class rosters show the linked module name and each learner's `Lesson X/Y`
  progress. The denominator follows the staff-configured module target; without a
  linked module, the roster retains its class lesson count. Course screens and
  navigation are gated by server-only `LEARNING_UI_ENABLED` (default false).
- Assignment UI and parent assignment submission were explicitly left out of
  this slice. Existing backend and mock assignment behavior is unchanged.
- Verification: production `npm run build` and TypeScript passed. `npm run lint`
  reports zero errors and the two existing graph-harness warnings. No live DB,
  browser viewport, or migration QA was performed. Enable only after applying
  the existing course migrations and completing live QA.
- Limitation: learner completions still come from the existing class lesson
  progress records; the course module controls the displayed total. Live data
  should be checked to ensure each class's lesson progress aligns with its module.

## 2026-10-21 - Production feedback staff and family screens

- Added a shared feedback panel to authenticated staff student records and family
  profiles, gated by server-only FEEDBACK_UI_ENABLED (default off). Staff create
  and edit private drafts, preview/share a saved version, inspect publication
  history, and withdraw snapshots. Families see child-scoped published content.
- Added paginated lists/history, loading/empty/error/retry states, readable navy
  cards, mobile-sized inputs/actions, and explicit private-versus-shared wording.
  Optional lessons come from the enrolled class journey. Existing historical
  drafts remain editable; new drafts require a visible enrolled class.
- Exact pending operations persist in actor/student-scoped sessionStorage before
  sending. Ambiguous failures retain the payload for retry through refresh;
  successful/definitively rejected operations clear it. This is tab-scoped retry
  recovery, not offline storage or automatic unsaved-form backup.
- Verification: local Chrome with intercepted fixture APIs exercised create/edit,
  preview/share/withdraw, exact create/publish/withdraw retries after lost responses
  and refresh, unchanged publication text after draft edits, pagination, read-error
  recovery, and family empty states. No page errors or horizontal overflow at 360,
  390, 768, 1024, and 1440px. Reviewed phone form and desktop sharing screenshots.
  Fixed nested form labels discovered by the editor check. Temporary fixture page
  removed; browser script/screenshots remain in Temp. In-app browser failed on
  sandbox metadata, so local Chrome provided verification.
- Production build/TypeScript, actual feedback API adapter checks, and 91 feedback
  database assertions pass. Lint: zero errors, two existing harness warnings.
  No live migration/deployment. Enable the flag only after live permission and
  staging checks. English feedback copy, course/assignment/submission UI, and live
  Auth/PostgREST/concurrency verification remain rollout limitations or pending work.

## 2026-10-21 - General feedback drafts and publication backend

- Added private staff feedback drafts, explicit publication of a selected revision,
  immutable family-visible snapshots, and withdrawal with retained history. Later
  draft edits remain private; publishing another revision creates a new snapshot.
  Families read only their selected child's non-withdrawn publications, including
  after unenrollment while the guardian link remains.
- Added bounded staff/family APIs, revision checks, actor-scoped retry receipts,
  same-center and lesson/class constraints, database permissions, matching types,
  fresh schema, forward migration, and rollout/rollback documentation. New drafts
  require enrollment; authorized staff can correct existing historical feedback.
- Verification: 91 fresh-schema and 95 forward-migration database assertions;
  actual feedback API-handler adapter checks; all 126 existing RLS assertions;
  assignment (52), roster (52), submission (77), and report-download regressions
  pass. Policy graph has no cycles. Production build/TypeScript pass after fixing
  a duplicate type declaration. Lint has zero errors and two existing graph-script
  warnings. Git diff whitespace checks pass.
- Backend only: no remote migration/deployment, UI changes, or browser QA.
  Production feedback/learning UI and live Auth/PostgREST plus separate-connection
  PostgreSQL race verification remain pending. Local sequential checks do not
  establish concurrency safety. Browser demo feedback was not imported.

## 2026-10-21 - Explicit assignment roster adjustments

- Added staff roster reads and revision-checked learner add/close/reopen APIs.
  Adding or reopening requires current class enrollment; closing retains learner
  snapshots and submission/review history. Draft/archived assignments reject new
  roster operations. Re-enrollment does not silently reopen submissions.
- Per-learner revisions also advance on automatic unenrollment closure and archive.
  Private assignment receipts make retries safe and preserve actor/payload/result;
  current class/center authorization is rechecked before returning old receipts.
- Added a forward migration, matching fresh schema/types, API validators, grant
  harness, and rollout/rollback contracts. No remote migration or deployment.
- Verification: 52 fresh-schema and 55 populated forward-migration roster checks;
  actual roster API-handler adapter checks; 77/81 submission database checks and
  submission API checks; 52 assignment database checks and assignment API checks;
  all 126 existing RLS assertions and migration smoke checks pass. Policy graph
  has no cycles. Production build/TypeScript pass; lint has zero errors and two
  existing graph-harness warnings. Git diff whitespace check passes.
- Backend only, with no visual changes or browser QA. Production learning UI and
  general feedback publication remain pending. Live Auth/PostgREST and concurrent
  PostgreSQL tests remain release gates; sequential local checks are not evidence
  of concurrency safety.

## 2026-10-20 - Versioned production submissions and reviews

- Added parent/staff submission and history APIs, immutable versions, staff role
  attribution, late flags, and append-only review corrections. Each new version
  starts unreviewed; reviewing an older version or stale review returns conflict.
- Database authorization scopes family history to the selected learner and staff
  to the current class/center. Exact retries recheck authorization. Archived work
  rejects new writes; unenrollment closes snapshots without deleting history.
  Re-enrollment does not silently reopen submissions. URLs are references only.
- Added forward migration, matching fresh schema/types, bounded validators,
  authenticated RPCs, private receipts, and documented API/rollback contracts.
- Verification: 77 fresh-schema and 81 forward-migration submission assertions;
  migration fixture retains existing assignment/lesson snapshots and closes
  already-unenrolled learners. Actual submission/review API adapter tests, 52
  assignment assertions, assignment API tests, and all 126 existing RLS checks
  pass. Production build/TypeScript pass. Lint: zero errors, two existing graph
  warnings. Policy graph has no cycles. Course database, mock session/credit,
  and report-download regressions also pass.
- Backend only; no UI/browser verification or remote database/deployment changes.
  Production UI, explicit roster adjustments, and general feedback publication
  remain pending. Live Auth/PostgREST and separate-connection race tests remain
  release gates; local sequential tests do not establish concurrency safety.

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

## 2026-10-21 - Explicit course curriculum mapping

- Staff can map each detailed course lesson to an existing class journey lesson or append it as a new journey node from the class roster. Mapping preserves existing titles, order, and completion history; it never creates assignments.
- New class journey nodes copy the course lesson title and objective at mapping time. Later course edits do not silently rewrite class plans.
- Staff and family `Lesson X/Y` views count only journey lessons mapped to the active course once mapping starts, and retain the existing lesson count until the first mapping is made.
- Migration `202610210005_course_curriculum_mapping.sql` adds guarded mapping columns and retry receipts. No mappings are backfilled. Screens remain gated by `LEARNING_UI_ENABLED`.
- Verification: `npm run rls:verify` passes 142 checks, including active-class authorization, peer-class denial, progress preservation, append behavior, and exact retry protection; `npx tsc --noEmit` and `npm run build` pass. Lint has zero errors and two pre-existing graph-harness warnings.
- Limitation: mapping uses the currently active class course and does not automatically reconcile edits or archive changes into a class journey.

## 2026-10-21 - Family Journey follows the active module

- The family Journey path now shows only lessons mapped to the active course once mapping begins; before the first mapping it keeps the existing class journey. The progress summary uses mapped completions over the staff-configured module target (for example, `Lesson 1/24`) and identifies the mapped path-node count separately.
- The authenticated Journey API returns the same active-module filtering and a course progress summary. Families still receive only class journey lesson titles and progress; detailed reusable course lesson content remains staff-only.
- Verification: `npm run rls:verify` passes 143 checks, TypeScript and production build pass, and lint has zero errors with two existing graph-harness warnings. No live Supabase session or multi-width browser session was used.
- Limitation: unmapped target lessons have no visual node until staff adds or maps a class journey lesson for them.

## 2026-10-28 - Splash wire, theme menu, and workspace ambience

- The splash keeps its straight digital wire visible through the upward draw and node reveal, then retracts the visible mask from the bottom toward the top. The greeting uses the signed-in demo identity name when available (for example, “Welcome, Gio”).
- The floating theme menu now chooses a direction using available viewport space and caps its scrollable height to that space, including short screens.
- Staff and family workspace pages now have slow, faint upward data streams behind the content.
- Verification: reviewed the installed Next.js App Router client-component guide and ran TypeScript validation. Local browser preview was not run; the development server remains stopped.

## 2026-10-28 - Wire visibility, tab indicator, and light theme

- The splash wire mask now declares SVG user-space units explicitly so the straight path is visible during its upward draw and can retract from bottom to top after reaching the node. Increased the wire's blue contrast and glow.
- Removed the second, static active-tab underline from the theme CSS; the animated sliding indicator remains the sole underline.
- Added Arctic White, a light palette with white cards, graphite text, cool-grey surfaces, and restrained blue accents.
- Verification: `git diff --check` passes. TypeScript validation is currently blocked by malformed generated files under `.next/dev/types` (syntax errors in generated `routes.d.ts` and `validator.ts`, outside the edited source files). No browser preview was run; localhost remains stopped.

## 2026-10-28 - Splash wire rendering and animated sign-in greeting

- Replaced the splash wire's SVG mask with a screen-space animated line. It reveals bottom-to-top, holds at the top node, then clips away from bottom-to-top; this removes the SVG mask behavior that left the entire wire invisible.
- Splash background and decorative colors now use the active theme CSS variables. Theme preference is applied before paint to avoid showing the default palette first.
- Successful sign-in now transitions in place to a large “Welcome, [name]” greeting with sequential letter reveal and a blinking square cursor, then opens the workspace without reloading or replaying the splash.
- Reduced Inferno Red's saturation and contrast while retaining a red palette.
- Verification: ESLint on the edited TypeScript components and `git diff --check` pass. TypeScript remains blocked by malformed generated `.next/dev/types` files. No browser preview was run because localhost remains stopped.

## 2026-10-28 - Splash wire origin and typewriter spacing

- Moved the splash wire's starting point above the Kode Nexus title while keeping its upward draw and bottom-to-top erase.
- Changed the sign-in greeting to reveal slices of one normally spaced monospace string. A blinking square cursor follows the revealed text, avoiding per-character flex spacing artifacts.
- Verification: ESLint on the edited components and `git diff --check` pass. No browser preview was run; localhost remains stopped.

## 2026-10-28 - Login transitions and workspace navigation visibility

- Added animated transitions between the login form, the typed welcome screen, and workspace route changes.
- The staff landing page now remembers or defaults the selected center while keeping the all-centers directory unfiltered. This lets the center selector and center-aware navigation tabs remain visible together.
- Moved the theme selector into the main header, exposed it on the login screen, expanded the login screen's upward-moving streams, and replaced the login/header logo crop with the splash's theme-tinted icon treatment. Arctic White uses a neutral slate icon without glow.
- Login backgrounds now use active theme variables instead of fixed navy colors.
- Verification: ESLint on edited TypeScript components and `git diff --check` pass. No browser preview was run; localhost remains stopped.

## 2026-10-28 - Splash timing and section-only tab navigation

- The splash intro animations now reach the logo and tagline 0.5 seconds sooner; the splash stays for 5.2 seconds total. During its last second it types “Initializing . . .” and speeds up the blinking block cursor until exit.
- Restored the theme selector as a fixed control on workspace pages. Tab navigation no longer keys/remounts the whole shell; the existing transition is limited to the content section.
- Verification: ESLint on edited TypeScript components and `git diff --check` pass. No browser preview was run; localhost remains stopped.

## 2026-10-28 - Faster initializing cue and workspace swipe

- Moved the splash's “Initializing . . .” typewriter to 3.2 seconds into the 5.2-second screen and made the cursor accelerate gradually through the end.
- Increased login-page upward-stream speed.
- Added a smooth right-to-left masked swipe with motion blur to content transitions. It plays when the workspace first appears after the welcome and remains scoped to the content area on tab changes.
- Kept the workspace theme control fixed in the lower-right so it stays visible across main pages.
- Verification: ESLint on edited TypeScript components and `git diff --check` pass. No browser preview was run; localhost remains stopped.

## 2026-10-28 - Welcome overlay reveals workspace; keep tabs local

- Moved the swipe reveal into a persistent welcome overlay outside route content. The staff/parent page loads beneath it, and the overlay wipes away to reveal that page after navigation.
- Removed the page-level swipe from ordinary tab/content changes; those return to the section-only fade/slide transition.
- Increased the splash wire's upward draw speed: it now reaches the top in about 0.5 seconds, holds, then clears bottom-to-top. The initializing cue remains at 3.2 seconds.
- Verification: ESLint on edited TypeScript components and `git diff --check` pass. No browser preview was run; localhost remains stopped.

## 2026-10-28 - Remove Learning Momentum dashboard card

- Removed the Learning Momentum module-count card from the center dashboard. Expanded the documentation card across the two-column row so the dashboard layout stays balanced.
- Verification: ESLint on `CenterDashboard.tsx` and `git diff --check` pass.

## 2026-10-28 - Make workspace usable during welcome reveal

- The welcome swipe now stops receiving pointer input as soon as the workspace reveal starts, so an animation layer cannot cover the center selector or tabs.
- Added a 1.5-second cleanup fallback in case the animation completion event does not fire. Tab and center navigation remain on the demo's in-app history path.
- Verification: ESLint on `NexusExperience.tsx` and `git diff --check` pass. No browser preview was run; localhost remains stopped.

## 2026-10-28 - Render tab content without waiting on exit motion

- Changed the keyed workspace section transition to animate only the incoming section. The previous `AnimatePresence` wait mode could keep the old section mounted until its exit animation completed, leaving a tab click looking like it did nothing if that animation was interrupted.
- The shell and navigation controls remain mounted; only the section content remounts for the selected route.
- Verification: ESLint on `NexusExperience.tsx` and `git diff --check` pass. No browser preview was run; localhost remains stopped.

## 2026-10-28 - Add Candy Bloom color theme

- Added an optional cheerful light theme with warm cream backgrounds, white cards, coral-pink actions, and sunny yellow, mint, lilac, and sky-blue chart accents. Theme choice continues to persist using the existing selector.
- Updated workspace decoration and Kodecoon icon treatment to match the new palette.
- Verification: ESLint on `NexusTheme.tsx` and `git diff --check` pass. No browser preview was run; localhost remains stopped.

## 2026-10-28 - Make demo route state explicit after tab navigation

- Replaced the demo URL's external-store snapshot subscription with explicit React state synchronized on hydration and on custom in-app navigation/popstate events. The demo is served through rewritten aliases, so its route display now reads the browser location directly after every navigation event.
- Verification: ESLint on `DemoLink.tsx` and `NexusExperience.tsx`, plus `git diff --check`, pass. No browser preview was run; localhost remains stopped.

## 2026-10-28 - Prevent welcome layer from blocking workspace controls

- Reverted the explicit route-state hook after it did not resolve the reported tab issue. The welcome transition is now always pointer-transparent, so its full-screen visual layer cannot block center/theme dropdowns or tab controls even if animation cleanup stalls.
- Verification: ESLint on `NexusExperience.tsx`, `DemoLink.tsx`, `NexusDropdown.tsx`, and `NexusTheme.tsx`, plus `git diff --check`, pass. Browser verification was not run; localhost remains stopped.

## 2026-10-28 - Restore reliable workspace navigation and isolate finance

- Replaced raw `history.pushState` navigation with shallow navigation through the Pages Router's `/demo` page while preserving the requested alias in the address bar. This ensures tabs update through Next's router rather than relying on a custom URL snapshot.
- Replaced the custom animated center/theme popup with a styled native select, keeping selection visible and using the browser's reliable keyboard/touch controls.
- Removed Finance from the Kode Nexus navigation and routed direct `/finance` visits to an explanation that finance is managed separately. The center dashboard stays focused on class operations, learner credits and documentation; comprehensive analysis belongs in Analytics.
- Verification: targeted ESLint and optimized production build pass. `git diff --check` passes. Browser preview was not performed because localhost remains stopped.

## 2026-10-28 - Restore styled dropdowns and mobile theme dock

- Replaced the browser-native selects with a custom portal-based dropdown so the menu keeps Kode Nexus styling without being clipped by the header or screen edges. Menus measure available viewport room and open upward or downward as needed.
- On phone widths, the theme selector becomes a compact palette button fixed to the bottom-right safe area, keeping it out of the login hero and workspace header. Larger screens retain the labeled selector.
- Verification: targeted ESLint, optimized production build, and `git diff --check` pass. No browser preview was run; localhost remains stopped.

## 2026-10-29 - Repair workspace navigation and refresh behavior

- Root cause reproduced in production browser: a closing custom dropdown retained pointer events during its exit animation and intercepted the next tab click. Its exiting layer now becomes immediately inert and pointer-transparent. Login now navigates immediately rather than scheduling a later redirect that could return after the user had opened another tab. The welcome cleanup timer no longer depends on the current route. Student/class/session saves use the demo router rather than full document assignments.
- Browser review covered all seven staff tabs twice, center selection, student details, browser back/forward, parent login, no console exceptions, and a 45-second idle period without a refresh at desktop, tablet and phone widths. Candy Bloom was included in responsive selector checks.
- Updated ERD v1.1 to 40 entities / 66 relationships / 14 pages. Removed assignment/submission entities from the logical contract, added every-12-attendance feedback cycles, report publication media, completion certificates and lesson PDF/PPT attachments. Added an app/data-flow page and an internal implementation-alignment companion.
- Added a Drive storage and free hosting decision note. Netlify Free is the recommended first pilot host (300 monthly credits, hard stop); Cloudflare Workers Free remains a trial candidate subject to the current Next.js adapter and CPU limit. The production session-documentation flow already uses Drive Picker for videos and stores Drive file IDs; the mock student-profile Upload remains browser-local. Lesson PDFs/PPTs need Picker support, attachment UI, and a permission-checked viewer. Private parent playback remains unverified.
- Security containment: removed obfuscated code from npm startup, PostCSS, the hidden editor folder-open task and its disguised `.orc` file. Restored `.env*` ignore rules. Original hashes and originating commit are recorded under `docs/security/`. The previous successful builds occurred while these hooks were present; prior execution/exposure is possible and cannot be ruled out here. Review repository access and rotate affected credentials from a trusted machine before deployment.
- Verification: production build, targeted ESLint, mock workflow checks, 14-page PDF field/relationship/page-boundary verification, visual review of updated ERD pages, and `git diff --check` passed. No live database, Netlify/Cloudflare deployment or credential review was performed. The temporary test server was stopped; the pre-existing port 3000 server was left unchanged.

## 2026-10-29 - Add Kodecoon module catalogue for deployment demo

- Replaced the three invented demo courses with the 37 module titles supplied by Gio: 5 Robotics, 20 Coding and 12 Holiday Camp entries. Roblox Game Development appears in both Coding and Holiday Camp as separately supplied offerings. Ages, lesson content and Drive materials remain unset rather than invented; course detail pages explain that PDFs/PPTs will be linked when shared.
- Added Holiday Camp to the course-library subject filter and updated the course usage check for the new catalogue IDs/counts.
- Verification: Next.js production build passed; targeted ESLint passed; `mock-check.mjs` and `nexus-demo-check.mjs` passed after updating its stale sample course IDs. No Drive files have been attached and no hosting deployment has been made.
- Deployment status: local build hooks are neutralized and the npm build runs `next build`, but these fixes and module updates are not yet in GitHub. Do not connect the current remote revision to an automated build until the reviewed sanitized tree is committed and available to the host. Credential/repository-access review remains outstanding; use synthetic demo data until it is completed. Vercel Hobby is not suitable for this company app under its non-commercial-use restriction; use the previously reviewed commercial-friendly free-host candidate and verify its current plan limits.
