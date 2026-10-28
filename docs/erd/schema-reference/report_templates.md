# report_templates

Existing schema.sql:131. Not a standalone migration.

```sql
create table report_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  design_reference text,        -- reference to the Claude Design template asset
  is_default boolean not null default true,
  created_at timestamptz default now()
);

```
