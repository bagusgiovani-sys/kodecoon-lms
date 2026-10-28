# centers

Existing schema.sql:13. Not a standalone migration.

```sql
create table centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'Indonesia', -- 'Indonesia' | 'Singapore' | others as Kodecoon expands
  created_at timestamptz default now()
);

```
