# Forward migrations

## Credit ledger: 202610180001

Apply `202610180001_credit_ledger.sql` once after the report-publication migration,
then deploy the matching API/UI. Fresh installs use schema.sql, which includes
both migrations. Do not apply either migration again over a fresh install.

The credit migration sets all existing sessions to billing-exempt and initializes
existing students' balances to zero. It preserves attendance, notes, and lesson
progress. No browser-demo balances are imported. An admin must record each
verified opening balance as a top-up with an explanatory reference. New students'
accounts are created lazily on their first adjustment or billable session log;
the UI shows zero until then. Credits are student-wide integer session units,
not money or online payments.

New sessions default to billable: present costs one, absent/unmarked costs zero.
Corrections append refunds without deleting learning progress. A previously
charged learner can be refunded after unenrollment, but cannot be charged again
without enrollment. Exempt sessions never charge or refund. The session revision
serializes corrections; operation receipts enforce exact retries. Session, notes,
attendance, requested progress, balances, ledger, and receipt commit together.
Video metadata remains outside this transaction and best-effort.

Direct client attendance writes and edits to session billing/status/revision
fields are blocked. The old `log_session` RPC is revoked for authenticated users;
the new `log_session_credits` function explicitly checks staff/class/center scope.
Admin adjustments, account locks, and sorted student lock ordering share the
same transaction boundary. Financial history prevents hard deletion of referenced
sessions/students/staff. Correct entries with compensating adjustments, not deletes.

Release checks: run `npm run rls:verify`, `node scripts/credit-api-check.mjs`,
build/lint, and the live Auth/PostgREST tests. The local harness verifies migration
cutover, retries, permission denial, nonnegative balances, refund behavior, and
full rollback when one learner is unfunded. It does **not** prove simultaneous
transactions on separate PostgreSQL connections. Before production enablement,
run these cases against a disposable real PostgreSQL/Supabase database:

1. Two connections log different sessions for one learner with one credit: exactly
   one commits, the other gets insufficient-credit error; balance stays zero.
2. Two requests use the same session revision: one commits, the other conflicts.
   An identical request-ID retry returns the original result and adds no entry.
3. Hold an account lock in an adjustment transaction while a session log waits;
   commit, then repeat with rollback. The log must use the final committed balance.
4. Log two classes sharing multiple learners with reverse payload order. Verify
   completion without a lock-order deadlock and exact ledger/balance reconciliation.

These multi-connection checks and live service tests have not run locally. No
remote migration was performed. Do not roll back to the legacy session writer
after cutover; disable writes while rolling forward to a corrected migration.

## Course library: 202610190001

Apply `202610190001_course_library.sql` once after the report and credit migrations
for an existing database. New databases use the matching `schema.sql` instead.
The transactional migration creates empty reusable course/lesson tables and private
retry receipts. It does not import demo content, map classes, or alter class lessons,
attendance, credits, or learner progress. Rollback disables the API and retains data.

Teachers read their center's library and edit their own courses. Same-center admins
can edit all courses while preserving the original owner. Parents, center managers,
and anonymous callers have no library access. Future assignment APIs must expose
only the referenced lesson content to authorized families. Direct client mutations
are denied; the authenticated RPC derives owner/center from the current profile.
A composite foreign key keeps the owner and course in the same center; moving an
owner to another center requires a separately designed ownership-transfer workflow.

API contract:

- `GET /api/courses`: `after` UUID, `limit` 1–100 (default 30), `archived=true|false`
  (default false). Returns `courses` and `nextCursor`.
- `GET /api/courses/:id`: one visible course, otherwise 404.
- `POST /api/courses`: stable client `id`, `requestId`, `expectedRevision: 0`, and
  complete `content`: title, category, age_range, level, description, prerequisites,
  archived (boolean). Text fields can be empty except title.
- `PATCH /api/courses/:id`: requestId, positive expectedRevision, and the same
  complete content object. Owner, center, timestamps, and revision are server-owned.
- `GET /api/courses/:id/lessons`: `after` UUID and bounded `limit`; includes archived
  lessons, returns `lessons` and `nextCursor`. Both list endpoints use immutable ID
  ordering so edits to lesson sequence cannot move the pagination cursor. Consumers
  sort fetched lesson content by sequence for teaching order.
- `PATCH /api/courses/:id/lessons/:lessonId`: stable client lesson ID, requestId,
  expectedRevision (0 creates), and complete content: title, sequence (1–10000),
  minutes (1–1440), objective, materials, steps, evidence, archived. Sequence remains
  reserved when archived. Restore the course before editing its lessons.

