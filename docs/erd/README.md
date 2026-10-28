# KodeHub ERD and data ownership

Version 1.0 - 28 October 2026. Colleague-facing logical data model.

## Share this first

[KodeHub ERD and Data Ownership PDF](KodeHub-ERD-and-Data-Ownership.pdf)

The 13-page PDF presents one logical model using field rows, PK/FK columns, types,
orthogonal connectors and crow's-foot relationship symbols. It contains 41 logical
entities covering the confirmed individual-learning and academy-wide workflows.
Shared/operational ownership is color-coded. Logical names map to the colleague's
consolidated physical database during integration. This document makes no deployment
claim and contains no live student records or credentials.

## Reading order

- Page 1: purpose, shared-data boundaries and ERD reading guide.
- Pages 2-11: scheduling, learning, reports, assessments, checklists, media, credits and access.
- Pages 12-13: data ownership and integration contract.

## Technical companion

- `table-model.json`: authoritative source for this export's entities and relationships.
- `relationship-register.csv`: all 69 foreign keys, including cross-sheet references.
- `data-design/`: field dictionaries for all 41 logical entities, including FK targets.
- `data-design-manifest.json`: model version and exported counts.
- `table-erd-verification.json`: document checks, not application/security test results.

The earlier review-* sources and schema-reference folder remain internal audit evidence.
They are not the source of this shareable model. The old PDF filename also opens the
updated export so the previously shared link does not open the superseded layout.
Cross-sheet FK relationships are fully listed in the CSV even when not drawn on a sheet.

## Checklist evidence

Source supplied by Gio: `00 - Kodecoon_Lesson_Checklist v4 - 21 Oct 2026 (1).pdf`.
Read and visually inspected all three pages. Pages 1-2 contain 38 checkboxes over eight
stages; page 3 is explanatory teaching guidance. Per-class versus per-student scope and
N/A rules are design choices for KodeHub, not classifications already stated in the PDF.
The original refers to OClass and Telegram. Preserve its source version; review wording
for KodeHub after shared-data ownership is agreed rather than silently rewriting policy.

## Limits and next step

The colleague's migrated database has not been supplied or inspected. Obtain her schema,
canonical identifiers, imported field list and update process, then map the logical
shared entities to the authoritative physical records before integration.
No application code, database, security settings, commits or pushes were changed for this export.

## Regenerate and verify

Use Python with ReportLab and PyMuPDF. The scripts first check the temporary library directory
used in this session and then the regular Python environment. Python packages are not added
to the application's package.json. No application scripts are executed.

```text
python docs/erd/render_tables.py
python docs/erd/verify_tables.py
```

The verifier renders all 13 pages and checks page boundaries, all 41 entity names,
all FK targets, all 69 relationship-register entries and removal of the superseded
current/proposed comparison. Visual inspection checks table rows and connector layout.
