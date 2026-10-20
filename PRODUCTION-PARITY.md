# KodeHub production parity design

Version 1, 2026-10-17. **Implementation specification; not deployed behavior.**
This extends the July PRD/SDD using the delivered demo. Product defaults below
are implementation assumptions and can be revised without changing demo data.

Implementation update: the report publication slice now exists locally with a
forward migration, private exports, immutable published snapshots, withdrawal,
authorized download routes, and teacher controls. See build-progress.md for
verification and supabase/migrations/README.md for rollout limits. Feedback
publication, courses, and submission production parity remain pending. The credit
ledger and session transaction are now implemented locally (2026-10-18), including
admin adjustments and staff/family balance/history views. Opening balances use
verified top-ups rather than a separate opening-entry kind. Charge state shares
the session revision rather than carrying an independent revision. Live service
and separate-connection concurrency verification remain release gates.

2026-10-19: reusable courses and course lessons now have a local forward migration,
staff-only library reads, owner/admin edits, archive/restore, revision checks,
private retry receipts, and bounded API routes. This is the library portion of
delivery step 3. Class course link history, same-center validation, and the staff
replacement/unlink API are implemented in migration 202610190002. Assignment drafts, immutable publication snapshots, learner snapshots, archive,
and child-scoped family brief reads are implemented locally (2026-10-20).
Families read captured lesson title/objective; raw library lessons remain private.
Submissions/reviews, roster adjustments, and production library/assignment UI remain pending.
Existing class lessons and learner progress are unchanged. See migration notes
for the full-content write contract and stable-ID pagination.

## Scope and defaults

- Preserve center isolation and existing class/student IDs and lesson progress.
- Credits are whole session units, shared across a student's classes within one
  center. Present costs one unit; absent/unmarked costs zero. No payment processing,
  currency, expiry, subscriptions, or automatic bank reconciliation.
- A linked guardian submits on behalf of a child. Do not introduce a student auth
  role until account provisioning and consent requirements are separately defined.
- A class has one active course assignment; replacing it retains earlier work.
- Late submissions remain allowed and labeled late. Resubmission after approval
  is allowed, matching the demo; the new version starts unreviewed.
- Teachers manage their assigned classes; admins manage within their center.
  `center_manager` gains no new permissions in this slice. Anonymous access is denied.

## Data model

All new IDs are UUIDs. Timestamps are server-generated UTC. Actor IDs come from
the verified session, never request payloads. Add CHECK constraints for enums,
positive sequence/version numbers, and field lengths. Use composite foreign keys
or constraint triggers to enforce center/class consistency even through direct SQL.
Archive records with history instead of cascading away submissions or credits.

| Entity | Required data and constraints |
| --- | --- |
| `credit_accounts` | One per student, `center_id`, integer `balance >= 0`, revision. Unique student ID; center must match student. Balance is a transaction-maintained cache of ledger sum, never client editable. |
| `credit_entries` | Account, signed nonzero integer amount, kind (`opening`, `top_up`, `attendance_charge`, `attendance_refund`, `adjustment`), actor, reason, request ID, optional session ID, recorded timestamp and effective date. Append-only; unique operation/account pair. |
| `session_credit_state` | Unique session/student pair, charged boolean and revision. Records net attendance charge and prevents duplicate deductions. Not editable by clients. |
| `courses` | Center, owner staff ID, title, category, age range, level, description, prerequisites, archived timestamp, revision. |
| `course_lessons` | Course, positive sequence unique within course, title, minutes, objective, materials, steps, evidence, revision, archived timestamp. Reusable teaching content; distinct from existing class `lessons`. |
| `class_course_assignments` | Class, course, assigned by/at, ended timestamp. At most one active row per class; class and course must share a center. |
| `assignments` | Class, course-assignment ID, optional course-lesson ID, title, brief, due timestamp, status (`draft`, `published`, `archived`), revision, actor timestamps. Lesson must belong to that course. Capture lesson title/objective at publication for historical context. |
| `assignment_learners` | Unique assignment/student pair, assigned timestamp, submission-open boolean. Snapshot enrolled learners at publication; later roster changes are explicit. Student and class must share a center. |
| `submission_threads` | Unique assignment/student pair linked to assignment_learners, next version counter. Lock this row when submitting/reviewing. |
| `submission_versions` | Thread, positive version unique per thread, HTTPS URL, reflection, submitted by/at, request ID unique per actor. Immutable payload; author may be guardian or authorized staff. |
| `submission_reviews` | Submission version, outcome (`revision`, `approved`), feedback, reviewer, reviewed timestamp, superseded review ID. Append-only; serialize corrections under the thread lock. |
| `student_feedback` | Student, class, optional lesson, strengths, next steps, rating, draft revision and author. Class/student relationship is validated. |
| `published_feedback` | Immutable selected feedback revision and public fields, publisher/time, optional withdrawn timestamp. No internal draft fields. |
| `published_reports` | Report/student/class IDs, immutable final text, generated date, storage object path, publisher/time, optional withdrawn timestamp. No raw notes or AI draft. |

