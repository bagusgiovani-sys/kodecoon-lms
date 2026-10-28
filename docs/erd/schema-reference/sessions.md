# sessions

Existing schema.sql:72. Not a standalone migration.

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id),
  teacher_id uuid not null references users(id),
  session_date date not null,
  session_time time,            -- nullable; used by My Schedule
  status text not null default 'scheduled', -- 'scheduled' | 'completed'
  notes text,                   -- Gio's rough session notes; feeds the AI report draft
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.sessions add column credit_billable boolean not null default false;
alter table public.sessions alter column credit_billable set default true;
alter table public.sessions add column revision integer not null default 0 check (revision >= 0);
alter table sessions add column weekly_slot_id uuid references weekly_class_slots(id);
```
