# KodeHub

KodeHub (formerly KOMS) is the Kodecoon classroom operations and learning workspace.
The browser-local demo is usable; live Supabase setup and verification remain pending.

## Project documents

- [PRD.md](PRD.md): product requirements and current scope.
- [SDD.md](SDD.md): system architecture, API and database design.
- [ADR.md](ADR.md): architecture decisions and pending design work.
- [PRODUCTION-PARITY.md](PRODUCTION-PARITY.md): production models, permissions, transaction contracts, and delivery gates.
- [BRD.md](BRD.md): original business objectives.
- [DESIGN.md](DESIGN.md): approved visual and responsive requirements.
- [MOCK-MVP.md](MOCK-MVP.md): demo workflows and limitations.
- [build-progress.md](build-progress.md): delivery and verification evidence.
- [AGENTS.md](AGENTS.md): repository working instructions.

Read the current PRD/SDD addenda before their July baseline. Planned features are not proof of delivery.
Reports and credits are implemented locally; live service and concurrency verification remain pending.
The course library database/API is implemented locally; its production UI remains pending.
Next implementation work covers class course links, assignments,
versioned submissions, reviews, and general feedback publication.

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
- `node scripts/credit-api-check.mjs`
- `node scripts/report-download-check.mjs`
- `node scripts/course-db-check.mjs`
- `node scripts/course-api-check.mjs`

The local SQL harness verifies policies, not live Supabase Auth, PostgREST, or Storage.
