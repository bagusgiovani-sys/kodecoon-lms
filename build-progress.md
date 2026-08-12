# Build Progress — KOMS
> Started: 2026-07-17 | Last updated: 2026-08-12
> Read this at the start of EVERY Claude Code session before touching any file.

## Status
- [ ] Pending  [~] In Progress  [x] Done

---

## Phase 1 — Project Setup
- [x] Step 1: Create Next.js app (App Router, TypeScript strict) — Next 16; note: middleware.ts is now proxy.ts
- [x] Step 2: Install packages — Tailwind, shadcn/ui, Framer Motion, TanStack Query, Zod, @supabase/ssr, @anthropic-ai/sdk, @react-pdf/renderer
- [x] Step 3: Init git, link Supabase project — git done; **Supabase project link pending Gio** (see Step 9)

## Phase 2 — Design Tokens
- [x] Step 4: Claude Design tokens not delivered → PRD fallback baseline used (dark default, blue-green primary, maroon/red + blue accents)
- [x] Step 5: globals.css written with tokens + data-stream motif utilities
- [x] Step 6: Component inventory → component-inventory.md

## Phase 3 — Backend
- [~] Step 7: schema.sql ready; **running it against the real Supabase project pending Gio's credentials**
- [~] Step 8: RLS verification — **static audit done; harness written 2026-08-12 (`supabase/rls-verification.sql`), execution still needs Step 7.** The harness is 60+ per-role checks in one rolled-back transaction: it seeds two centers, two peer teachers, two families, an admin and an orphan auth account, then impersonates teacher / cross-center teacher / parent / admin / anon and asserts exactly what each can read and write. Every hole found in Sessions 5–7 has a named regression check. Run it straight after schema.sql — it is safe against production, since it ends in `rollback`. **Third pass (2026-08-12) found a critical defect: `users_admin_manage_center` was a policy on `users` that read from `users`, which aborts every statement touching the table with `42P17 infinite recursion` — the role lookup in proxy.ts runs on every request, so the app would have bounced every user to login on first boot.** Fixed with `security definer` helpers (`current_user_role()`, `current_user_center()`); `report_templates_select_staff` tightened from "any authenticated user" to actual staff in the same pass. Details in errors.md.
  Earlier passes: **static audit 2026-08-10, found and fixed a critical privilege-escalation hole**; the per-role live query test still needs Step 7. `users_update_own` had no `WITH CHECK`, so any parent could `update users set role='admin'` and inherit every admin policy — full access to all students' data. Fixed with an explicit `WITH CHECK` + a `before update` trigger blocking self-edits of `role`/`center_id`. Also hardened `student_guardians_all_teacher` (missing role filter), `classes_all_teacher` (unconstrained `center_id`), and added a `users_parent_has_no_center` CHECK so the invariant several policies rely on is enforced, not just commented. Details in errors.md.
