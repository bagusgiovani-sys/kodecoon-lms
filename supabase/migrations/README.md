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

Remaining work: production UI, explicit learner roster adjustments, submissions,
reviews, and closing submission permission on unenrollment. No submission endpoint
exists yet; its future authorization must check current enrollment as well as
submission_open. Do not treat this flag alone as permission to submit.
Rollback by disabling these endpoints and retaining snapshot/receipt data; do not
drop historical tables or reopen direct writes.


## Submission versions and reviews: 202610200001

Apply after 202610190003, or use schema.sql for a fresh database. This adds empty
submission threads, immutable versions, append-only reviews, and private retry
receipts. Existing assignments and lesson snapshots remain unchanged. Learner
snapshots whose enrollment has already ended are closed at cutover; a trigger
closes them on later enrollment deletion or reassignment. Re-enrollment does not
silently reopen a closed snapshot. An explicit roster-reopening workflow remains
future work. Existing family history remains accessible while the guardian link
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
UI, explicit learner roster adjustments, and general feedback publication remain
pending. Roll back by disabling endpoints and retaining history/receipts and the
closure trigger; do not reopen direct writes or drop submitted work.
