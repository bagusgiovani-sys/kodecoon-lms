# credit_operations

Existing schema.sql:769. Not a standalone migration.

```sql
create table public.credit_operations (
  actor_id uuid not null references public.users(id),
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, request_id)
);

```
