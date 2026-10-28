# KodeNexus mock MVP

## Editable academy demonstration — 2026-10-28

See [docs/kodenexus-mvp.md](docs/kodenexus-mvp.md) for the current demo flow:
center cards/timetables, class and student editing, enrolment, individual learning,
staff Finance (IDR/receipts/credits), selected-guardian previews and route checks.
Browser-local demo identity and storage are not production authorization or shared data.
The dated entries below describe earlier delivery history.

## Learning pages added 2026-10-15

- `/courses`: searchable course cards with subject filters, age/level, and
  lesson counts. Three starter courses cover robotics, coding, and engineering.
- `/courses/:courseId`: prerequisites, ordered lesson cards, and class linking.
  Each class links to one course; replacing that link preserves its existing
  attendance, credit balance, module progress, and assignments.
- `/courses/:courseId/lessons/:lessonId`: objectives, materials, activity steps,
  evidence criteria, editable lesson content, and assignment creation.
- `/assignments`: create assignments, filter by class, inspect due dates and
  submitted-learner counts. Empty states guide the first assignment.
- `/assignments/:assignmentId`: project brief, enrolled-student roster, HTTPS
  project links, reflections, review outcomes, feedback, and submission history.
  Resubmissions create new versions; prior reviews stay attached to their version.

These are teacher-managed demo pages. The parent preview can also record a
child's HTTPS project link and reflection, or submit a new version after review.
Submissions remain browser-local demo records; there is no authenticated student
account, code execution, file upload, cloud storage, or production API for them.
Optional `learning` data lives inside the existing browser-local record. Older
demo saves still load and gain course data on the first learning-page save.
Course lessons are separate from the original attendance/module-completion
model: assigning a course does not automatically complete or replace modules.

Parent preview includes an assignment card on each child’s record. It shows due
dates, that child’s submission status, reflection, and teacher feedback. The
parent can submit an HTTPS project link and reflection, then send a new version
after review. Submission data is filtered by both assignment and child so
siblings in the same class see only their own work. This remains a demo preview,
not an authenticated student portal; changes stay in the browser.


> Last updated: 2026-10-06. Interactive mock delivery; live production setup remains pending.

Run `npm install`, then `npm run dev -- --hostname 127.0.0.1`.
Open http://127.0.0.1:3000 and press **Log in**. No credentials are needed.

Checks: `npm run build`, `npm run lint`, and `node scripts/mock-check.mjs`.

Mock mode is enabled by default. `NEXT_PUBLIC_MOCK_MODE=false` restores the
original Supabase application after restarting/rebuilding. Real API route
authorization and database policies are unchanged; the demo uses separate
Pages routes via the proxy and never creates a real authenticated session.

The demo includes six students, three programs, a schedule, module progress,
video documentation, a credit ledger, teacher feedback, teacher assignments,
and reviewed progress reports. Teacher actions persist in localStorage under
`kodehub-mock-mvp-v1`. Uploaded videos (maximum 100 MB each) persist in IndexedDB
under `kodehub-mock-videos`. Nothing is uploaded to a backend. A fresh browser
starts from the seed data. Removing these two browser stores resets the demo.

Marking attendance present deducts one credit. Re-saving the same session does
not deduct again. Changing present to absent refunds that session's credit.
Module progress is managed independently and can be reopened from the student
record. The parent hub shows the two seeded family members. Each student's
record also has a parent preview showing published feedback/reports.
It is a UI preview, not an authentication boundary.

Video documentation accepts a local upload or HTTPS link. YouTube and Google
Drive links are embedded; other URLs use the native video player with an
original-link fallback. Drive sharing must permit the viewer to watch.
The seeded clip is sample footage, not real classroom documentation.

Reports use a local data-based draft, human edits, publication to the parent
view, and the browser's **Print / Save PDF** action. AI calls, invitation emails,
cloud video storage, and payments are not performed by the demo.

## Verified and pending

- Production build and TypeScript: passed.
- Lint: zero errors; two pre-existing warnings in the RLS graph script.
- Session/credit regression checks: deduction, absence, module completion,
  duplicate-save protection, video deduplication, rescheduling dates, correction
  refunds, video removal, and insufficient-credit atomicity passed.
- Eleven demo routes: HTTP 200 without service credentials.
- Browser workflows verified on 2026-10-15: profile/top-up persistence, local
  WebM upload/playback after refresh, video-link persistence, draft/public
  feedback visibility, attendance retries/corrections, session rescheduling,
  and report publication to parent preview. Zero page errors.
- Print / Save PDF now prints only the selected report with learner name/date.
  Teacher/parent PDFs and a five-page report were verified, including the final
  text. Screen/print layouts had no overflow at five widths from 360 to 1440px.
- Native print dialogs/physical printers and third-party video playback were
  not verified. In-app browser remained unavailable; approved local Chrome
  checks supplied the browser evidence. Live Supabase QA remains pending.

## Repeatable manual regression checklist

1. Log in, open a student, edit the profile, top up credits, and refresh.
2. Add a video link and a small local video; verify playback after refresh.
3. Save teacher feedback as a draft; check that it is hidden in parent preview.
   Publish the feedback and confirm that it appears there.
4. Log a session with present/absent attendance. Re-save it and confirm there is
   no second deduction. Change a present entry to absent and confirm a refund.
5. Reschedule a logged session and verify ledger/video dates.
6. Create and publish a report; inspect its full Print / Save PDF output.
7. Check navigation, tabs, forms, and dialogs on desktop and a narrow phone screen.