Use a new request UUID for each intended edit and retain it for retries. Identical
retries return the original ID/revision without overwriting later edits; changed
payloads, stale revisions, and duplicate sequence positions return 409. An old
receipt result may have an older revision than the current row; reload after retry.
The RPC rechecks current authorization before returning a receipt. Error responses
contain no database details. Field lengths/types are enforced both in API and SQL.

Validation: `node scripts/course-db-check.mjs`, `node scripts/course-api-check.mjs`,
and `npm run rls:verify`. The last command also verifies forward migration data
preservation. Local tests are sequential PGlite and isolated API adapters, not live
Auth/PostgREST integration or concurrency proof. Before release, test simultaneous
same-revision edits, same-key retries, same lesson ID creation across two courses,
and course archive racing lesson edits using separate PostgreSQL connections.
No production UI or remote migration/deployment is included in this slice.

## Class course links: 202610190002

Apply `202610190002_class_course_links.sql` after the course library migration.
New databases use the matching appended section in `schema.sql`. Existing classes
start with no course. The migration adds historical class/course assignments and a
private write receipt table; it does not modify existing class lessons or progress.

Use `GET /api/classes/:id/course` for the current course. `PUT` takes a request UUID
and `courseId` UUID or null to unlink. Teachers can manage their own class and admins
classes in their center. A course must be active and share the class center. Replacing
a course ends the prior link and retains it in history. Repeating the same course is
a no-op; unlinking preserves history. Identical retries return the first result,
changed payload reuse returns 409, and authorization is checked before receipt lookup.
Direct table writes are denied and the RPC is the only mutation path.

Validation: the course database regression includes link/unlink, replacement history,
teacher/admin scope, center isolation, anonymous denial, request replay, and migration
preservation. This is a local sequential PGlite check; separate-connection races and
live Auth/PostgREST remain release gates. No remote migration/deployment occurred.

## Report publications: 202610170001

For an existing KodeHub database, apply `202610170001_report_publications.sql`
once, in one transaction, before deploying the report publication UI/API. For a
new database use `schema.sql`, which already includes the same change; do not
apply the migration again. The private `reports` Storage bucket must be configured
using `supabase/storage-setup.sql` before exporting reports.

The migration preserves existing report rows and legacy URL columns, removes
guardian access to those private rows, and creates an empty publication table.
It never automatically publishes old reports. Re-export reviewed legacy report
text to create a new private PDF, then explicitly publish the new export.
Existing class-less reports remain stored but are not exposed through the new
class-scoped API; an operator must review/map these before re-exporting them.

New exports store an object path. Publishing checks that its matching Storage
metadata exists and creates an immutable final-text/PDF snapshot. Retrying does
not duplicate it or reopen a withdrawn publication. Re-publication requires a
new export. Teachers and same-center admins can manage the relevant classes;
guardians read only their own child's active snapshots. Direct client writes to
publication rows are denied.

Downloads recheck caller RLS before issuing a 60-second private signed URL.
Withdrawal or unlinking a guardian prevents new downloads. Previously issued
URLs remain usable until expiry; existing legacy one-year URLs are not revoked
by this migration. If immediate legacy-link revocation is required, review the
affected Storage objects separately. Previously downloaded PDFs cannot be revoked.

Validation: `npm run rls:verify` checks forward migration preservation and the
fresh-schema permission suite; `node scripts/report-download-check.mjs` tests
the real handler with isolated Auth/Storage adapters. The local Storage shim
contains metadata only: it cannot prove uploads, signed URLs, or live integration.
Before release, verify live guardian/teacher/admin sessions, failed uploads,
successful export/publish/download, withdrawal and guardian removal with the
private bucket. No migration has been applied remotely by this change.

Rollback: disable the new report feature and retain its tables/audit data. Do not
restore the old guardian policy or deploy the old export implementation. The
report history UI currently shows the most recent 100 publications per student.


## Assignment publication: 202610190003

Apply after 202610190002 for an existing database; fresh installations use
schema.sql only. This migration adds empty assignment, learner snapshot, and
private receipt tables. It creates no assignments from existing classes and
changes no lessons, progress, credits, or enrollment records. The added composite
student key enforces same-center learner references.

Staff endpoints: GET/POST `/api/classes/:id/assignments`, PATCH
`/api/assignments/:id`, and POST `/api/assignments/:id/publish` or `/archive`.
Creation requires `{id, requestId, expectedRevision: 0, content}`; edits use
`{requestId, expectedRevision, content}`; transitions omit content. Content is
`{title, brief, dueAt, courseLessonId}` with explicit nulls for optional date/lesson.
Use stable UUIDs for exact retries; reuse with different payloads conflicts.
Writes return `{id, revision, status}`; publication also returns learnerCount.
Lists use ascending UUID `after` cursors and a limit of 1-100 (default 30).
Responses contain assignments and nextCursor. Hidden classes return empty lists.

