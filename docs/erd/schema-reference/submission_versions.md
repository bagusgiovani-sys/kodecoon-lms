# submission_versions

Existing schema.sql:1524. Not a standalone migration.

```sql
create table submission_versions (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references submission_threads(id),
  version integer not null check (version > 0),
  project_url text not null check (public.valid_submission_url(project_url)),
  reflection text not null check (length(btrim(reflection,E' \t\r\n')) between 1 and 10000),
  submitted_by uuid not null references users(id),
  submitted_role text not null check (submitted_role in ('parent','teacher','admin')),
  submitted_at timestamptz not null default clock_timestamp(),
  is_late boolean not null,
  request_id uuid not null,
  unique (thread_id,version),
  unique (submitted_by,request_id)
);

```
