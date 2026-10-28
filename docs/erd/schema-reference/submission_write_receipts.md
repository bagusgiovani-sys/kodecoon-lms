# submission_write_receipts

Existing schema.sql:1553. Not a standalone migration.

```sql
create table submission_write_receipts (
  actor_id uuid not null references users(id),
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  primary key (actor_id,request_id)
);

```
