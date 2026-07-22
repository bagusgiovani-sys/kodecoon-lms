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
