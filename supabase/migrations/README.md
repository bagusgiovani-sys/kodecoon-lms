# Forward migrations

For an existing KodeHub database, apply `202610170001_report_publications.sql`
once, in one transaction, before deploying the report publication UI/API. For a
new database use `schema.sql`, which already includes the same change; do not
apply the migration again. The private `reports` Storage bucket must be configured
using `supabase/storage-setup.sql` before exporting reports.

The migration preserves existing report rows and legacy URL columns, removes
guardian access to those private rows, and creates an empty publication table.
It never automatically publishes old reports. Re-export reviewed legacy report
text to create a new private PDF, then explicitly publish the new export.
Existing class-less reports remain stored but are not exposed through the new
class-scoped API; an operator must review/map these before re-exporting them.

New exports store an object path. Publishing checks that its matching Storage
metadata exists and creates an immutable final-text/PDF snapshot. Retrying does
not duplicate it or reopen a withdrawn publication. Re-publication requires a
new export. Teachers and same-center admins can manage the relevant classes;
guardians read only their own child's active snapshots. Direct client writes to
publication rows are denied.

Downloads recheck caller RLS before issuing a 60-second private signed URL.
Withdrawal or unlinking a guardian prevents new downloads. Previously issued
URLs remain usable until expiry; existing legacy one-year URLs are not revoked
by this migration. If immediate legacy-link revocation is required, review the
affected Storage objects separately. Previously downloaded PDFs cannot be revoked.

Validation: `npm run rls:verify` checks forward migration preservation and the
fresh-schema permission suite; `node scripts/report-download-check.mjs` tests
the real handler with isolated Auth/Storage adapters. The local Storage shim
contains metadata only: it cannot prove uploads, signed URLs, or live integration.
Before release, verify live guardian/teacher/admin sessions, failed uploads,
successful export/publish/download, withdrawal and guardian removal with the
private bucket. No migration has been applied remotely by this change.

Rollback: disable the new report feature and retain its tables/audit data. Do not
restore the old guardian policy or deploy the old export implementation. The
report history UI currently shows the most recent 100 publications per student.
