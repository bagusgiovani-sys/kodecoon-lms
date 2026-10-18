# Local RLS harness runner

Runs `schema.sql` and `supabase/rls-verification.sql` against a real Postgres
**without a Supabase project and without Docker**, so the RLS boundary can be
verified on any machine at any time.

```bash
npm run rls:verify   # forward migration + schema.sql + the 95-check harness
npm run rls:graph    # print the policy dependency graph and any cycles
```

## Why this exists

Step 7 (running schema.sql against a live Supabase project) has been blocked on
credentials since 2026-07-17, and this machine has neither Docker nor a local
Postgres, so `supabase start` is unavailable. That left `rls-verification.sql`
written but never executed — and three separate critical defects have now been
found in schema.sql that **static review did not catch**, two of them only when
the SQL was actually run (see errors.md, Sessions 7 and 8).

[PGlite](https://pglite.dev) is real Postgres compiled to WASM, running
in-process as a dev dependency. It enforces RLS, `SET ROLE`, `SECURITY DEFINER`,
and the policy-recursion guard exactly as a server does — which is precisely the
behaviour that static review cannot reproduce.

## What the shim provides, and what it does not

`shim.sql` supplies only the Supabase surface that schema.sql and the harness
actually touch:

- the `auth` schema and an `auth.users` table matching the columns the harness inserts
- `auth.uid()` / `auth.role()` — **Supabase's own definitions**, reading the
  `request.jwt.claims` GUC, `nullif` before the cast so an empty claims string
  (how the harness impersonates `anon`) yields `NULL` rather than a 22P02
- the `anon`, `authenticated` and `service_role` roles

`grants.sql` applies the blanket table grants Supabase issues at project
bootstrap, outside the user's schema. Table privileges are wide open by design
there; RLS is what actually restricts.

**This does not replace running the harness against the real project.** It
verifies the *SQL and the policy logic*. It does not cover Supabase's auth
integration, PostgREST's behaviour, Storage, or anything in `storage-setup.sql`
(which needs the real `storage.buckets`). Run the harness against the live
project too, once Step 7 lands.

## Report publication checks

The runner first applies the forward report migration to a disposable legacy
schema and verifies preservation of existing private rows. It then runs the
fresh-schema permission suite, including publication retry, immutable snapshots,
private draft edits, unrelated families/teachers/centers, guardian removal,
withdrawal and missing PDF metadata. The Storage shim supplies only buckets and
object metadata, never actual files, signed URLs, or Storage policy behavior.
The runner exits nonzero if any recorded check fails.

Run `node scripts/report-download-check.mjs` for isolated tests of the actual
download handler's auth, RLS query, path validation and short-lived redirect.
Live Auth/PostgREST/Storage checks remain required before release.

## Session logging RPC checks

The harness grants Supabase's default function privileges, then reapplies the
intended grants for `public.log_session`. It verifies atomic writes and retries,
rollback when a later write fails, rejection of out-of-class students, and
denial to `anon`.

## graph.mjs

Parses every `create policy` in schema.sql, builds the table-to-table read graph,
and reports cycles. **Any cycle aborts every query touching any table in it with
`42P17 infinite recursion detected in policy`** — a hard statement failure, not a
slow query. This is the check that would have caught all three recursion defects.
Run it after any policy change.
