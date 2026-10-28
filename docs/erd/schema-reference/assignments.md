# assignments

Existing schema.sql:1306. Not a standalone migration.

```sql
create table assignments (
  id uuid primary key,
  class_id uuid not null,
  center_id uuid not null,
  course_assignment_id uuid not null,
  course_id uuid not null,
  course_lesson_id uuid,
  title text not null check (length(btrim(title)) between 1 and 200),
  brief text not null check (length(brief) <= 20000),
  due_at timestamptz,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  lesson_title_snapshot text,
  lesson_objective_snapshot text,
  revision integer not null default 1 check (revision > 0),
  created_by uuid not null references users(id),
  updated_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  foreign key (course_assignment_id,class_id,course_id,center_id)
    references class_course_assignments(id,class_id,course_id,center_id),
  foreign key (class_id,center_id) references classes(id,center_id),
  foreign key (course_lesson_id,course_id) references course_lessons(id,course_id),
  unique (id,class_id),
  check ((status='draft' and published_at is null) or status in ('published','archived'))
);

```
