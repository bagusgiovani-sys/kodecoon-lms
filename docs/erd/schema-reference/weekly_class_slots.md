# weekly_class_slots

Existing schema.sql:2246. Not a standalone migration.

```sql
create table public.weekly_class_slots (
 id uuid primary key, class_id uuid not null references classes(id),
 weekday integer not null check(weekday between 0 and 6), start_time time not null,
 starts_on date not null, created_by uuid not null references users(id),
 unique(class_id,weekday,start_time,starts_on)
);

```
