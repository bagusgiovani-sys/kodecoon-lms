# KodeNexus ERD and data ownership

Version 1.2 - 29 October 2026. Colleague-facing logical integration contract.

## Share this first

[KodeNexus ERD and Data Ownership PDF](KodeNexus-ERD-and-Data-Ownership.pdf)

The 15-page PDF presents one logical model using field rows, PK/FK columns, types,
orthogonal connectors and crow's-foot relationship symbols. It contains 40 logical
entities covering the confirmed individual-learning and academy-wide workflows.
Shared/operational ownership is color-coded. Logical names map to the colleague's
consolidated physical database during integration. This document makes no deployment
claim and contains no live student records or credentials.

## Reading order

- Page 1: purpose, shared-data boundaries and ERD reading guide.
- Pages 2-11: scheduling, learning, 12-attendance feedback, PDF/PPT lesson resources,
  completion certificates, checklists, media, credits and access.
- Page 12: fields described in Student Progress Tracker and OClass, mapped to logical records.
- Pages 13-14: data ownership and integration contract.
- Page 15: application and data-source flow for Nexus, Finance and Analytics.

## Technical companion

- `table-model.json`: authoritative source for this export's entities and relationships.
- `relationship-register.csv`: all 66 foreign keys, including cross-sheet references.
- `data-design/`: field dictionaries for all 40 logical entities, including FK targets.
- `data-design-manifest.json`: model version and exported counts.
- `table-erd-verification.json`: document checks, not application/security test results.
- `implementation-alignment.md`: internal comparison with repository SQL and demo;
  separate from the shareable logical contract.

The earlier review-* sources and schema-reference folder remain internal audit evidence.
They are not the source of this shareable model. The old PDF filename also opens the
updated export so the previously shared link does not open the superseded layout.
Cross-sheet FK relationships are fully listed in the CSV even when not drawn on a sheet.

## Checklist evidence

Source supplied by Gio: `00 - Kodecoon_Lesson_Checklist v4 - 21 Oct 2026 (1).pdf`.
The previous review read all three pages; this update did not reread the checklist.
Pages 1-2 contain 38 checkboxes over eight
stages; page 3 is explanatory teaching guidance. Per-class versus per-student scope and
N/A rules are design choices for KodeHub, not classifications already stated in the PDF.
The original refers to OClass and Telegram. Preserve its source version; review wording
for KodeHub after shared-data ownership is agreed rather than silently rewriting policy.

## Limits and next step

The colleague's migrated database has not been supplied or inspected. Obtain her schema,
canonical identifiers, imported field list and update process, then map the logical
shared entities to the authoritative physical records before integration.
No live database was inspected or migrated for this export. Separate application
fixes and security containment are recorded in build-progress.md.

## Regenerate and verify

Use Python with ReportLab and PyMuPDF. The scripts first check the temporary library directory
used in this session and then the regular Python environment. Python packages are not added
to the application's package.json. No application scripts are executed.

```text
python docs/erd/render_tables.py
python docs/erd/verify_tables.py
```

The verifier renders all 15 pages and checks page boundaries, all 40 entity names,
all FK targets, all 66 relationship-register entries and removal of the superseded
current/proposed comparison. It also checks the Tracker/OClass source mapping and
legacy report fields. Visual inspection checks table rows and connector layout.

## Version 1.1 changes

- KodeNexus branding; Finance writes money/receipts, Analytics reads approved views.
- Assignment/submission entities removed from the product contract.
- Feedback cycles count every 12 Present sessions, independent of module completion.
- Published report PDFs, separate completion certificates and versioned lesson materials.
- Provider/key file metadata and explicit application/data-source flow.

## Version 1.2 changes

- Added a field-level legacy source map for the Student Progress Tracker and OClass:
  student roster, class codes/rosters/time slots, remaining credit units, previous
  end-module feedback and OClass money/receipt records.
- Clarified that the two legacy sources are for reconciliation/import lineage only;
  after cutover the colleague's consolidated database is the single canonical input.
  Unresolved differences must be reviewed, not silently overwritten or synced both ways.
- Historical Tracker feedback is kept separate from new feedback cycles. The logical
  report model permits a report without a 12-attendance cycle and records its source
  and date; historical reports do not count toward future 12-Present-session cycles.
- OClass payment amounts and receipts stay outside KodeNexus in the separate Finance domain.

The source names and fields on page 12 reflect Gio's descriptions of those tools.
Neither workbook export nor the colleague's migrated schema was available to verify
the exact headers, identifiers or conflict decisions. Confirm those with her before
data integration; this page is a mapping proposal, not a claim that an import has run.

The logical `lesson_materials` records are a target contract, not a deployed lesson
attachment feature. They follow the production session-video Drive file-ID pattern:
private Drive file ID, MIME type, version, and optional PDF preview. The production
video Picker does not yet select lesson PDFs or PPT/PPTX, and the lesson editor has no
attachment UI. Google Drive can preview PDFs and PowerPoint files; use an optional
PDF preview where stable reading matters, since animations may not carry over.
Embedded visibility does not imply that all KodeNexus parents can open a private
Drive file; confirm the child's permission through the exact published-file flow.

The root `schema.sql` and `supabase/migrations/` remain the physical SQL evidence.
Older review files and `KodeHub-ERD-Preview.png` are historical audit artifacts.
