# KodeNexus

KodeNexus (formerly KodeHub / KOMS) is Kodecoon's classroom operations and learning workspace.
The editable demonstration includes centers, class codes/timetables, students,
enrolments, individual modules and a staff Finance section for IDR payments/receipts.
See [the demonstration guide](docs/kodenexus-mvp.md) for the latest user decisions,
click-through steps and the distinction between browser-local and live behavior.

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
The course library and feedback UI have separate feature flags; assignment/submission
backends exist. Their live integration and broader authenticated UI remain separate work.

## Run locally

Run `npm install`, then `npm run dev -- --hostname 127.0.0.1`.
Open http://127.0.0.1:3000 and select **Open KodeNexus**. Default demo mode needs no credentials.
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
