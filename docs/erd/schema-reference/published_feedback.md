# published_feedback

Existing schema.sql:1797. Not a standalone migration.

```sql
create table published_feedback (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null,
  student_id uuid not null,
  class_id uuid not null,
  center_id uuid not null,
  draft_revision integer not null check(draft_revision>0),
  title text not null check(length(btrim(title)) between 1 and 200),
  strengths text not null check(length(btrim(strengths,E' \t\r\n')) between 1 and 10000),
  next_steps text not null check(length(btrim(next_steps,E' \t\r\n')) between 1 and 10000),
  rating text not null check(rating in ('Getting started','Growing','Confident','Independent')),
  published_by uuid not null references users(id),
  published_at timestamptz not null default now(),
  withdrawn_by uuid references users(id),
  withdrawn_at timestamptz,
  foreign key(feedback_id,student_id,class_id,center_id) references student_feedback(id,student_id,class_id,center_id),
  unique(feedback_id,draft_revision),
  check((withdrawn_at is null)=(withdrawn_by is null))
);

```
