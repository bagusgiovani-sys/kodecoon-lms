# attendance

Existing schema.sql:84. Not a standalone migration.

```sql
create table attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status text not null default 'unmarked', -- 'present' | 'absent' | 'unmarked'
  created_at timestamptz default now(),
  unique (session_id, student_id)
);

```
