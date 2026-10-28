# submission_reviews

Existing schema.sql:1538. Not a standalone migration.

```sql
create table submission_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submission_versions(id),
  sequence integer not null check (sequence > 0),
  outcome text not null check (outcome in ('revision','approved')),
  feedback text not null check (length(btrim(feedback,E' \t\r\n')) between 1 and 10000),
  reviewed_by uuid not null references users(id),
  reviewed_at timestamptz not null default clock_timestamp(),
  supersedes_id uuid,
  request_id uuid not null,
  unique (submission_id,sequence),
  unique (id,submission_id),
  foreign key (supersedes_id,submission_id) references submission_reviews(id,submission_id),
  unique (reviewed_by,request_id)
);

```