Draft edits/publication require the original course link to remain active.
Publication captures current enrolled learners and the selected lesson's title
and objective. Published content is immutable. Later enrollment and reusable
lesson changes do not rewrite snapshots. Archive closes submission_open and
retains family history. There is no unpublish or restore action in this slice.
Exact retries recheck staff authorization before returning the stored result,
including creation retries after a class course is replaced or removed.

Parents use GET `/api/student/:studentId/assignments`. RLS exposes only published
or archived assignments for linked children in the publication snapshot. The API
filters by the selected child before reading assignments and returns only public
brief/snapshot fields. Removing a guardian link revokes access. Raw course lessons
remain staff-only; snapshot title/objective supply family context.

Verification: `node scripts/assignment-db-check.mjs` (52 assertions),
`node scripts/assignment-api-check.mjs`, and `npm run rls:verify` (126 existing
checks plus migration preservation). The harness simulates broad Supabase grants
before restoring function/TRUNCATE restrictions. No live migration was applied.
Before release, test actual Auth/PostgREST and separate PostgreSQL connections:
concurrent exact retries, different requests sharing an assignment ID, competing
edits/publication, course replacement during publication, lesson edits during
publication, teacher/guardian reassignment, and enrollment changes at publication.
Local sequential PGlite tests do not prove these races safe.

Submissions/reviews and unenrollment closure are delivered in 202610200001;
explicit learner roster adjustments are delivered in 202610210001 below.
Production UI remains pending. Submission authorization checks current enrollment
as well as submission_open; the flag alone is not permission to submit.
Rollback by disabling these endpoints and retaining snapshot/receipt data; do not
drop historical tables or reopen direct writes.


## Submission versions and reviews: 202610200001

Apply after 202610190003, or use schema.sql for a fresh database. This adds empty
submission threads, immutable versions, append-only reviews, and private retry
receipts. Existing assignments and lesson snapshots remain unchanged. Learner
snapshots whose enrollment has already ended are closed at cutover; a trigger
closes them on later enrollment deletion or reassignment. Re-enrollment does not
silently reopen a closed snapshot. Explicit roster reopening is added by migration
202610210001 below. Existing family history remains accessible while the guardian link
exists.

GET/POST `/api/assignments/:id/students/:studentId/submissions` requires a linked
parent or authorized teacher/admin. POST accepts `{requestId, projectUrl,
reflection}` and returns `{id, threadId, version, status: "submitted", isLate}`.
The actor and role are recorded by the server; staff submissions retain their
staff attribution. URLs are bounded HTTPS references with ASCII/punycode hosts,
optional ports 1-65535, no credentials, whitespace, or backslashes. IPv6-literal
hosts are outside this initial contract. URLs are never fetched on the server.
Reflection is required (maximum 10,000 characters). Late work is allowed and its
late flag is captured at submission time. Submitting again after approval creates
a new unreviewed version; previous versions/reviews remain available.

GET/POST `/api/submissions/:id/reviews` reads a version's review history and lets
staff review the latest submitted version. POST requires `{requestId,
expectedVersion, expectedReviewId, outcome, feedback}`. expectedReviewId is null
for the first review or the ID of the current review for a correction. Outcomes
are revision/approved; nonempty feedback is bounded to 10,000 characters. The
response is `{id, submissionId, sequence, status}`. Each correction appends a row
referencing the prior review; it never overwrites feedback. Reviews are immediately
visible to the linked family. Archived assignments accept neither new submissions
nor new reviews. Teachers can finish reviewing existing work after unenrollment
while the assignment remains published.

Both GET routes use descending integer cursors: `before` (version or review
sequence), `limit` 1-100 (default 30), and nextCursor. Submission history returns
submissions and latestVersion; review history returns reviews. Fetch review history
for the selected submission version separately. An empty history is also returned
for a hidden/nonexistent resource. Current status derives from the newest version's
newest review, or submitted when that version has no review. Do not use an older
version's approval as the current thread status. Reads across calls are not one
transactional snapshot; write RPCs check the expected version/review again.

Submission and review serialize on the thread; archive serializes through the
assignment row. Enrollment is locked before the learner row to match deletion's
lock order. Exact retries return their original result after current authorization
is checked, including after archive or unenrollment. New requests fail when closed;
revoked guardians/former teachers cannot replay old receipts. A request UUID is
shared across submission/review writes per actor; using it for another payload
conflicts. Ordinary clients cannot mutate tables or read receipts directly.