Existing `lessons` and `student_lesson_progress` remain the class journey source.
Linking a course does not silently create, delete, or complete journey nodes.
An explicit curriculum import/mapping can be designed later. Editing reusable
lesson content affects future teaching; published assignment snapshots stay stable.

## Permission contract

All reads and writes require database enforcement, including direct PostgREST
access. UI filtering is not permission enforcement. Admin scope always includes
a center check. Guardian scope always uses `student_guardians`, not shared email.

| Resource | Assigned teacher | Same-center admin | Linked guardian |
| --- | --- | --- | --- |
| Course library | Read center library; create and edit own courses | Manage center library | Read lessons referenced by own child's published assignment; no staff library browsing |
| Class course link / assignment | Manage own class | Manage center classes | Read published/archived assignments for own child's assignment_learners row |
| Submissions | Read versions; record on learner's behalf; review own class | Same within center | Read own child's versions; submit while submission-open; never edit reviews |
| Credit balance/history | Read students enrolled in own classes | Read center accounts | Read own child's account and history |
| Top-ups / manual adjustments | No manual balance changes | Record with nonempty reason and idempotency key | No writes |
| Attendance credits | Change through authorized session RPC | Change through center-scoped session RPC | No writes |
| Draft feedback/reports | Manage own class; class-less reports require explicit author scope | Manage center drafts | No access |
| Published feedback/reports | Publish/withdraw own class | Publish/withdraw center records | Read own child's non-withdrawn snapshots only |

Admins recording top-ups is a conservative production default, differing from
the unrestricted demo. Teacher submissions must show “recorded by teacher” in
history; they never impersonate a guardian. Families can see their child's history
after enrollment ends while the guardian link remains; removal closes new
submissions. Staff access follows current class assignment. Revoke a guardian
link to revoke family access. No sibling submissions appear in another child view.

Keep recursion-free boolean authorization helpers narrowly scoped. Any
security-definer mutation must pin search_path, verify auth.uid()/role/center,
validate every referenced row, and revoke PUBLIC/anon execution. Financial tables
deny direct client mutations: RLS alone cannot prove balance/ledger consistency.

## Credits and session transaction

1. Accept a request UUID and expected session revision with the log payload.
   Store a payload digest and result in a private operation receipt keyed by actor
   and request UUID. An identical retry returns its committed result; a reused
   key with different content returns conflict.
2. Lock the session, validate current actor/class scope, then lock all affected
   accounts in student-ID order. Serialize against concurrent top-ups and logs.
3. Reject stale session revisions. Compute each charge from persisted
   session_credit_state, not client balances. Present -> present is zero;
   not-present -> present is -1; present -> not-present is +1.
4. Reject the whole operation if any resulting balance is negative. Commit
   attendance, notes, status, requested progress changes, ledger entries, account
   balances, charge state, revision, and receipt in the same transaction.
5. Return the new revision/balances. Video writes remain best-effort and outside
   this transaction. A video retry must not reapply the core log operation.

Top-ups and adjustments use the same receipt/account-lock rules. Corrections
append compensating entries; never edit history. Rescheduling changes the
session date, not the ledger recorded timestamp; show both original effective
date and current session date. Do not hard-delete charged sessions. Closing or
correcting an old session after enrollment ends must permit refunding an existing
charge, but must not permit introducing an unrelated learner or new charge.
Attendance corrections do not automatically erase independently recorded learning.

This requires a deliberate successor to the existing security-invoker log RPC:
a narrowly authorized database mutation boundary for protected ledger writes.
Do not grant clients broad ledger writes to preserve the old RPC implementation.

## Submission and review transitions

Submission locks the thread and allocates its next integer version in one
transaction. Require an HTTPS URL without embedded credentials, a nonempty
reflection, authorized actor, published assignment, and submission-open learner.
Do not fetch project URLs on the server. Links are references, not hosted files.

Review locks the same thread and names the expected latest version. If a newer
submission arrived, return conflict rather than approving unseen work. A submitted
version has no review; its latest review yields revision/approved. A new version
resets the current thread status to submitted while preserving all older feedback.
Review corrections append history. Reviews become visible immediately on save;
general progress feedback and reports use the separate publication workflow.

## Drafts, publication, and PDFs

Current reports_select_parent permits a guardian to read every report row for
their child, including any draft fields on that row. Production parity must
remove that access and expose only published snapshots. Row filtering alone
cannot hide raw_notes/ai_draft_text on an otherwise readable report row.

