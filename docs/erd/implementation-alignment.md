# ERD implementation alignment — 29 October 2026

Internal evidence companion. The shareable PDF is a logical integration contract,
not a certification that all its tables and authorization rules are deployed.

| Topic | Evidence | Alignment / next action |
|---|---|---|
| Default app | `lib/mock/config.ts`, `pages/demo.tsx`, `components/mock/MockProvider.tsx` | Demo defaults on; data/identity use browser storage. This is not real authentication or a shared database. |
| Physical SQL | `schema.sql`, `supabase/migrations/` | Existing courses, class-course assignments, lessons, attendance, credits, reports and legacy assignments. Map logical ERD names before writing migrations. |
| Individual modules | `lib/mock/nexus.ts`, `components/mock/StudentRecord.tsx`; SQL `class_course_assignments` | Demo supports individual modules. Production needs mapping/migrations for independently assigned modules within a shared time slot. |
| 12-attendance feedback | `lib/mock/studentDocuments.ts`, `components/mock/FeedbackReportPage.tsx` | Demo counts unique Present sessions across the academy. PDFs persist locally. Production cycles/publications need migrations and entitlement checks. |
| Certificates | `components/mock/StudentDocuments.tsx` | Demo uploads/downloads for completed modules. The logical certificate table is not deployed SQL. |
| Assignments | `components/mock/MockApp.tsx`, `app/api/assignments/`, `app/api/submissions/` | Removed from demo/product contract; legacy APIs/SQL remain. Retire deliberately; ERD regeneration does not delete historical records. |
| Files | `components/mock/StudentRecord.tsx`, `lib/mock/videoStorage.ts`, `app/api/student-media/route.ts` | Demo uses IndexedDB or pasted Drive links. Production student-media uses Supabase signed URLs. Academy Drive upload/private family playback remains incomplete. |
| Lesson resources | Logical `lesson_materials`; SQL `course_lessons` | Adds versioned PDF/PPT attachment contract. Secure upload/viewer backend was not implemented by this ERD update. |
| Staff roles | `proxy.ts`, `components/mock/MockApp.tsx` | Demo teacher/center_manager share access. Production proxy still accepts teacher/admin. Align auth, APIs and RLS before rollout. |
| Finance/Analytics | `components/mock/CenterDashboard.tsx`, ERD ownership pages | Nexus owns operations/credit units. Finance writes money; Analytics reads approved views. External integration is not verified. |
| Shared registry | ERD integration contract | Colleague schema/IDs/API have not been supplied. Reuse her consolidated records after mapping; do not create duplicate writable student tables. |

Integration order: exchange schema and canonical IDs, assign write owners, map/add
operational tables, implement and test roles/guardian access, test private family
file delivery, then connect idempotent Finance credit grants and Analytics views.
No live database was inspected or migrated in this review.
# Version 1.2 legacy report note

The logical feedback report now allows a missing attendance-cycle link and records
report date and source system so prior Student Progress Tracker end-module feedback
can remain visible as historical material without counting toward new 12-attendance
cycles. This is a logical contract update only. The deployed SQL schema has not been
migrated to add these fields or accept nullable cycle IDs. Physical migration and
mapping must be checked against the colleague's consolidated database before use.
