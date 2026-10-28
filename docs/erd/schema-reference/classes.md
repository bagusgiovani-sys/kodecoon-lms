# classes

Existing schema.sql:43. Not a standalone migration.

```sql
create table classes (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references centers(id),
  teacher_id uuid not null references users(id),
  name text not null,           -- e.g. 'Scratch Junior', 'RCB', 'RGD Lv 2'
  age_bracket text,             -- e.g. '5-8', '8-12', '13-19'
  -- total lesson count is derived from COUNT(lessons) where class_id = this class,
  -- not stored here — avoids two sources of truth for curriculum size
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table classes add constraint classes_id_center_unique unique (id, center_id);
```
