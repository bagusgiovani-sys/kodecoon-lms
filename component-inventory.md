# Component Inventory — KOMS
> Step 6 deliverable. Derived from PRD.md Screen Inventory, 2026-07-17.
> Rule: shadcn primitives in `components/ui/` carry no business logic. Feature components receive initial data as props from Server Components (CLAUDE.md §7).

## shadcn/ui primitives (`components/ui/`)
Installed via CLI: `button card input label textarea select dialog alert-dialog badge avatar checkbox switch table tabs sonner skeleton dropdown-menu popover separator sheet progress alert`

| Primitive | Used by |
|-----------|---------|
| button, input, label, card | every form/screen |
| textarea | Log Session notes, Generate Report |
| select | Add Session (class), Academy Schedule (assign teacher) |
| dialog | Add Session, Invite Teacher |
| alert-dialog | Delete lesson warning (studentsAffected count) |
| badge | session status, program cards, attendance status |
| avatar | roster, Student Profile (initials-based, SDD §7) |
| checkbox / switch | attendance toggles, lesson completion |
| table | roster, Student Detail history, Manage Teachers, Academy Schedule |
| tabs | Student Detail (attendance / progress / videos / notes) |
| sonner | save confirmations ("Saved, but video didn't attach…") |
| skeleton | loading states (data-stream shimmer variant) |
| dropdown-menu | nav user menu, CenterSwitcher |
| sheet | mobile nav, Journey node detail on small screens |
| progress | roster X/Y lessons, program cards |
| alert | sparse-data warning on Generate Report, error states |

## Feature components

### `components/session/` (client — optimistic toggles)
- **AttendanceList** — roster rows with present/absent toggle, defaults unmarked (PRD acceptance criteria)
- **VideoPicker** — Google Drive Picker launch + paste-a-link fallback; failure never blocks save
- **LessonChecklist** — per-student checklist of that class's lesson plan; marks completions for this session
- **LogSessionForm** — orchestrates the three above + session notes + submit → `PATCH /api/sessions/:id/log`; warns on zero attendance; local draft survives refresh (localStorage)

### `components/journey/` (client — Framer Motion, highest-attention surface)
- **JourneyPath** — snake-path layout of ordered nodes with SVG connector, staggered entrance animation
- **JourneyNode** — one lesson node: locked / unlocked / completed states, tap handler
- **JourneyNodeDetail** — sheet/popover on completed-node tap: date, session video link, teacher notes

### `components/admin/`
- **CenterSwitcher** — persistent dropdown in admin header; sets active center (React Context); 1 option in v1 but the scoping pattern exists now
- **TeacherAssignGrid** — Academy Schedule table: every session × assign-teacher select → `PATCH /api/admin/sessions/:id/assign`
- **LessonPlanEditor** — add / edit / delete / reorder (integer sequence up-down, no drag lib) → lessons endpoints; delete shows studentsAffected warning
- **InviteTeacherDialog** — name + email → `POST /api/admin/teachers`

### `components/schedule/`
- **ScheduleCalendar** — month grid of teacher's own sessions (scheduled/completed states)
- **AddSessionDialog** — class + date + time → `POST /api/sessions`

### `components/students/`
- **StudentHistoryTabs** — attendance history, lesson progress history, videos, notes (the dispute-ending screen)
- **ReportEditor** — rough notes → "Draft with AI" → editable draft → "Export PDF"; manual fallback if AI fails; never auto-exports

### `components/student-portal/` (parent side, read-only)
- **ProgramCard** — active (with X/Y progress) or completed program → links to Journey
- **ReportsList** — generated PDFs, view/download
- **StudentSwitcher** — only when >1 linked child

### `components/shared/`
- **AppNav** — dashboard nav tabs + admin link (visible to role=admin) + user menu + LanguageToggle
- **LanguageToggle** — EN / Bahasa Indonesia, cookie-persisted, top-right (PRD resolved question)
- **EmptyState** — every list screen has a designed empty state per PRD edge cases
- **PageHeader** — title + action slot, consistent across screens
- **DataStream** — the particle/data-stream motif as a decorative background layer (login, loading) — sparing, never at readability's cost
- **Providers** — TanStack QueryClientProvider + LanguageProvider + (admin) CenterProvider

## Contexts (client state — CLAUDE.md §2 limits these to two)
- **LanguageContext** — 'en' | 'id', dictionary lookup, cookie persistence
- **CenterContext** — admin's active center id, feeds every admin query scope
