# courses

Existing schema.sql:993. Not a standalone migration.

```sql
create table courses (
  id uuid primary key,
  center_id uuid not null references centers(id),
  owner_id uuid not null,
  title text not null check (length(btrim(title)) between 1 and 200),
  category text not null check (length(category) <= 100),
  age_range text not null check (length(age_range) <= 100),
  level text not null check (length(level) <= 100),
  description text not null check (length(description) <= 10000),
  prerequisites text not null check (length(prerequisites) <= 10000),
  lesson_count integer not null default 0 check (lesson_count between 0 and 10000),
  revision integer not null default 1 check (revision > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (owner_id, center_id) references users(id, center_id)
);
alter table courses add constraint courses_id_center_unique unique (id, center_id);
```