Publication copies an explicitly selected draft revision into a separate immutable
public snapshot. Later draft edits remain private. Republish creates a new snapshot;
withdrawal hides it without deleting audit history. Existing report rows default to
private during migration and require deliberate publication; no automatic reveal.

Store a private Storage object path, not an expiring signed URL, as the durable PDF
reference. Generate/upload a versioned PDF, then publish only after upload succeeds.
Failed publication leaves an orphan eligible for cleanup, never a visible broken
report. Downloads recheck current publication and guardian permissions and issue
a short-lived signed URL. Already-issued URLs can remain usable until expiry;
withdrawal is not immediate revocation of previously downloaded files.

## Proposed API surface

These are new contracts, not existing endpoints. Use authenticated Route Handlers
and bounded Zod payloads; database mutations remain authoritative. Do not use the
service role for ordinary learner/credit writes.

| Operation | Endpoint |
| --- | --- |
| List/create/edit course; edit lesson | GET/POST `/api/courses`, PATCH `/api/courses/:id`, PATCH `/api/courses/:id/lessons/:lessonId` |
| Replace active class course | PUT `/api/classes/:id/course` |
| List/create/edit/publish assignment | GET/POST `/api/classes/:id/assignments`, PATCH `/api/assignments/:id`, POST `/api/assignments/:id/publish` or `/archive`; family GET `/api/student/:studentId/assignments` |
| Read history / submit | GET/POST `/api/assignments/:id/students/:studentId/submissions` |
| Review latest version | POST `/api/submissions/:id/reviews` |
| Read account / record top-up or correction | GET `/api/students/:id/credits`, POST `/api/students/:id/credit-adjustments` |
| Atomic attendance and credits | Existing POST `/api/sessions/:id/log`, upgraded contract |
| Publish / withdraw report | POST `/api/reports/:id/publications`, POST `/api/report-publications/:id/withdraw` |
| Authorized PDF download | GET `/api/report-publications/:id/download` |
| Draft/publish/withdraw feedback | POST `/api/students/:id/feedback`, PATCH `/api/feedback/:id`, POST `/api/feedback/:id/publications`, POST `/api/feedback-publications/:id/withdraw` |

Use 401 for no session, 404 for invisible resources, 403 for a forbidden operation
on a visible resource, 422 for invalid input/insufficient credit, and 409 for stale
revisions or conflicting idempotency keys. Bound URL to 2048 characters, reflection/
review to 10000, titles to 200; paginate lists with stable ID/timestamp cursors.
Return no foreign-family IDs or raw database errors. Every mutation is retry-safe.

## Delivery order and acceptance gates

1. **Publication boundary first:** additive snapshot tables, restricted draft
   policies, download authorization, migration of existing reports to private.
   Prove direct SQL/API reads cannot expose draft text or another child's PDF.
2. **Credit ledger:** accounts, receipts, append-only ledger, upgraded log RPC,
   admin adjustments. Reconcile ledger sums and balances. Existing attendance is
   a baseline, never retroactively charged: mark pre-cutover sessions exempt from
   automatic charges/refunds, including later edits. Only explicitly billable
   post-cutover sessions enter the charge transition rules. Import opening
   balances only from an operator-reviewed source, never browser demo data.
3. **Courses and assignments:** same-center constraints, active-course uniqueness,
   publish roster snapshots, explicit roster changes, archive/history behavior.
4. **Submissions/reviews:** guardian and teacher paths, version allocation,
   idempotency, concurrent review/submission conflicts, retained history.
5. **Production UI parity:** wire real APIs and add missing route protection;
   `/courses` and `/assignments` currently have demo routing only. Verify phone,
   tablet, desktop at 360, 390, 768, 1024, and 1440px.

For every slice provide forward migration SQL plus a matching fresh schema,
updated database types, and local RLS tests. Apply to disposable seeded databases
first; do not rerun the non-idempotent root schema over existing data. Preserve
old rows/IDs and test migration twice where idempotency is intended. Deploy
database contracts before enabling dependent UI; keep feature flags off until
validation. Rollback disables the feature and retains audit records rather than
dropping populated tables. Never enable the old log writer after ledger cutover.

Required regression cases: cross-center and cross-family access, peer-teacher
writes, anon calls, stale revision, identical retry, changed-payload retry,
insufficient credit with total rollback, two sessions competing for the last
credit, top-up versus attendance concurrency, refund twice, guardian removal,
unenrollment, simultaneous submissions, review racing resubmission, draft edits
after publish, withdrawn report access, and failed PDF upload/publication.

Use real concurrent database connections for race tests; sequential PGlite checks
alone are insufficient concurrency evidence. Live Auth, PostgREST and private
Storage tests remain a separate release gate when KodeHub infrastructure exists.
