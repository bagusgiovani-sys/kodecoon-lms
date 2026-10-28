# published_reports

Existing schema.sql:684. Not a standalone migration.

```sql
create table public.published_reports (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.reports(id),
  student_id uuid not null references public.students(id),
  class_id uuid not null references public.classes(id),
  final_text text not null check (length(trim(final_text)) > 0),
  generated_date date not null,
  pdf_storage_path text not null,
  published_by uuid not null references public.users(id),
  published_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

```