- [ ] Step 9: Env vars — `.env.example` documented; **no `.env.local` yet, needs Gio's Supabase/Anthropic/Google keys**
- [x] Step 10: proxy.ts (Next 16's middleware.ts) — three route groups, three rules
- [x] Step 11: database.types.ts generated from schema
- [x] Step 12: seed.sql written (1 center Indonesia, Gio as admin, default report template) — runs after Step 7
- [ ] Step 13: Verify seed data against RLS — blocked on Steps 7–9
- [x] All API route handlers implemented per SDD.md §3 (auth, classes, roster, students, sessions/log, schedule, reports draft+export, admin teachers/schedule/lessons/centers, student profile/journey)

## Phase 4 — Components
- [x] Step 14: shadcn/ui init (21 primitives)
- [x] Step 15: Base UI components
- [x] Step 16: Feature components — AttendanceList, VideoPicker, LessonChecklist, LogSessionForm
- [x] Step 17: JourneyNode + JourneyPath + JourneyNodeDetail (Framer Motion), CenterSwitcher, + admin/schedule/students/student-portal/shared components

## Phase 5 — Pages
- [x] Step 18: Staff login + Student/Parent magic-link login; root layout (dark default, Providers, metadata); landing page with role redirect
- [x] Step 19: (dashboard) layout guard (lib/utils/pageAuth.ts) + Dashboard (My Classes)
- [x] Step 20: My Schedule + Add Session
- [x] Step 21: Class Roster + Add Student (parent invite) + Add Class
- [x] Step 22: Log Session — attendance + video + lesson completion + notes in one flow
- [x] Step 23: Student Detail (teacher side)
- [x] Step 24: (student) layout guard + PortalNav + hub redirect + Student Profile + Journey view
- [x] Step 25: (admin) layout guard (CenterProvider + CenterSwitcher header) + Manage Lesson Plan
- [x] Step 26: Generate Report (AI draft + PDF export) + Manage Teachers (+ TeachersTable) + Academy Schedule

## Phase 6 — Polish + Deploy
- [x] Step 27: PWA manifest + install-to-homescreen — manifest, icons, theme color, iOS standalone meta done and verified in the build output. Installable from the browser menu. **Decision (Gio, 2026-07-22): online-only, no service worker.** Classroom wifi is reliable, offline is unrequested in BRD/PRD/SDD, and a cache layer over minors' data carries risk with no matching benefit. Final install verification happens post-deploy at Step 30, since installability needs HTTPS.
- [~] Step 28: Dark mode QA — **static pass done**, runtime pass blocked on the DB. Audited every `app/` + `components/` file for hardcoded color, light-mode-only palette classes, and theme handling. Findings fixed: Toaster resolved its theme from the OS while the app pins dark; modal scrim (`bg-black/10`) invisible against `#030d12`; no `prefers-reduced-motion` support anywhere despite two infinite CSS loops and an infinite Journey pulse. Verified clean: no hardcoded hex in components (the three hits are PWA metadata + React PDF, both of which can't take CSS vars); `themeColor` `#030d12` matches `--background` exactly; tables already wrap in `overflow-x-auto`. Note: `<html>` pins `dark` unconditionally, so there is no light mode to QA — the light `:root` block is an unused fallback.
- [~] Step 29: Responsive QA — **static pass done, clean.** Audited every layout-bearing file. The low count of `sm:`/`md:`/`lg:` prefixes (35 across 75 files) is not a gap: the layouts use intrinsically-responsive patterns instead — `AppNav` scrolls its tabs via `min-w-0 flex-1 overflow-x-auto` with `shrink-0` items, every table wraps in `overflow-x-auto`, and grids are mobile-first (`grid gap-4 sm:grid-cols-2 lg:grid-cols-3`). No fixed pixel widths outside two shadcn primitives. Runtime pass at three breakpoints still needs a live DB.
- [ ] Step 30: Vercel deploy

---

## Session Log
| Session | Date | Steps completed | Token % at close | Notes |
|---------|------|-----------------|-----------------|-------|
| 1       | 2026-07-17 | 1–6, 10–12 (partial 7), API layer | — | Scaffold, tokens, backend files, all API routes |
| 2       | 2026-07-17 | 14–17 | — | All feature components |
| 3       | 2026-07-17 | 18–26 | — | All pages, guards, root layout; tsc + eslint clean |
| 4       | 2026-08-09 | 28 (static half) | — | Dark-mode + motion audit; 3 fixes; tsc/eslint/build clean, verified in compiled CSS |
| 5       | 2026-08-10 | 8 + 29 (static halves) | — | **Remote found compromised — see Security below.** RLS audit: critical parent→admin escalation fixed. Report-route timeout/token fixes. Responsive audit clean. |
| 6       | 2026-08-10 | 8 (second pass) | — | Full route re-audit: Log Session trusted client-sent studentId (cross-class record corruption) — fixed in route + RLS. staff-login half-provisioned UX. Push still blocked on credential rotation. |
| 7       | 2026-08-12 | 8 (third pass + harness) | — | Remediation push confirmed landed; remote clean. Found `users_admin_manage_center` self-referencing → 42P17 on every query touching `users`; fixed via security definer helpers. report_templates opened to parents — tightened. RLS verification harness written, ready to run the moment Step 7 lands. |

---

## Security incident — 2026-08-10
`origin/main` was **force-pushed with malware** (rewrote `2b23648` → `300f1e7`, preserving Gio's name, email, author date, and commit subject). Two payload files:
- `postcss.config.mjs` (94 B → 9328 B): obfuscated RCE backdoor hidden after `export default config;` behind a long whitespace run. Resolves its C2 by reading the latest transaction from a hardcoded ETH address and decoding the `to` field as two IPv4 addresses, then fetches XOR-encrypted payloads, `eval`s them, and `spawn`s them detached. Executes on **every `next build` / `next dev`**.
- `.gitignore`: deletes the `.env*` line and adds `config.bat` — so the next routine `git add -A` would sweep `.env.local` (Supabase service-role key, Anthropic key, Google OAuth secret) into a commit pushed to the attacker, while a dropped `config.bat` stays invisible to `git status`.

**This machine was never infected** — the commit was fetched but never checked out, and `git fetch` doesn't touch the working tree. Local `postcss.config.mjs` is still the original 94 bytes; no `config.bat`; no IOC matches in tracked files or `node_modules`; no git hooks; git config clean. `CLAUDE.md` and `build-progress.md` on the malicious commit are byte-identical to ours — no prompt injection. Committer timezone on the malicious commit is **+0200**; Gio's is **+0700**.

**RESOLVED 2026-08-10 05:53 +0700 — clean history restored.** The force-push landed: `origin/main` is `51f02f0`, confirmed live via `git ls-remote`, and the malicious `300f1e7` is no longer reachable from the branch. Re-verified 2026-08-12: no IOC matches in tracked files, `postcss.config.mjs` still 94 bytes, `.gitignore` still carries `.env*`, no `config.bat`, no git hooks installed.

**Still open, and Gio's call:** the malicious commit's objects survive in the remote's object store until GitHub garbage-collects them, so anyone with the SHA can still fetch `300f1e7` directly. If credential rotation, PAT/SSH-key revocation, the security-log review (`git.push` events, to find how the attacker got write access), and branch protection with force-push disabled have not all happened, they still need to — restoring the branch closed the symptom, not the entry point.

---

## Current Status
**Last completed:** Step 8's third static pass (2026-08-12) — the `users` policy recursion fix and the RLS verification harness. Before that, Step 27 (partial) — PWA manifest at `app/manifest.ts`, icons generated from the design tokens (`scripts/generate-icons.mjs` → teal-on-dark K monogram, incl. a maskable variant), `themeColor` + `appleWebApp` in the root layout. tsc + production build pass; `/manifest.webmanifest` verified serving valid JSON as `application/manifest+json`.
**In progress:** — Phase 6 is blocked below Step 27; Phase 3 is blocked at Step 7.
**Settled (2026-07-22):** KOMS is **online-only**. No service worker, no offline mode. Installable from the browser menu, which satisfies BRD's "install-to-homescreen"; the automatic install banner is skipped since it would require a service worker. If offline ever comes up, the version worth building is "never lose a session log" (queue writes offline, sync on reconnect) — a scoped feature with conflict-resolution design, not PWA polish.
**Next action:** Steps 7–9 + 13 still need Gio and still block everything downstream. Re-checked 2026-08-12: `.env.local` still absent, Docker still not installed, so a local `supabase start` stack remains unavailable. The Supabase CLI itself is present (2.113.0), so only the project and its credentials are missing.

**The run order once a project exists**, now that the harness is written — schema.sql → `supabase/rls-verification.sql` (expect `ALL CHECKS PASSED`; any failure is a boundary hole, stop and fix before going further) → create Gio's auth user in the dashboard → seed.sql → `npx supabase gen types typescript > types/database.types.ts` (the two new helper functions will appear under `Functions`) → fill `.env.local` → `npm run dev` for the runtime halves of Steps 8, 13, 28 and 29 that no static pass can reach. That closes Steps 7, 8, 9 and 13 in one sitting.

**Blocking on Gio, in priority order:** (1) the remaining security remediation — the branch is restored, but credential rotation, PAT/SSH revocation, the push-log review and branch protection are what actually close the entry point; (2) Steps 7–9 + 13.

Steps 8, 28, and 29 have now been taken as far as static analysis allows (see those steps above). What remains genuinely needs a running app against real data: executing the RLS harness, rendering each of the three route groups to check contrast and layering in situ, and exercising desktop/tablet/mobile breakpoints on screens whose height depends on row counts (roster, schedule calendar, journey with a full 24-lesson plan). Step 30 (Vercel deploy) also waits on Steps 7–9, since the deploy needs the same env vars.

**A note on how much static review is left worth doing.** Three passes over the same schema have now found three separate critical defects, and the third — a policy that would have made the app unbootable — sat in the most-reviewed file in the repo through two prior audits. The honest read is not that a fourth pass would find nothing, but that the returns have shifted: what is left is the class of bug that only a running Postgres reports. Step 7 is now the highest-value unblock in the project by some distance, ahead of any further reading.
