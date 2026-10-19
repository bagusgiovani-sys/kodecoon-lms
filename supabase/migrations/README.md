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
