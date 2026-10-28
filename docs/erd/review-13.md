## Existing table inventory 3 / 3

CURRENT / All 38 application tables accounted for across three pages

| Table | Purpose | schema.sql line |
|---|---|---|
| assignment_write_receipts | Assignment/roster write receipt | 1348 |
| submission_threads | One assignment/student thread | 1516 |
| submission_versions | Immutable submitted work versions | 1524 |
| submission_reviews | Append-only review/corrections | 1538 |
| submission_write_receipts | Submission/review write receipt | 1553 |
| student_feedback | Private progress-feedback draft | 1776 |
| published_feedback | Immutable shared feedback | 1797 |
| feedback_write_receipts | Feedback write receipt | 1817 |
| course_curriculum_write_receipts | Curriculum mapping write receipt | 1989 |
| weekly_class_slots | Recurring class day/start time | 2246 |
| weekly_slot_members | Dated recurring-slot membership | 2252 |
| student_media | Private student media metadata | 2350 |

Exact field declarations and later ALTER statements are available in the accompanying schema-index.md and schema-reference folder. Diagrams omit some actor, audit and composite links for readability. Supabase auth/storage system tables are outside the 38 application tables.
