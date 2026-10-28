# KodeNexus demonstration MVP

User direction and delivery scope, 2026-10-28.

## Agreed direction

### Feedback, certificates and class groups (2026-10-28)

- Class Groups is a center-scoped navigation tab with class codes, schedules and student cards/links.
- Formal learning feedback is due every 12 unique Present attendance records across the
  academy, independently of module completion. Leave and charged Absent do not count.
- Student Feedback opens a dedicated generator/upload page. Generated PDFs contain the
  logo, learner, module(s), attendance period, teacher notes, five skill grades and a polite
  grade legend. Staff choose grades; unassessed skills are explicitly marked.
- Save & publish persists a PDF before publishing its metadata. Parents see availability,
  upcoming periods and previous PDF versions in Feedback reports; old text reports remain.
- Certificates is a separate student tab. Staff upload PDFs for completed individual
  modules; parents download issued files. Issued certificates and earlier reports remain
  historical records after subsequent edits. Upload limit: 10 MB, PDF signature checked.
- PDFs/certificates use browser IndexedDB in this demo, not Drive or Supabase. Parent
  preview works in this browser only; real cross-device delivery remains unimplemented.
- Finance is NOT production-secure: demo identity and localStorage are browser-owned.
  Production must authorize every finance request server-side, deny parents finance data
  through database policies, and restrict receipt storage. A separate URL alone is no protection.
- Splash order: Kodecoon logo, nearby Beyond Coding, then larger spaced blue Kode Nexus.

- The product name is KodeNexus.
- Academy-wide classroom and learning management is authorized.
- Teacher and center manager have equal access in this demo.
- Staff can enter their own students, guardians, classes and enrolments now.
- Learning is individual: students in one time slot can have different modules/lessons.
- Assignments, project submissions and assignment reviews are removed from the current
  demo UI by the user's latest direction. Parents are read-only; staff record after-class
  documentation. Existing stored assignment history and production APIs are retained,
  not deleted or migrated by this UI change.
- Finance belongs inside KodeNexus as a staff section. There is no external payment
  application dependency. Analytics will read approved shared records later.

## Open the demonstration

Run `npm run dev -- --hostname 127.0.0.1 --port 5173` and visit
http://127.0.0.1:5173/login. Choose Teacher or Center manager, then Open KodeNexus.
The app defaults to demo mode unless `NEXT_PUBLIC_MOCK_MODE=false` is configured.

1. Choose STB, PIK or BSD from the center directory or the selector above navigation.
   Each center opens Dashboard, with student/class counts, low-credit alerts (two or
   fewer credits), weekly class activity and today's documentation status. Schedule
   has its own tab. The selector scopes students, classes, attendance, learning records,
   assigned teachers and student-linked payment records; the course library is shared.
   Dashboard also has a temporary center preview selector. It changes only dashboard
   metrics, never the main workspace; leaving and returning resets it to the main center.
2. Create a class: center, unique class code, name, teacher, day and start/end time.
3. Open its timetable block. Create a new student or enrol an existing one.
4. Open the student record to edit identity/guardian details, profile photo or enrolment.
5. Assign an individual module, current lesson, completed count and total lesson count.
6. Open Finance to record an IDR payment and purchased credits; optionally attach a
   PDF, JPG, PNG or WebP receipt under 5 MB. A save records the payment and credits together.
7. From the class roster, select Present, Leave or Absent and open Documentation.
8. Open `/student/login` and select the guardian created in step 3. Only linked
   children appear. Module/credit changes are reflected in the parent profile.

Student and class records can be added without supplying a real dataset. Sample
records remain editable. Students can be saved before enrolment if no class exists.

## Routes

| Route | Purpose |
|---|---|
| `/login` | Choose a teacher or center-manager demo account |
| `/staff` | Center cards and academy counts |
| `/staff/STB/dashboard` | Center summary, low-credit learners and weekly class activity |
| `/staff/STB/schedule` | Center weekly timetable; substitute the center code |
| `/courses` | Courses currently taken in the main center, ordered by active learner count |
| `/courses/library` | Complete academy course library, including zero-enrollment courses |
| `/classes/new` | Add a class/time slot |
| `/classes/:id` | Roster, individual learning summary, attendance and documentation |
| `/classes/:id/edit` | Edit class code, teacher, center and weekly schedule |
| `/students` / `/students/new` | Search learners / create learner and guardian |
| `/students/:id` | Staff student profile, modules, credits and enrolment |
| `/finance` | Staff payment recording, receipt files and package credits |
| `/student/login` | Choose a guardian email for the parent preview |
| `/student` / `/student/:id` | Linked children / child learning profile |

