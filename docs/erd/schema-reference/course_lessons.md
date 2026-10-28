# course_lessons

Existing schema.sql:1012. Not a standalone migration.

```sql
create table course_lessons (
  id uuid primary key,
  course_id uuid not null references courses(id),
  sequence integer not null check (sequence between 1 and 10000),
  title text not null check (length(btrim(title)) between 1 and 200),
  minutes integer not null check (minutes between 1 and 1440),
  objective text not null check (length(objective) <= 10000),
  materials text not null check (length(materials) <= 10000),
  steps text not null check (length(steps) <= 20000),
  evidence text not null check (length(evidence) <= 10000),
  revision integer not null default 1 check (revision > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, sequence)
);
alter table course_lessons add constraint course_lessons_id_course_unique unique (id,course_id);
```
