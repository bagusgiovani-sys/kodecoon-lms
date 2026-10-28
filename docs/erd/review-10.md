## Integration, permissions and handoff

PROPOSED / Decisions to settle with the analytics builder

### Use the migration already completed

First inspect her table/column list, keys, duplicate-resolution rules and update process. Is it a database used for daily edits or a periodically refreshed analytics copy? Preserve canonical IDs; map legacy Tracker/OClass identifiers through a source-ID mapping. Never join students by name alone.

### One balance and an explicit cutover

Reconcile student identity, active enrolments and opening credit units before rollout. Each imported operation needs a stable external ID to reject duplicate delivery. Stop editing the old tracker for the records transferred to the agreed system. Do not synchronize two independently editable balances.

### Safe staff and family access

Teacher and center manager have equal staff permissions per the confirmed product direction; current guards still accept teacher/admin. Enforce role, academy and child scope in pages, APIs and database policies. Parent URLs never authorize access by themselves. Parents see only linked children and shared work; no supervisor checklist, draft staff notes or finance access.

### Assignments must follow individual learning too

Existing assignment_learners, submission versions and reviews can be preserved. Proposed assignment targets must reference the learner's module attempt, with an optional class/session context. Validate lesson/module consistency. Publishing captures the brief and recipients; changing a time slot does not erase submissions or reviews.

### What to exchange next

Share this PDF and the editable schema index. Ask for her ERD/schema, canonical student and class identifiers, imported-field list, update ownership and synchronization approach. Compare before writing migrations. Confirm where staff adds new students and where new credit grants originate.

### No deployment claim

Existing RLS and migration test sources exist, but none were run for this document. The PDF was checked for legibility and coverage. Drive parent playback, multi-center authorization, data reconciliation and live integration remain implementation/release work.
