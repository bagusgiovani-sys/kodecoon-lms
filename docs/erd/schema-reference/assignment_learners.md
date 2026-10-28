# assignment_learners

Existing schema.sql:1334. Not a standalone migration.

```sql
create table assignment_learners (
  assignment_id uuid not null,
  class_id uuid not null,
  center_id uuid not null,
  student_id uuid not null,
  assigned_at timestamptz not null default now(),
  submission_open boolean not null default true,
  primary key (assignment_id,student_id),
  foreign key (assignment_id,class_id) references assignments(id,class_id),
  foreign key (class_id,center_id) references classes(id,center_id),
  foreign key (student_id,center_id) references students(id,center_id)
);
alter table assignment_learners add column revision integer not null default 1 check (revision > 0);
```
