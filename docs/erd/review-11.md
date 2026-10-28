## Existing table inventory 1 / 3

CURRENT / All 38 application tables accounted for across three pages

| Table | Purpose | schema.sql line |
|---|---|---|
| centers | Academy center | 13 |
| users | Staff/parent account; Auth-linked | 27 |
| classes | Class / teacher / center | 43 |
| students | Learner identity | 55 |
| enrollments | Student-class membership | 63 |
| sessions | Dated class occurrence | 72 |
| attendance | Student attendance per session | 84 |
| session_videos | Session Drive link | 93 |
| lessons | Class Journey lesson | 105 |
| student_lesson_progress | Student-class-lesson completion | 118 |
| report_templates | Report template metadata | 131 |
| reports | Private exported report | 139 |
| student_guardians | Parent-child access link | 152 |

Exact field declarations and later ALTER statements are available in the accompanying schema-index.md and schema-reference folder. Diagrams omit some actor, audit and composite links for readability. Supabase auth/storage system tables are outside the 38 application tables.
