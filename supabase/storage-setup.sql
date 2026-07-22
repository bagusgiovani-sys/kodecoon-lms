-- ============================================================
-- KOMS — Storage setup (run once, after schema.sql)
-- Private bucket for generated report PDFs. NEVER public — these
-- are minors' progress reports; access is via signed URLs only.
-- Uploads happen server-side through the service-role client from
-- the staff-only export route, so no INSERT policy is needed for
-- anon/authenticated roles.
-- ============================================================

insert into storage.buckets (id, name, public)
select 'reports', 'reports', false
where not exists (select 1 from storage.buckets where id = 'reports');
