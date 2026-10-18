# KodeHub architecture decision record

Recorded 2026-10-17 from existing code and delivery notes. These records document
existing choices; pending items below are not newly approved requirements.

## ADR-001: Separate demo and authenticated application

**Status:** Implemented for demo delivery, 2026-10-06 onward.

**Context:** Workflows need to be usable before live services are configured.

**Decision:** Default mock mode rewrites supported UI routes through proxy.ts to
the Pages Router demo. Records use localStorage; uploaded video bytes use IndexedDB.
Production API authentication and RLS remain separate. NEXT_PUBLIC_MOCK_MODE=false
selects the live UI after restart/rebuild.

**Consequences:** Demo testing requires no credentials. Parent previews are not
security boundaries. Browser data is not shared or backed up to a server. New demo
features need explicit production schema/API work.

**Evidence:** proxy.ts, lib/mock/config.ts, lib/mock/videoStorage.ts, MOCK-MVP.md.

## ADR-002: Commit core session records atomically

**Status:** Implemented and locally verified, 2026-10-16.

**Context:** Separate writes can leave notes, attendance, and progress inconsistent.

**Decision:** Use the public.log_session security-invoker RPC for status, notes,
attendance, and lesson completion under caller RLS. Video metadata remains a
separate best-effort operation.

**Consequences:** Core writes roll back together. Retries do not duplicate
attendance/progress. A saved session does not guarantee a saved video. Local
checks cover rollback, retries, invalid enrollment, and anon denial; live
Supabase integration remains unverified.

**Evidence:** schema.sql, app/api/sessions/[id]/log/route.ts,
supabase/rls-verification.sql.

## ADR-003: Keep production online-only

**Status:** Accepted user decision, 2026-07-22, recorded in build-progress.md.

**Context:** Offline operation was not required for the classroom pilot.

**Decision:** Provide web app metadata/icons without a service worker or offline
write queue.

**Consequences:** Production needs connectivity. Browser-local demo persistence
does not establish production offline support. Installation behavior still needs
verification on the deployed HTTPS application.

## ADR-004: Separate paid credits and learning progress in the demo

**Status:** Implemented in demo; production parity unresolved.

**Context:** The July specification replaced flat credits with lesson completion.
The expanded demo later introduced paid credits and top-ups.

**Decision:** Demo attendance deducts/refunds credits independently of module
completion. Re-saving attendance must not deduct again.

**Consequences:** The original production schema does not model the entire demo.
A production ledger, atomic transaction rules, and permissions must be specified
before claiming production credit support.

**Evidence:** lib/mock/session.ts, scripts/mock-check.mjs, MOCK-MVP.md.

## ADR-005: Production parity implementation specification

**Status:** Proposed implementation design, 2026-10-17; not implemented.

**Context:** The demo's credits and learning workflows exceed the July schema.

**Decision proposal:** Use append-only credit history with serialized account
updates, center-owned course content, class-scoped published assignments,
immutable submission versions, and separate published feedback/report snapshots.
Start with guardian-submitted work rather than adding a student authentication role.

**Consequences:** Requires additive migrations and a successor to the current
session RPC that can safely mutate protected ledger tables. Family report access
must move off draft rows. No existing demo records are automatically imported.
Admin-only top-ups, shared per-student credits, and permitted late submissions are
explicit implementation defaults, not newly confirmed business requirements.

**Specification:** [PRODUCTION-PARITY.md](PRODUCTION-PARITY.md), including permission
matrix, transaction rules, API contracts, rollout, and acceptance gates.

## Design items now specified for implementation

Report publication portion of ADR-005 completed locally on 2026-10-18:
separate immutable snapshots, private exports, explicit publication/withdrawal,
class-scoped teacher and center-scoped admin management, and authorized downloads
with 60-second signed URLs. Existing reports remain private after migration.
The remaining ADR-005 items are still proposed; live report integration is unverified.

- Production course/lesson ownership and class relationships.
- Student versus guardian submission authority and versioned review permissions.
- Draft/publication visibility for feedback and reports.
- Paid-credit ledger ownership, corrections, and atomic attendance updates.

These are specified in PRODUCTION-PARITY.md; implementation and verification remain pending.
