# weekly_slot_members

Existing schema.sql:2252. Not a standalone migration.

```sql
create table public.weekly_slot_members (
 id uuid primary key default gen_random_uuid(), slot_id uuid not null references weekly_class_slots(id),
 student_id uuid not null references students(id), starts_on date not null, ends_on date,
 check(ends_on is null or ends_on>=starts_on)
);

```
