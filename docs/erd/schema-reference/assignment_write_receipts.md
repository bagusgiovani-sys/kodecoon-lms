# assignment_write_receipts

Existing schema.sql:1348. Not a standalone migration.

```sql
create table assignment_write_receipts (
  actor_id uuid not null references users(id), request_id uuid not null,
  payload jsonb not null, result jsonb not null, created_at timestamptz not null default now(),
  primary key(actor_id,request_id)
);

```