Validation: `node scripts/submission-db-check.mjs` passes 77 fresh-schema checks;
`node scripts/submission-db-check.mjs --migration` passes 81 checks including
populated assignment preservation and cutover closure. API adapter checks use
actual route handlers (`node scripts/submission-api-check.mjs`). The 52 assignment
and 126 existing RLS assertions, migration smoke checks, production build, and
lint pass (two pre-existing graph-script warnings). These are sequential PGlite
checks, not proof of concurrent PostgreSQL behavior.

Release gates: actual Supabase Auth/PostgREST and separate-connection tests for
simultaneous submissions, duplicate requests, reviews racing resubmission,
competing review corrections, archive, enrollment deletion/reassignment, and
guardian/teacher revocation. No remote migration/deployment occurred. Production
UI and general feedback publication remain
pending. Roll back by disabling endpoints and retaining history/receipts and the
closure trigger; do not reopen direct writes or drop submitted work.

## Explicit assignment roster changes: 202610210001

Apply once after 202610200001, or use schema.sql for a fresh database. Existing
learner rows gain revision 1; no learners are added, reopened, or removed. Existing
assignment snapshots, submissions, and reviews are preserved. This migration is
transactional and not intended to be reapplied.

Staff GET `/api/assignments/:id/learners` returns `{learners, nextCursor}`. Each
learner has student_id, assigned_at, submission_open, and revision. The stable UUID
cursor is `after`; limit is 1-100, default 30. Hidden assignments return an empty
list. RLS limits staff to their assigned class or admin center.

Staff PUT `/api/assignments/:id/learners/:studentId` accepts
`{requestId, expectedRevision, submissionOpen}`. Use revision 0 and true to add a
currently enrolled learner not yet in the published assignment snapshot. Use the
current learner revision to close or reopen an existing snapshot. Opening requires
current enrollment; closing works after enrollment ends. Only published assignments
accept new operations. No hard removal is provided: family history stays available
while the guardian link exists. This operation does not change class enrollment.

The response is `{assignmentId, studentId, submissionOpen, revision}`. Revisions
advance on permission changes, including automatic unenrollment closure and archive;
setting the current value is a no-op. Re-enrollment alone does not reopen permission.
Assignment content revisions are independent. Exact retries return the original
result after current staff authorization is checked, even after archive or later
roster edits; reload the roster for current state. Receipts share the assignment
request namespace and retain actor, request payload, result, and timestamp privately.
Changed-payload retries and stale revisions return 409. Invalid enrollment returns
422; unavailable assignments return 404. Direct client writes remain denied.

The RPC locks the assignment against archive, then enrollment before learner to
match submission/deletion lock order. An advisory lock serializes absent learner
creation. No submission or review rows are changed. The revision trigger also covers
the existing enrollment closure trigger and assignment archive RPC.

Verification: `node scripts/assignment-roster-db-check.mjs` (52 fresh-schema
assertions), the same command with `--migration` (55 assertions including populated
snapshot/submission preservation), and `node scripts/assignment-roster-api-check.mjs`.
These use sequential PGlite and isolated API adapters, not live Auth/PostgREST.
Before release, test separate PostgreSQL connections for concurrent adds, opposing
roster changes, submission versus close, unenrollment versus reopen, archive, exact
retries, and teacher/guardian revocation. No remote migration or UI delivery occurs
in this slice. Rollback disables the new endpoints and retains revisions, receipts,
and history; do not drop learner snapshots or reopen direct writes.

## General feedback publication: 202610210002

Apply once after 202610210001, or use schema.sql for a fresh database. Adds empty
student_feedback, published_feedback, and private feedback_write_receipts tables,
plus composite lesson/class integrity. No demo feedback or legacy report content
is imported or published. The transactional migration is not repeatable.

Staff GET/POST `/api/students/:studentId/feedback` reads private drafts or creates
one with `{id, classId, requestId, expectedRevision: 0, content}`. Content requires
`{title, lessonId, strengths, nextSteps, rating}`. lessonId is null or an existing
class journey lesson, not a reusable course lesson. Referenced lessons cannot be
deleted while a draft links to them; clear the optional lesson link through a draft
edit first. Published content does not depend on the lesson row. Title is 1-200
characters; strengths and nextSteps are nonempty, at most 10,000 characters. Rating is exactly
Getting started, Growing, Confident, or Independent, matching the demo labels.
New drafts require current enrollment and matching class/student center. Staff
scope is the assigned teacher or same-center admin; managers gain no permission.

