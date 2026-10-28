# credit_entries

Existing schema.sql:777. Not a standalone migration.

```sql
create table public.credit_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.credit_accounts(student_id),
  amount integer not null check (amount <> 0),
  kind text not null check (kind in ('top_up','adjustment','attendance_charge','attendance_refund')),
  reason text not null check (length(trim(reason)) between 1 and 500),
  actor_id uuid not null references public.users(id),
  request_id uuid not null,
  session_id uuid references public.sessions(id),
  effective_date date not null,
  recorded_at timestamptz not null default now(),
  unique (actor_id, request_id, student_id),
  foreign key (actor_id, request_id) references public.credit_operations(actor_id, request_id) deferrable initially deferred,
  check ((kind = 'top_up' and amount > 0 and session_id is null)
    or (kind = 'adjustment' and session_id is null)
    or (kind = 'attendance_charge' and amount = -1 and session_id is not null)
    or (kind = 'attendance_refund' and amount = 1 and session_id is not null))
);

```
