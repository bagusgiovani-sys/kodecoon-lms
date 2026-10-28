# session_credit_state

Existing schema.sql:795. Not a standalone migration.

```sql
create table public.session_credit_state (
  session_id uuid not null references public.sessions(id),
  student_id uuid not null references public.credit_accounts(student_id),
  charged boolean not null,
  primary key (session_id, student_id)
);

```
