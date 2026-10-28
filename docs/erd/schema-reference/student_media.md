# student_media

Existing schema.sql:2350. Not a standalone migration.

```sql
create table public.student_media (
 id uuid primary key, student_id uuid not null references students(id),
 kind text not null check(kind in ('photo','video')), storage_path text not null unique,
 description text not null default '' check(length(description)<=2000),
 recorded_date date not null, ready boolean not null default false,
 created_by uuid not null references users(id), created_at timestamptz not null default now()
);

```
