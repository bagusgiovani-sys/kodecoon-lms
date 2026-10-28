# submission_threads

Existing schema.sql:1516. Not a standalone migration.

```sql
create table submission_threads (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null,
  student_id uuid not null,
  next_version integer not null default 1 check (next_version > 0),
  unique (assignment_id,student_id),
  foreign key (assignment_id,student_id) references assignment_learners(assignment_id,student_id)
);

```
