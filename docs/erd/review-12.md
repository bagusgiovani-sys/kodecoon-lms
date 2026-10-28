## Existing table inventory 2 / 3

CURRENT / All 38 application tables accounted for across three pages

| Table | Purpose | schema.sql line |
|---|---|---|
| published_reports | Family-visible report snapshot | 684 |
| credit_accounts | Unit balance cache | 764 |
| credit_operations | Credit request receipt | 769 |
| credit_entries | Append-only unit changes | 777 |
| session_credit_state | Per-session charge state | 795 |
| courses | Reusable module definition | 993 |
| course_lessons | Reusable lesson content | 1012 |
| course_write_receipts | Course/lesson write receipt | 1029 |
| course_target_write_receipts | Lesson-target write receipt | 1037 |
| class_course_assignments | Class-course link history | 1183 |
| class_course_write_receipts | Class-course write receipt | 1199 |
| assignments | Assignment brief/publication | 1306 |
| assignment_learners | Captured recipients and permission | 1334 |

Exact field declarations and later ALTER statements are available in the accompanying schema-index.md and schema-reference folder. Diagrams omit some actor, audit and composite links for readability. Supabase auth/storage system tables are outside the 38 application tables.
