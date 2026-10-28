# students

Existing schema.sql:55. Not a standalone migration.

```sql
create table students (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references centers(id),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table students add constraint students_id_center_unique unique (id,center_id);
```