## Attendance and credits

Present and Absent use one lesson credit; Leave and unmarked use none. The legacy
stored `mia` code now displays Absent, and `excused` displays Leave. Legacy `absent`
records retain their previous free treatment and are labeled as legacy history.
Moving between charged statuses does not deduct again. A correction to Leave refunds
the prior charge. Insufficient credits reject the entire attendance save.

Payment requests use an operation ID. Repeating the same payment returns the stored
result; reusing that ID with different details is rejected. Parents see a generic
credit grant in their child's credit history, without amount paid or receipt details.
Opening demo balances are independent from newly recorded payments.

## Persistence and access limits

- Records use the existing localStorage key to preserve earlier demonstration work.
- Profile photos, video uploads and receipt attachments use browser IndexedDB.
- Demo identity is stored per tab in sessionStorage. Login/role selection is simulated.
- Parent routing checks guardian email links, denies staff/finance/other-child pages,
  and disallows writes. Assignments are absent from profiles and navigation.
- Browser-local role checks do not protect data from someone with browser developer
  tools or direct access to this browser's storage. Use fictional demonstration data.
- This is not live Supabase authentication or a production financial access boundary.
- No money is collected or transferred. Payment records are manually entered demo data.
- Drive links can be embedded using the file's existing permissions; automatic private
  academy Drive upload and verified parent playback are not delivered in this slice.
- Multi-user consistency, shared storage, authenticated APIs and finance database
  permissions require a separate production implementation. Concurrent tab writes
  are not a replacement for database transactions.

## Verification

- TypeScript, lint and production build checked for this slice.
- Local Chrome covers create/edit student/class, individual module, IDR payment with
  receipt, double-click credit protection, refresh persistence, attendance corrections,
  guardian scoping, denied routes and equal teacher/manager demo access.
- Layout checks cover Centers, timetable, class roster, profile and Finance at
  360, 390, 768, 1024 and 1440px.
- Browser driver/results/screenshots are kept in Temp, outside Git.
- See build-progress.md for exact final check outcomes and known existing warnings.

## Loading, motion and input protection

- Full page loads and refreshes show the supplied transparent Kodecoon logo in blue,
  with a digital scan, moving data trails and "Beyond Coding". Normal demo navigation
  keeps the shell mounted; reduced-motion preferences suppress decorative movement.
- Framer Motion animates route content, student tabs, dashboard bars, hover and press
  interactions. The system reduced-motion setting disables decorative motion.
- Finance, attendance, student profiles and the course workspace load as separate
  dynamic bundles with skeleton fallbacks. Off-screen video cards defer media reads;
  embedded frames use native lazy loading.
- Student and payment searches debounce for 250 ms. Shared action buttons suppress
  repeated clicks for 500 ms; video uploads have an in-flight save lock. The payment
  ledger retains operation-ID retry protection. These guard common demo interactions;
  production requests still need server validation and database transactions.
- Payments currently follow a student's enrollment, not an accounting center assigned
  to the transaction. Multi-center learners can appear in multiple center views. Do not
  treat these views as authoritative revenue-by-center analytics.

## Center course counts

- Count distinct currently enrolled learners per course in the main center. Multiple
  active modules in one course count the learner once. Completed modules and learners
  enrolled only in another center do not contribute.
- Each learner module can link to a library course through Learning Journey → Edit
  learning → Library course. Custom module names stay editable; unlinked modules are
  disclosed rather than matched by guessed names.
- Explicit active individual course links override legacy class-wide course defaults.
  Existing class-course mappings remain a fallback for active/unconfigured learners;
  learners with only completed module records do not count as active.
- Center courses show positive counts, highest first; the full library includes zero
  counts. Equal counts sort by course title. Subject filters use Competition in place
  of Engineering, including saved records carrying the earlier category label.