PATCH `/api/feedback/:id` accepts `{requestId, expectedRevision, content}` and
returns `{id, revision}`. Student/class scope is immutable. Historical drafts may
be corrected and published after unenrollment while staff retains class access.
POST `/api/feedback/:id/publications` accepts `{requestId, expectedRevision}` and
copies the selected current draft into an immutable public snapshot. Returns
`{id, feedbackId, draftRevision, withdrawn}`; id identifies the publication.
Editing the draft afterward never changes an existing snapshot. A revision can
be published once; another request for that revision returns 409. Publishing a
newer revision creates another visible historical snapshot and does not silently
withdraw older ones. Withdraw an older snapshot explicitly when appropriate.

Staff GET `/api/feedback/:id/publications` includes withdrawn publication history.
POST `/api/feedback-publications/:id/withdraw` accepts `{requestId, expectedRevision}`
where expectedRevision is the publication's draftRevision, not the latest draft.
Withdrawal retains content and records its actor/time; repeating it cannot reopen
the record. To publish again after withdrawal, save a new draft revision first.

Family GET `/api/student/:studentId/feedback` selects only that child's non-withdrawn
snapshots and explicit public fields. Families cannot read the private draft table
through direct database access. History survives unenrollment while the guardian
link remains; unlinking the guardian revokes reads. All lists use stable UUID `after`
and `limit` 1-100 (default 30), and return nextCursor. Draft/family lists return
feedback; staff publication lists return publications. Hidden resources yield empty
lists. UUID order is pagination order, not chronological publication order.

All mutations use authenticated manage_feedback, pinned search_path, database
authorization and constraints, per-actor request locks, and private receipts. Exact
retries recheck current staff authorization and return the original result without
reapplying it; a publish retry does not reverse later withdrawal. Reload to obtain
current state. Reused keys with a different payload, stale drafts, and duplicate
publication return 409; invalid input/relationships return 422; unavailable targets
return 404. Direct client inserts/updates/deletes and TRUNCATE remain denied. Draft
edits, publication, and withdrawal serialize on the draft row. No service-role key
is used in the API. Snapshots do not contain internal draft metadata or references
to mutable lesson text; the explicit feedback title supplies module context.

Verification: `node scripts/feedback-db-check.mjs` (91 assertions), the same command
with `--migration` (95 including populated lesson/enrollment preservation), and
`node scripts/feedback-api-check.mjs` exercise actual handlers with isolated adapters.
Local PGlite checks cover role/center/family isolation, private drafts, later edits,
withdrawal, retained history, revoked access, immutable content, stale revisions,
and exact/changed-payload retries. Before release, verify live Auth/PostgREST and
separate-connection races between create retries, edit/publish, duplicate publish,
withdraw/publish, enrollment deletion, and teacher/guardian revocation. No live
migration, deployment, or feedback UI is included. Rollback disables these endpoints
and retains private drafts, snapshots, and receipts; do not expose drafts to families
or drop history.

### Feedback screen rollout (2026-10-21)

Staff student records and family profiles now include FeedbackPanel when the
server-only `FEEDBACK_UI_ENABLED=true` flag is set. It defaults off. Enable only
after the migrations above, live Auth/PostgREST permission checks, and staging
verification; mock mode still renders the separate browser-local demo. The new
panel currently uses English copy. Course/assignment/submission screens remain
separate pending work.

Staff can create/edit private drafts, preview a saved version, explicitly share it,
read publication history, and withdraw a shared version. New drafts offer enrolled
classes visible to the staff member and optional class journey lessons. Existing
historical drafts remain editable even without current enrollment. Families fetch
only child-scoped publications. Lists and history paginate; read failures show a
retry action instead of stale content. An already-published version cannot be shared
again; saving an edit creates the next draft version.

Before a write is sent, its exact validated payload and request UUID are stored in
sessionStorage under actor/student scope. Ambiguous failures block further writes
and offer an exact retry, including after refresh. Successful/definitively rejected
operations remove the pending payload. This includes private draft text while a
write is pending, lasts only within the browser tab session, and is not offline
storage or an automatic unsaved-form backup. Closing the tab can lose unresolved
retry metadata; check server records before repeating an uncertain creation.

Local Chrome used the real component with intercepted fixture API responses to
verify drafts/edits, preview/share/withdraw, pagination/read-error recovery, published
content preservation, and create/publish/withdraw response-loss retries through
refresh. Layout checks passed at 360, 390, 768, 1024, and 1440px. No live Supabase
session or migration was used. The temporary fixture page was removed; screenshots
and the browser script stay in Temp outside Git. Disable FEEDBACK_UI_ENABLED to
roll back the screens without changing any stored feedback.
