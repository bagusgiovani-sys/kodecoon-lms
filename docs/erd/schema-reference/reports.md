# reports

Existing schema.sql:139. Not a standalone migration.

```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  class_id uuid references classes(id),
  template_id uuid references report_templates(id),
  raw_notes text,                -- Gio's rough notes — input to the AI draft
  ai_draft_text text,            -- Claude API output, editable before export
  final_text text,               -- text actually exported to PDF
  final_pdf_url text,
  generated_date date not null default current_date,
  created_at timestamptz default now()
);
alter table public.reports add column pdf_storage_path text;
```
