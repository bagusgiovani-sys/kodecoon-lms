# enrollments

Existing schema.sql:63. Not a standalone migration.

```sql
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  enrolled_date date not null default current_date,
  created_at timestamptz default now(),
  unique (student_id, class_id)
);

```
