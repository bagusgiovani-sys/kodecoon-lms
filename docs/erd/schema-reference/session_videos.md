# session_videos

Existing schema.sql:93. Not a standalone migration.

```sql
create table session_videos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  drive_file_id text not null,
  drive_link text not null,     -- shareable preview link — never raw video bytes in the DB
  created_at timestamptz default now(),
  unique (session_id, drive_file_id)
);

```
