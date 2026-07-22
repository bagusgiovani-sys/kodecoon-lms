-- ============================================================
-- KOMS — Seed data (Step 12: 1 center, Gio as both teacher and admin)
-- Run AFTER schema.sql, and AFTER creating Gio's auth user:
--   Supabase Dashboard → Authentication → Add user →
--   email: bagusgiovani@gmail.com, set a password, auto-confirm.
-- Then run this file in the SQL editor. It looks the auth user up by
-- email, so no UUID pasting is needed.
-- ============================================================

-- 1 center: Gio's center, Indonesia (multi-tenancy root, PRD P0)
insert into centers (name, country)
select 'Kodecoon Academy Indonesia', 'Indonesia'
where not exists (select 1 from centers where name = 'Kodecoon Academy Indonesia');

-- Gio: role 'admin'. Teacher-side access still works because every
-- teacher policy keys on teacher_id = auth.uid() (his classes carry his
-- id), and the (dashboard) route group accepts teacher OR admin.
do $$
declare
  gio_auth_id uuid;
  gio_center_id uuid;
begin
  select id into gio_auth_id from auth.users where email = 'bagusgiovani@gmail.com';
  if gio_auth_id is null then
    raise exception 'Create the auth user bagusgiovani@gmail.com first (Dashboard -> Authentication -> Add user)';
  end if;

  select id into gio_center_id from centers where name = 'Kodecoon Academy Indonesia';

  insert into users (id, email, name, role, center_id)
  values (gio_auth_id, 'bagusgiovani@gmail.com', 'Gio', 'admin', gio_center_id)
  on conflict (id) do update set role = 'admin', center_id = excluded.center_id;
end $$;

-- One fixed report template (v1: single hardcoded template, PRD Out of Scope
-- excludes the self-service editor)
insert into report_templates (name, design_reference, is_default)
select 'KOMS Standard Report', 'claude-design/report-v1', true
where not exists (select 1 from report_templates where is_default = true);

-- ============================================================
-- OPTIONAL DEMO DATA — uncomment to seed one RCB class with a
-- 24-lesson plan under Gio, for testing the Journey view.
-- ============================================================
-- do $$
-- declare
--   gio_id uuid;
--   ctr_id uuid;
--   cls_id uuid;
-- begin
--   select id into gio_id from users where email = 'bagusgiovani@gmail.com';
--   select id into ctr_id from centers where name = 'Kodecoon Academy Indonesia';
--
--   insert into classes (center_id, teacher_id, name, age_bracket)
--   values (ctr_id, gio_id, 'RCB', '8-12')
--   returning id into cls_id;
--
--   insert into lessons (class_id, sequence_number, title)
--   select cls_id, n, 'RCB Lesson ' || n
--   from generate_series(1, 24) as n;
-- end $$;
