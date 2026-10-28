# student_feedback

Existing schema.sql:1776. Not a standalone migration.

```sql
create table student_feedback (
  id uuid primary key,
  student_id uuid not null,
  class_id uuid not null,
  center_id uuid not null,
  lesson_id uuid,
  title text not null check(length(btrim(title)) between 1 and 200),
  strengths text not null check(length(btrim(strengths,E' \t\r\n')) between 1 and 10000),
  next_steps text not null check(length(btrim(next_steps,E' \t\r\n')) between 1 and 10000),
  rating text not null check(rating in ('Getting started','Growing','Confident','Independent')),
  revision integer not null default 1 check(revision>0),
  created_by uuid not null references users(id),
  updated_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(student_id,center_id) references students(id,center_id),
  foreign key(class_id,center_id) references classes(id,center_id),
  foreign key(lesson_id,class_id) references lessons(id,class_id),
  unique(id,student_id,class_id,center_id)
);

```
