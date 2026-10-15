# KodeHub mock MVP

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
- Full browser interaction, uploads/playback, printing, and responsive visual
  checks: pending. In-app browser connection and fallback Chrome launch were
  blocked by environment errors.

## Next-session manual check

1. Log in, open a student, edit the profile, top up credits, and refresh.
2. Add a video link and a small local video; verify playback after refresh.
3. Save teacher feedback as a draft; check that it is hidden in parent preview.
   Publish the feedback and confirm that it appears there.
4. Log a session with present/absent attendance. Re-save it and confirm there is
   no second deduction. Change a present entry to absent and confirm a refund.
5. Reschedule a logged session and verify ledger/video dates.
6. Create and publish a report; inspect its full Print / Save PDF output.
7. Check navigation, tabs, forms, and dialogs on desktop and a narrow phone screen.
