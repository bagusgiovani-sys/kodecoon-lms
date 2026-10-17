# KodeHub

KodeHub (formerly KOMS) is the Kodecoon classroom operations and learning workspace.
The browser-local demo is usable; live Supabase setup and verification remain pending.

## Project documents

- [PRD.md](PRD.md): product requirements and current scope.
- [SDD.md](SDD.md): system architecture, API and database design.
- [ADR.md](ADR.md): architecture decisions and pending design work.
- [BRD.md](BRD.md): original business objectives.
- [DESIGN.md](DESIGN.md): approved visual and responsive requirements.
- [MOCK-MVP.md](MOCK-MVP.md): demo workflows and limitations.
- [build-progress.md](build-progress.md): delivery and verification evidence.
- [AGENTS.md](AGENTS.md): repository working instructions.

Read the current PRD/SDD addenda before their July baseline. Planned features are not proof of delivery.
Next design work reconciles production models for paid credits, courses, assignments,
versioned submissions, reviews, and publication permissions with the expanded demo.

## Run locally

Run `npm install`, then `npm run dev -- --hostname 127.0.0.1`.
Open http://127.0.0.1:3000 and select **Log in**. Default demo mode needs no credentials.
Records persist only in this browser; video uploads use IndexedDB. Parent previews are not authenticated accounts.
See .env.example for live configuration requirements.

## Checks

- `npm run build`
- `npm run lint`
- `node scripts/mock-check.mjs`
- `npm run rls:verify`
- `npm run rls:graph`

The local SQL harness verifies policies, not live Supabase Auth, PostgREST, or Storage.
