# student_guardians

Existing schema.sql:152. Not a standalone migration.

```sql
create table student_guardians (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  guardian_id uuid not null references users(id) on delete cascade, -- users.role = 'parent'
  created_at timestamptz default now(),
  unique (student_id, guardian_id)
);

```
