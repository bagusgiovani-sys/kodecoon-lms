# credit_accounts

Existing schema.sql:764. Not a standalone migration.

```sql
create table public.credit_accounts (
  student_id uuid primary key references public.students(id),
  balance integer not null default 0 check (balance >= 0),
  revision integer not null default 0 check (revision >= 0)
);

```
