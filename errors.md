# Error Log — KOMS
> Append-only. Never edit existing entries. Never delete.
> Read this at the start of every Claude Code session.

## Entry Format
---
## [YYYY-MM-DD HH:MM] [Short title]
#[type] #[concept]
**Context:** What were you building
**Error:** Exact error message or description
**Root cause:** Why it actually happened
**Fix:** Exactly what resolved it
**Prevention:** Rule to add to CLAUDE.md > What NOT To Do
**Files affected:** List of changed files
---

## Log

---
## [2026-07-17 Session 1] create-next-app generates its own CLAUDE.md — clobbered project CLAUDE.md on move
#[tooling] #[scaffold]
**Context:** Step 1 — scaffolding Next.js 16 in scratchpad (directory name "KodeHub" has capitals, which create-next-app rejects), then moving generated files into the project root with `Move-Item -Force`.
**Error:** create-next-app v16 now emits an `AGENTS.md` plus a `CLAUDE.md` containing only `@AGENTS.md`. The forced move overwrote Gio's 19KB project CLAUDE.md with that one-line pointer.
**Root cause:** Assumed the scaffold output had no filename overlap with existing project docs; didn't diff the two file sets before a forced move.
**Fix:** CLAUDE.md restored verbatim from session context immediately. No other overlap existed (verified: only CLAUDE.md collided).
**Prevention:** When merging generated output into a non-empty directory, list both sides and resolve collisions explicitly first — never `-Force` blind.
**Files affected:** CLAUDE.md (restored), AGENTS.md (new, scaffold-generated — kept as Next 16 reference)
---
## [2026-07-17 Session 3] lucide-react `Map` icon import shadowed the global Map constructor
#[typescript] #[imports]
**Context:** Step 24 — Journey page uses a `new Map(...)` lookup and also imports lucide's `Map` icon for the empty state.
**Error:** `TS7009: 'new' expression, whose target lacks a construct signature` plus a cascade of bogus type errors on the same page.
**Root cause:** `import { Map } from 'lucide-react'` shadows the built-in `Map` in that module, so `new Map()` targets the icon component.
**Fix:** Alias the icon: `import { Map as MapIcon } from 'lucide-react'`.
**Prevention:** When a lucide icon shares a name with a JS global (Map, Set, Text, Infinity…), always alias it on import.
**Files affected:** app/(student)/student/[studentId]/classes/[classId]/journey/page.tsx
---
## [2026-07-17 Session 3] proxy.ts infinite redirect for sessions with no users row
#[auth] #[middleware]
**Context:** Tracing route guards after building Phase 5 pages.
**Error:** An authenticated auth.users session with no public.users row hit `homeFor(null)` → `/dashboard` → failed the staff role check → redirected to `/dashboard` again — ERR_TOO_MANY_REDIRECTS, user locked out until cookies cleared.
**Root cause:** `homeFor(null)` defaulted to `/dashboard`, and the role-mismatch redirect sent role-less sessions to the same protected path they were already on.
**Fix:** proxy.ts now treats a role-less session as unauthenticated: protected routes redirect to the matching login, login routes render normally.
**Prevention:** Every role-based redirect must have an explicit branch for "authenticated but unprovisioned" — never let a null role fall into a role's home path.
**Files affected:** proxy.ts
---
## [2026-08-09 Session 4] Toaster resolved its theme from the OS while the app is pinned dark
#[ui] #[theming]
**Context:** Step 28 dark-mode QA — static audit of theme handling across all three route groups.
**Error:** `components/ui/sonner.tsx` called `useTheme()` from next-themes, but no `ThemeProvider` is mounted anywhere in the tree. Without a provider the hook returns `theme: undefined`, so the `= "system"` default applied and Sonner resolved light/dark from `prefers-color-scheme` — on a light-mode device, toasts styled themselves light over an app that pins `<html class="dark">`.
**Root cause:** The shadcn Toaster ships wired for a next-themes toggle. KOMS hard-codes `dark` on the root element and never installed the provider, so the stock wiring silently fell through to OS preference. Masked in most cases because `--normal-bg`/`--normal-text`/`--normal-border` are overridden to app tokens, which hid the mismatch on everything except Sonner internals.
**Fix:** Pass `theme="dark"` literally and drop the next-themes import. That was its only usage — the package is now unreferenced (left installed; it becomes relevant again if a theme toggle ever ships).
**Prevention:** When a shadcn primitive reads theme state, confirm the matching provider is actually mounted — a missing provider degrades to a silent default, not an error. If the app pins a theme, pin it in the primitives too rather than leaving them to infer it.
**Files affected:** components/ui/sonner.tsx
---
## [2026-08-09 Session 4] Modal scrim invisible against the near-black dark background
#[ui] #[dark-mode]
**Context:** Step 28 dark-mode QA — checking layering on Dialog, AlertDialog, and Sheet.
**Error:** All three overlays used the stock `bg-black/10`. Over `--background` (`oklch(0.15 0.02 230)` = `#030d12`) a 10% black scrim moves each channel by ~2/255 — imperceptible. Modals did not read as layered above the page; separation rested entirely on a 2px backdrop blur and a 10% ring.
**Root cause:** shadcn's default scrim opacity is tuned for a light-background app. KOMS is dark-only, and nobody re-checked the value after the dark palette landed.
**Fix:** Raised all three to `bg-black/50`. Verified in the compiled CSS as `background-color:#00000080`.
**Prevention:** Stock component opacity values are calibrated against a light ground — re-check every scrim, shadow, and overlay after adopting a dark-default palette.
**Files affected:** components/ui/dialog.tsx, components/ui/alert-dialog.tsx, components/ui/sheet.tsx
---
## [2026-08-10 Session 5] CRITICAL: parents could self-promote to admin via users_update_own
#[security] #[rls]
**Context:** Static audit of every RLS policy in schema.sql (the Step 8 work that can be done without a live DB).
**Error:** `create policy "users_update_own" on users for update using (id = auth.uid());` — no `WITH CHECK`. Postgres reuses the `USING` expression as `WITH CHECK` when it is omitted, and `id = auth.uid()` still holds after a row rewrites its own `role`. So any authenticated parent could run `update users set role='admin', center_id='<uuid>' where id = auth.uid()` and inherit all four `*_admin_manage_center` policies — every student, session, lesson, and report in the academy. The `center_id` needed is readable from their own child's class row via `classes_select_parent`.
**Root cause:** `WITH CHECK` was omitted on every mutating policy, which is harmless where the `USING` expression constrains the columns that matter (`sessions_all_teacher` pins `teacher_id`, so a teacher can't hand off a session) but catastrophic on `users`, where the only constrained column is the primary key. App-layer guards are irrelevant here: `NEXT_PUBLIC_SUPABASE_ANON_KEY` ships in the browser bundle by design, so a parent with a valid JWT reaches PostgREST directly and never passes a route handler. RLS genuinely was the only boundary, exactly as CLAUDE.md §6 says — and it had a hole.
**Fix:** Explicit `WITH CHECK` on `users_update_own`, plus a `before update` trigger (`prevent_self_privilege_escalation`) that rejects any self-edit changing `role` or `center_id`. Scoped to `auth.uid() = new.id`, so admins managing *other* staff and service-role operations (where `auth.uid()` is null) are unaffected. Also hardened two adjacent weaknesses found in the same pass: `student_guardians_all_teacher` was missing the `role in ('teacher','center_manager','admin')` filter its sibling `students_all_teacher` has (not currently exploitable only because parents carry `center_id = null`), and `classes_all_teacher` let a teacher move a class into another center. Added a `users_parent_has_no_center` CHECK constraint so the "null for parents" invariant is enforced rather than documented — several policies scope by `center_id in (select center_id from users where id = auth.uid())` and silently widen if a parent ever gets one.
**Prevention:** Never omit `WITH CHECK` on a `for update` / `for all` policy whose `USING` clause doesn't constrain every column that grants privilege. For any table with a `role` or tenant column, assume the row's owner will try to edit it. Treat "the anon key is public" as the threat model for every policy — route-handler checks are UX, never a boundary.
**Files affected:** schema.sql
---
## [2026-08-10 Session 5] Report routes would 504 before their own fallback could fire
#[deployment] #[vercel]
**Context:** Auditing the Anthropic call in `lib/ai/reportDraft.ts` against the current API docs.
**Error:** Neither report route exported `maxDuration`, so Vercel's default function window (10–15s) applied, while the Anthropic client was configured for `timeout: 45_000` with `maxRetries: 1` — up to 90s. The platform would kill the function first, so the teacher would get a raw 504 instead of the "write the report manually" 502 the PRD requires. Separately, `max_tokens: 2048` caps thinking *and* response text together, so an adaptive thinking pass could consume the budget and truncate a report mid-sentence.
**Root cause:** The SDK timeout was chosen against an assumed Vercel window that was never configured, and `max_tokens` was sized for the visible answer without accounting for adaptive thinking sharing the same budget.
**Fix:** `export const maxDuration = 60` on both report routes; SDK timeout lowered to 25s so two attempts fit inside it; `max_tokens` raised to 16000 (a ceiling, not a reservation — headroom is free). Verified `claude-opus-4-8` and `thinking: {type:'adaptive'}` are both current and correct; on Opus 4.8 an omitted `thinking` field means no thinking at all, so the explicit setting is load-bearing.
**Prevention:** Any route calling an LLM or rendering a PDF needs an explicit `maxDuration`, and the client-side timeout budget must fit inside it — otherwise graceful-degradation paths are dead code. When thinking is enabled, size `max_tokens` for thinking plus output.
**Files affected:** lib/ai/reportDraft.ts, app/api/students/[id]/report/draft/route.ts, app/api/students/[id]/report/export/route.ts
---
