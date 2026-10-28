# class_course_assignments

Existing schema.sql:1183. Not a standalone migration.

```sql
create table class_course_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  center_id uuid not null,
  course_id uuid not null,
  assigned_by uuid not null references users(id),
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  foreign key (class_id, center_id) references classes(id, center_id),
  foreign key (course_id, center_id) references courses(id, center_id),
  unique (id, class_id)
);
alter table class_course_assignments add constraint class_course_assignment_composite_unique
  unique (id,class_id,course_id,center_id);
```
