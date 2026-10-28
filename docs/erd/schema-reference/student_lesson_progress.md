# student_lesson_progress

Existing schema.sql:118. Not a standalone migration.

```sql
create table student_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  status text not null default 'locked', -- 'locked' | 'unlocked' | 'completed'
  session_id uuid references sessions(id), -- which session completed it, if any
  completed_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (student_id, lesson_id)
);

```
