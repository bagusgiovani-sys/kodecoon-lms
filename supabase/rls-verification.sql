-- ============================================================
-- KOMS — RLS verification harness (Steps 8 and 13)
--
-- CLAUDE.md §6: "RLS is the real security boundary." This file is how that
-- claim gets checked instead of asserted. It builds its own fixtures, puts on
-- each role in turn, and records what that role can actually read and write.
--
-- HOW TO RUN
--   1. Run schema.sql first. (seed.sql is not required — this file seeds its
--      own data and never touches Gio's.)
--   2. Paste this whole file into the Supabase SQL editor and run it.
--   3. Read the result table. Failures sort to the top.
--
-- SAFETY
--   Everything happens inside one transaction that ends in ROLLBACK. Nothing
--   here survives the run — not the fixture users, not the auth.users rows,
--   not the results table. Run it against production as often as you like.
--   The one rule: do not run the statements piecemeal. The final ROLLBACK is
--   what makes this safe, so the file only makes sense executed whole.
--
-- WHAT COUNTS AS A PASS
--   Reads:  the role sees exactly the rows it should, no more.
--   Writes: the write does not land. Under RLS a denied UPDATE or DELETE
--           silently affects zero rows while a denied INSERT (or a WITH CHECK
--           violation, or a trigger) raises 42501 — both are the boundary
--           holding, so rls_expect_blocked() treats either as a pass.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Result recording
-- ------------------------------------------------------------
-- A real table rather than a temp one: pg_temp resolution inside functions is
-- fiddly, and this is rolled back either way.
create table rls_results (
  seq   serial primary key,
  name  text not null,
  ok    boolean not null,
  detail text
);
grant all on rls_results to public;
grant all on sequence rls_results_seq_seq to public;

-- Neither helper is SECURITY DEFINER — they must run with the caller's
-- privileges, or they would test nothing.
create function rls_check(t text, cond boolean, detail text default null)
returns void language plpgsql as $$
begin
  insert into rls_results(name, ok, detail) values (t, coalesce(cond, false), detail);
end;
$$;

create function rls_expect_blocked(t text, stmt text)
returns void language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  insert into rls_results(name, ok, detail)
    values (t, n = 0, case when n = 0 then 'no rows affected' else n || ' rows written — BOUNDARY BREACHED' end);
exception when others then
  insert into rls_results(name, ok, detail) values (t, true, 'raised ' || sqlstate);
end;
$$;

create function rls_expect_allowed(t text, stmt text)
returns void language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  insert into rls_results(name, ok, detail)
    values (t, n > 0, n || ' rows affected');
exception when others then
  insert into rls_results(name, ok, detail) values (t, false, 'unexpectedly raised ' || sqlstate || ': ' || sqlerrm);
end;
$$;

-- ------------------------------------------------------------
-- Fixtures
-- ------------------------------------------------------------
-- Fixed UUIDs so every assertion below can name a row without variables.
--   centers   c1 = ...c01, c2 = ...c02
--   users     admin_a ...a01 | teacher_a ...a02 | teacher_b ...a03
--             teacher_c ...a04 (other center) | parent_a ...a05 | parent_b ...a06
--   students  s1 ...501 (c1) | s2 ...502 (c1) | s3 ...503 (c2)
--   classes   cls_a ...c11 (teacher_a) | cls_b ...c12 (teacher_b) | cls_c ...c13 (c2)
--
-- The shape that matters: two teachers in the SAME center, each with their own
-- class and their own family. Most cross-tenant bugs hide between two peers
-- inside one center, not between two centers.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  u.email, '', now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
from (values
  ('00000000-0000-4000-8000-000000000a01'::uuid, 'rlstest-admin-a@example.invalid'),
  ('00000000-0000-4000-8000-000000000a02'::uuid, 'rlstest-teacher-a@example.invalid'),
  ('00000000-0000-4000-8000-000000000a03'::uuid, 'rlstest-teacher-b@example.invalid'),
  ('00000000-0000-4000-8000-000000000a04'::uuid, 'rlstest-teacher-c@example.invalid'),
  ('00000000-0000-4000-8000-000000000a05'::uuid, 'rlstest-parent-a@example.invalid'),
  ('00000000-0000-4000-8000-000000000a06'::uuid, 'rlstest-parent-b@example.invalid'),
  -- a07 deliberately gets no public.users row. It exists so the "parent cannot
  -- insert an admin row for themselves" check is blocked by RLS rather than by
  -- the users -> auth.users foreign key, which would pass for the wrong reason.
  ('00000000-0000-4000-8000-000000000a07'::uuid, 'rlstest-orphan@example.invalid')
) as u(id, email);

insert into centers (id, name, country) values
  ('00000000-0000-4000-8000-000000000c01', 'RLS Test Center A', 'Indonesia'),
  ('00000000-0000-4000-8000-000000000c02', 'RLS Test Center B', 'Singapore');

insert into users (id, email, name, role, center_id) values
  ('00000000-0000-4000-8000-000000000a01', 'rlstest-admin-a@example.invalid',   'Admin A',   'admin',   '00000000-0000-4000-8000-000000000c01'),
  ('00000000-0000-4000-8000-000000000a02', 'rlstest-teacher-a@example.invalid', 'Teacher A', 'teacher', '00000000-0000-4000-8000-000000000c01'),
  ('00000000-0000-4000-8000-000000000a03', 'rlstest-teacher-b@example.invalid', 'Teacher B', 'teacher', '00000000-0000-4000-8000-000000000c01'),
  ('00000000-0000-4000-8000-000000000a04', 'rlstest-teacher-c@example.invalid', 'Teacher C', 'teacher', '00000000-0000-4000-8000-000000000c02'),
  ('00000000-0000-4000-8000-000000000a05', 'rlstest-parent-a@example.invalid',  'Parent A',  'parent',  null),
  ('00000000-0000-4000-8000-000000000a06', 'rlstest-parent-b@example.invalid',  'Parent B',  'parent',  null);

insert into students (id, center_id, name) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000c01', 'Student One'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000c01', 'Student Two'),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000c02', 'Student Three');

insert into classes (id, center_id, teacher_id, name, age_bracket) values
  ('00000000-0000-4000-8000-000000000c11', '00000000-0000-4000-8000-000000000c01', '00000000-0000-4000-8000-000000000a02', 'Class A', '8-12'),
  ('00000000-0000-4000-8000-000000000c12', '00000000-0000-4000-8000-000000000c01', '00000000-0000-4000-8000-000000000a03', 'Class B', '8-12'),
  ('00000000-0000-4000-8000-000000000c13', '00000000-0000-4000-8000-000000000c02', '00000000-0000-4000-8000-000000000a04', 'Class C', '5-8');

insert into enrollments (student_id, class_id) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000c11'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000c12'),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000c13');

insert into student_guardians (student_id, guardian_id) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000a05'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000a06');

insert into lessons (id, class_id, sequence_number, title) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000c11', 1, 'A-1'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000c11', 2, 'A-2'),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000c12', 1, 'B-1');

insert into sessions (id, class_id, teacher_id, session_date, status) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000c11', '00000000-0000-4000-8000-000000000a02', current_date, 'completed'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000c12', '00000000-0000-4000-8000-000000000a03', current_date, 'completed');

insert into attendance (session_id, student_id, status) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000501', 'present'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000502', 'present');

insert into session_videos (session_id, drive_file_id, drive_link) values
  ('00000000-0000-4000-8000-000000000201', 'drive-a', 'https://drive.example/a');

insert into student_lesson_progress (student_id, lesson_id, status, session_id, completed_date) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000101', 'completed',
   '00000000-0000-4000-8000-000000000201', current_date);

insert into report_templates (id, name, design_reference, is_default) values
  ('00000000-0000-4000-8000-000000000301', 'RLS Test Template', 'test', false);

insert into reports (student_id, class_id, template_id, final_text) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000c11', '00000000-0000-4000-8000-000000000301', 'report for s1'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000c12', '00000000-0000-4000-8000-000000000301', 'report for s2');

-- Opening funding goes through the same audited admin RPC used by the API.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a01","role":"authenticated"}', true);
set local role authenticated;
select public.adjust_credits('00000000-0000-4000-8000-000000000501', 5, 'top_up', 'Verified opening balance', '00000000-0000-4000-8000-000000000900');
reset role;

-- Force a failure after the RPC has updated the session and attendance rows.
-- This proves that a later lesson-progress error rolls the earlier writes back.
create function rls_abort_second_lesson_progress()
returns trigger language plpgsql as $$
begin
  if new.lesson_id = '00000000-0000-4000-8000-000000000102'::uuid then
    raise exception 'intentional transaction rollback check' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger rls_abort_second_lesson_progress
before insert or update on student_lesson_progress
for each row execute function rls_abort_second_lesson_progress();

-- ============================================================
-- TEACHER A  — the ordinary staff case
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000a02","role":"authenticated"}', true);
set local role authenticated;

-- Recursion regression. Before the security definer helpers landed, a policy on
-- users read from users and Postgres aborted with 42P17 on every statement that
-- touched the table — including proxy.ts's role lookup on every request. If
-- this row fails or errors, the app cannot boot at all; read no further.
select rls_check('users: own role lookup resolves (no 42P17 recursion)',
  (select role from users where id = auth.uid()) = 'teacher');

select rls_check('users: teacher sees only their own row',
  (select count(*) from users) = 1);
select rls_check('classes: teacher sees only their own class',
  (select count(*) from classes) = 1);
select rls_check('students: teacher sees both students in their center, not the other center''s',
  (select count(*) from students) = 2);
select rls_check('sessions: teacher sees only their own session',
  (select count(*) from sessions) = 1);
select rls_check('attendance: teacher sees only their own session''s rows',
  (select count(*) from attendance) = 1);
select rls_check('lessons: teacher sees only their own class''s lessons',
  (select count(*) from lessons) = 2);
select rls_check('progress: teacher sees only their own class''s progress',
  (select count(*) from student_lesson_progress) = 1);
select rls_check('reports: teacher sees only reports for students they teach',
  (select count(*) from reports) = 1);
select rls_check('session_videos: teacher sees only their own session''s video',
  (select count(*) from session_videos) = 1);
select rls_check('report_templates: staff can read the template',
  (select count(*) from report_templates) = 1);

-- The transaction RPC is idempotent when the client retries the same log.
select rls_expect_allowed('sessions: atomic logger accepts a valid session write',
  $$select public.log_session_credits(
    '00000000-0000-4000-8000-000000000201', 'atomic baseline',
    '[{"studentId":"00000000-0000-4000-8000-000000000501","status":"present"}]'::jsonb,
    '[{"studentId":"00000000-0000-4000-8000-000000000501","lessonId":"00000000-0000-4000-8000-000000000101"}]'::jsonb, '00000000-0000-4000-8000-000000000901', 0)$$);
select rls_expect_allowed('sessions: retry accepts the same write',
  $$select public.log_session_credits(
    '00000000-0000-4000-8000-000000000201', 'atomic baseline',
    '[{"studentId":"00000000-0000-4000-8000-000000000501","status":"present"}]'::jsonb,
    '[{"studentId":"00000000-0000-4000-8000-000000000501","lessonId":"00000000-0000-4000-8000-000000000101"}]'::jsonb, '00000000-0000-4000-8000-000000000901', 0)$$);
select rls_check('sessions: retry keeps one attendance and progress row',
  (select count(*) from attendance where session_id = '00000000-0000-4000-8000-000000000201' and student_id = '00000000-0000-4000-8000-000000000501') = 1
  and (select count(*) from student_lesson_progress where student_id = '00000000-0000-4000-8000-000000000501' and lesson_id = '00000000-0000-4000-8000-000000000101') = 1);

-- The trigger fails after the RPC has changed notes and attendance; both must
-- return to their previous values when the PostgREST transaction aborts.
select rls_expect_blocked('sessions: progress failure aborts the whole log',
  $$select public.log_session_credits(
    '00000000-0000-4000-8000-000000000201', 'must roll back',
    '[{"studentId":"00000000-0000-4000-8000-000000000501","status":"absent"}]'::jsonb,
    '[{"studentId":"00000000-0000-4000-8000-000000000501","lessonId":"00000000-0000-4000-8000-000000000102"}]'::jsonb, gen_random_uuid(), 1)$$);
select rls_check('sessions: failed log preserves original notes and attendance',
  (select notes from sessions where id = '00000000-0000-4000-8000-000000000201') = 'atomic baseline'
  and (select status from attendance where session_id = '00000000-0000-4000-8000-000000000201' and student_id = '00000000-0000-4000-8000-000000000501') = 'present'
  and not exists (select 1 from student_lesson_progress where student_id = '00000000-0000-4000-8000-000000000501' and lesson_id = '00000000-0000-4000-8000-000000000102'));

select rls_expect_blocked('sessions: atomic logger rejects an out-of-class student',
  $$select public.log_session_credits(
    '00000000-0000-4000-8000-000000000201', 'unauthorized',
    '[{"studentId":"00000000-0000-4000-8000-000000000502","status":"present"}]'::jsonb,
    '[]'::jsonb, gen_random_uuid(), 1)$$);

-- Regression, Session 5: Log Session trusted a client-sent studentId. Owning
-- the session must not authorize writing rows about a student in another class.
select rls_expect_blocked('attendance: teacher cannot mark a student from another class present',
  $$insert into attendance (session_id, student_id, status)
    values ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000502','present')$$);
select rls_expect_blocked('progress: teacher cannot complete a lesson for a student not in that class',
  $$insert into student_lesson_progress (student_id, lesson_id, status)
    values ('00000000-0000-4000-8000-000000000502','00000000-0000-4000-8000-000000000101','completed')$$);

-- Regression, Session 5: users_update_own had no WITH CHECK.
select rls_expect_blocked('users: teacher cannot promote themselves to admin',
  $$update users set role = 'admin' where id = auth.uid()$$);
select rls_expect_allowed('users: teacher can still edit their own name',
  $$update users set name = 'Teacher A Renamed' where id = auth.uid()$$);

-- Regression, Session 5: classes_all_teacher inherited an unconstrained WITH CHECK.
select rls_expect_blocked('classes: teacher cannot move their class into another center',
  $$update classes set center_id = '00000000-0000-4000-8000-000000000c02'
    where id = '00000000-0000-4000-8000-000000000c11'$$);
select rls_expect_blocked('classes: teacher cannot reassign their class to another teacher',
  $$update classes set teacher_id = '00000000-0000-4000-8000-000000000a03'
    where id = '00000000-0000-4000-8000-000000000c11'$$);
select rls_expect_blocked('sessions: teacher cannot touch a peer''s session',
  $$update sessions set notes = 'tampered' where id = '00000000-0000-4000-8000-000000000202'$$);
select rls_expect_blocked('reports: teacher cannot read or rewrite a peer''s student report',
  $$update reports set final_text = 'tampered' where student_id = '00000000-0000-4000-8000-000000000502'$$);

-- ============================================================
-- TEACHER C — same role, different center
-- ============================================================
reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000a04","role":"authenticated"}', true);
set local role authenticated;

select rls_check('students: teacher in center B sees only center B''s student',
  (select count(*) from students) = 1);
select rls_check('classes: teacher in center B sees only their own class',
  (select count(*) from classes) = 1);
select rls_expect_blocked('students: teacher cannot rename a student in another center',
  $$update students set name = 'tampered' where id = '00000000-0000-4000-8000-000000000501'$$);

-- ============================================================
-- PARENT A — the boundary that matters most: another family's child
-- ============================================================
reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000a05","role":"authenticated"}', true);
set local role authenticated;

select rls_check('users: parent sees only their own row',
  (select count(*) from users) = 1);
select rls_check('students: parent sees only their own child',
  (select count(*) from students where id = '00000000-0000-4000-8000-000000000501')
    = (select count(*) from students));
select rls_check('students: parent sees exactly one student',
  (select count(*) from students) = 1);
select rls_check('classes: parent sees only their child''s class',
  (select count(*) from classes) = 1);
select rls_check('sessions: parent sees only their child''s class sessions',
  (select count(*) from sessions) = 1);
select rls_check('attendance: parent sees only their own child''s attendance',
  (select count(*) from attendance) = 1);
select rls_check('lessons: parent sees their child''s lesson plan',
  (select count(*) from lessons) = 2);
select rls_check('progress: parent sees only their own child''s progress',
  (select count(*) from student_lesson_progress) = 1);
select rls_check('reports: parent cannot read private report rows',
  (select count(*) from reports) = 0);
select rls_check('session_videos: parent sees only videos from sessions their child attended',
  (select count(*) from session_videos) = 1);
select rls_check('student_guardians: parent sees only their own guardian link',
  (select count(*) from student_guardians) = 1);
select rls_check('centers: parent sees no center rows (staff-only policy)',
  (select count(*) from centers) = 0);
select rls_check('report_templates: parent sees no academy templates',
  (select count(*) from report_templates) = 0);

-- Regression, Session 5, CRITICAL. This is the escalation that would have
-- handed a parent every student record in the academy.
select rls_expect_blocked('users: parent cannot promote themselves to admin',
  $$update users set role = 'admin' where id = auth.uid()$$);
select rls_expect_blocked('users: parent cannot give themselves a center_id',
  $$update users set center_id = '00000000-0000-4000-8000-000000000c01' where id = auth.uid()$$);
select rls_expect_blocked('users: parent cannot insert an admin row for a spare auth account',
  $$insert into users (id, email, name, role, center_id)
    values ('00000000-0000-4000-8000-000000000a07','rlstest-orphan@example.invalid','X','admin',
            '00000000-0000-4000-8000-000000000c01')$$);

-- Regression, Session 5: student_guardians_all_teacher was missing its role
-- filter. Attaching yourself to another family's child inherits every parent
-- policy that traverses this table.
select rls_expect_blocked('student_guardians: parent cannot link themselves to another family''s child',
  $$insert into student_guardians (student_id, guardian_id)
    values ('00000000-0000-4000-8000-000000000502', auth.uid())$$);
select rls_expect_blocked('attendance: parent cannot write attendance',
  $$update attendance set status = 'absent' where student_id = '00000000-0000-4000-8000-000000000501'$$);
select rls_expect_blocked('progress: parent cannot mark their own child''s lesson complete',
  $$update student_lesson_progress set status = 'completed'
    where student_id = '00000000-0000-4000-8000-000000000501'$$);
select rls_expect_blocked('reports: parent cannot edit their child''s report text',
  $$update reports set final_text = 'tampered'
    where student_id = '00000000-0000-4000-8000-000000000501'$$);
select rls_expect_allowed('users: parent can still edit their own name',
  $$update users set name = 'Parent A Renamed' where id = auth.uid()$$);

-- ============================================================
-- ADMIN A — center-wide, but still center-scoped
-- ============================================================
reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000a01","role":"authenticated"}', true);
set local role authenticated;

select rls_check('users: admin sees themselves plus both teachers in their center',
  (select count(*) from users) = 3);
select rls_check('users: admin does not see the other center''s teacher',
  (select count(*) from users where id = '00000000-0000-4000-8000-000000000a04') = 0);
select rls_check('users: admin does not see parent rows (parents carry no center_id)',
  (select count(*) from users where role = 'parent') = 0);
select rls_check('classes: admin sees every class in their center',
  (select count(*) from classes) = 2);
select rls_check('sessions: admin sees every session in their center',
  (select count(*) from sessions) = 2);
select rls_check('lessons: admin sees every lesson in their center',
  (select count(*) from lessons) = 3);
select rls_check('students: admin sees every student in their center',
  (select count(*) from students) = 2);
select rls_check('classes: admin does not see the other center''s class',
  (select count(*) from classes where center_id = '00000000-0000-4000-8000-000000000c02') = 0);

-- The report publication contract permits same-center admin management.
select rls_check('reports: admin sees center reports',
  (select count(*) from reports) = 2);

select rls_expect_allowed('users: admin can rename a teacher in their center',
  $$update users set name = 'Teacher B Renamed'
    where id = '00000000-0000-4000-8000-000000000a03'$$);
select rls_expect_blocked('users: admin cannot touch a teacher in another center',
  $$update users set name = 'tampered' where id = '00000000-0000-4000-8000-000000000a04'$$);
select rls_expect_blocked('users: admin cannot move a teacher into another center',
  $$update users set center_id = '00000000-0000-4000-8000-000000000c02'
    where id = '00000000-0000-4000-8000-000000000a03'$$);
select rls_expect_blocked('users: admin cannot demote themselves out of their own center',
  $$update users set center_id = '00000000-0000-4000-8000-000000000c02' where id = auth.uid()$$);

-- ============================================================
-- ANON — no session at all
-- ============================================================
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;

select rls_check('anon: no users',    (select count(*) from users) = 0);
select rls_expect_blocked('anon: cannot execute the session log RPC',
  $$select public.log_session_credits(
    '00000000-0000-4000-8000-000000000201', null, '[]'::jsonb, '[]'::jsonb, gen_random_uuid(), 0)$$);
select rls_check('anon: no students', (select count(*) from students) = 0);
select rls_check('anon: no classes',  (select count(*) from classes) = 0);
select rls_check('anon: no sessions', (select count(*) from sessions) = 0);
select rls_check('anon: no reports',  (select count(*) from reports) = 0);
select rls_check('anon: no attendance', (select count(*) from attendance) = 0);
select rls_check('anon: no progress', (select count(*) from student_lesson_progress) = 0);
select rls_check('anon: no session_videos', (select count(*) from session_videos) = 0);
select rls_check('anon: no student_guardians', (select count(*) from student_guardians) = 0);
select rls_check('anon: no report_templates', (select count(*) from report_templates) = 0);

-- Publication lifecycle, exercised under actual SQL roles.
reset role;
update reports set pdf_storage_path = student_id::text || '/' || id::text || '.pdf',
 raw_notes = 'PRIVATE NOTES', ai_draft_text = 'PRIVATE AI DRAFT';
insert into storage.buckets (id, name, public) values ('reports', 'reports', false) on conflict (id) do nothing;
select set_config('test.report_a', (select id::text from reports where student_id = '00000000-0000-4000-8000-000000000501'), true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a02","role":"authenticated"}', true);
set local role authenticated;
select rls_expect_blocked('publication: missing uploaded PDF prevents publishing',
  $$select public.publish_report((select id from reports limit 1))$$);
reset role;
insert into storage.objects (bucket_id, name) select 'reports', pdf_storage_path from reports;
set local role authenticated;
select rls_check('publication: teacher publishes own exported report',
  public.publish_report((select id from reports limit 1)) is not null);
select rls_check('publication: retry returns the same snapshot',
  public.publish_report((select id from reports limit 1)) = (select id from published_reports));
select rls_expect_blocked('publication: snapshot cannot be edited directly',
  $$update published_reports set final_text = 'tampered'$$);
select rls_expect_blocked('publication: snapshot cannot be deleted directly',
  $$delete from published_reports$$);
update reports set final_text = 'NEW PRIVATE EDIT';
select rls_check('publication: subsequent draft edit does not change snapshot',
  (select final_text from published_reports) = 'report for s1');
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a03","role":"authenticated"}', true);
set local role authenticated;
select rls_check('publication: peer teacher sees no snapshot', (select count(*) from published_reports) = 0);
select rls_expect_blocked('publication: direct snapshot insert is denied',
  $$insert into published_reports(report_id,student_id,class_id,final_text,generated_date,pdf_storage_path,published_by)
    select id,student_id,class_id,'forged',generated_date,pdf_storage_path,auth.uid() from reports$$);

select rls_expect_blocked('publication: peer cannot publish another class report',
  $$select public.publish_report(current_setting('test.report_a')::uuid)$$);
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a05","role":"authenticated"}', true);
set local role authenticated;
select rls_check('publication: guardian sees only published final text',
  (select count(*) from published_reports where final_text = 'report for s1') = 1);
select rls_check('publication: draft raw notes remain inaccessible', (select count(*) from reports) = 0);
select rls_expect_blocked('publication: guardian cannot withdraw',
  $$select public.withdraw_report((select id from published_reports limit 1))$$);
select rls_expect_blocked('publication: guardian cannot publish',
  $$select public.publish_report((select report_id from published_reports limit 1))$$);
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a06","role":"authenticated"}', true);
set local role authenticated;
select rls_check('publication: unrelated family sees nothing', (select count(*) from published_reports) = 0);
reset role;
delete from student_guardians where student_id = '00000000-0000-4000-8000-000000000501';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a05","role":"authenticated"}', true);
set local role authenticated;
select rls_check('publication: removed guardian loses access', (select count(*) from published_reports) = 0);
reset role;
insert into student_guardians(student_id,guardian_id) values ('00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000a05');

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a04","role":"authenticated"}', true);
set local role authenticated;
select rls_check('publication: other center sees nothing', (select count(*) from published_reports) = 0);
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a02","role":"authenticated"}', true);
set local role authenticated;
select public.withdraw_report((select id from published_reports limit 1));
select public.withdraw_report((select id from published_reports limit 1));
select public.publish_report((select id from reports limit 1));
select rls_check('publication: withdrawal retry and publish retry do not reopen it',
  (select withdrawn_at is not null from published_reports));
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a05","role":"authenticated"}', true);
set local role authenticated;
select rls_check('publication: withdrawn report is hidden from family', (select count(*) from published_reports) = 0);
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select rls_check('publication: anon sees nothing', (select count(*) from published_reports) = 0);
select rls_expect_blocked('publication: anon cannot call publisher',
  $$select public.publish_report(current_setting('test.report_a')::uuid)$$);

-- Credit accounting, retries and permissions.
reset role;
create function rls_expect_state(t text, stmt text, expected text)
returns void language plpgsql as $$
begin
  execute stmt;
  perform rls_check(t, false, 'Expected an exception');
exception when others then
  perform rls_check(t, sqlstate = expected, 'SQLSTATE ' || sqlstate);
end;
$$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a02","role":"authenticated"}', true);
set local role authenticated;
select rls_check('credits: attendance and its retry deducted only once',
  (select balance from credit_accounts where student_id = '00000000-0000-4000-8000-000000000501') = 4);
select rls_check('credits: failed progress write rolled back its refund',
  (select count(*) from credit_entries) = 2);
select rls_expect_state('credits: legacy session RPC is revoked',
  $$select public.log_session('00000000-0000-4000-8000-000000000201',null,'[]','[]')$$,'42501');
select rls_expect_state('credits: direct attendance update cannot bypass charging',
  $$update attendance set status = 'absent' where session_id = '00000000-0000-4000-8000-000000000201'$$,'42501');
select rls_expect_state('credits: billing exemption cannot be edited',
  $$update sessions set credit_billable = false where id = '00000000-0000-4000-8000-000000000201'$$,'42501');
select rls_expect_state('credits: teacher cannot top up',
  $$select public.adjust_credits('00000000-0000-4000-8000-000000000501',1,'top_up','forged',gen_random_uuid())$$,'42501');
select rls_expect_blocked('credits: direct balance update denied', $$update credit_accounts set balance = 999$$);
select rls_expect_blocked('credits: ledger cannot be deleted', $$delete from credit_entries$$);
select rls_expect_state('credits: stale session revision rejected',
  $$select public.log_session_credits('00000000-0000-4000-8000-000000000201','stale','[]','[]',gen_random_uuid(),0)$$,'P0002');
select rls_expect_state('credits: reused request with different payload rejected',
  $$select public.log_session_credits('00000000-0000-4000-8000-000000000201','changed','[]','[]','00000000-0000-4000-8000-000000000901',0)$$,'P0002');
select public.log_session_credits('00000000-0000-4000-8000-000000000201','refund',
  '[{"studentId":"00000000-0000-4000-8000-000000000501","status":"absent"}]','[]','00000000-0000-4000-8000-000000000902',1);
select public.log_session_credits('00000000-0000-4000-8000-000000000201','refund',
  '[{"studentId":"00000000-0000-4000-8000-000000000501","status":"absent"}]','[]','00000000-0000-4000-8000-000000000902',1);
select rls_check('credits: correction and identical retry refund once',
  (select balance from credit_accounts) = 5 and (select count(*) from credit_entries) = 3);
select rls_check('credits: refund preserves learning progress',
  (select status from student_lesson_progress where lesson_id = '00000000-0000-4000-8000-000000000101') = 'completed');
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a01","role":"authenticated"}', true);
set local role authenticated;
select public.adjust_credits('00000000-0000-4000-8000-000000000501',5,'top_up','Verified opening balance','00000000-0000-4000-8000-000000000900');
select rls_check('credits: retry of original top-up does not add credits again', (select balance from credit_accounts) = 5);
select rls_expect_state('credits: adjustment request cannot be reused for different amount',
  $$select public.adjust_credits('00000000-0000-4000-8000-000000000501',6,'top_up','Verified opening balance','00000000-0000-4000-8000-000000000900')$$,'P0002');
select rls_expect_state('credits: admin cannot top up another center',
  $$select public.adjust_credits('00000000-0000-4000-8000-000000000503',1,'top_up','foreign',gen_random_uuid())$$,'42501');
select rls_expect_state('credits: negative balance adjustment rejected',
  $$select public.adjust_credits('00000000-0000-4000-8000-000000000501',-6,'adjustment','invalid',gen_random_uuid())$$,'P0001');
select public.adjust_credits('00000000-0000-4000-8000-000000000501',-5,'adjustment','Correct opening balance',gen_random_uuid());
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a02","role":"authenticated"}', true);
set local role authenticated;
select rls_expect_state('credits: insufficient balance rejects attendance atomically',
  $$select public.log_session_credits('00000000-0000-4000-8000-000000000201','must not save',
  '[{"studentId":"00000000-0000-4000-8000-000000000501","status":"present"}]','[]',gen_random_uuid(),2)$$,'P0001');
select rls_check('credits: rejected log preserves attendance notes and revision',
  (select status from attendance where session_id = '00000000-0000-4000-8000-000000000201') = 'absent'
  and (select notes = 'refund' and revision = 2 from sessions where id = '00000000-0000-4000-8000-000000000201'));
reset role;
-- A pre-cutover session remains exempt even with zero credit.
insert into sessions(id,class_id,teacher_id,session_date,credit_billable) values
  ('00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000c11','00000000-0000-4000-8000-000000000a02',current_date,false);
set local role authenticated;
select public.log_session_credits('00000000-0000-4000-8000-000000000203','legacy',
  '[{"studentId":"00000000-0000-4000-8000-000000000501","status":"present"}]','[]',gen_random_uuid(),0);
select rls_check('credits: exempt historical session does not charge', (select balance from credit_accounts) = 0);
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a01","role":"authenticated"}', true);
set local role authenticated;
select public.adjust_credits('00000000-0000-4000-8000-000000000501',1,'top_up','One new credit',gen_random_uuid());
select public.log_session_credits('00000000-0000-4000-8000-000000000201','admin log',
  '[{"studentId":"00000000-0000-4000-8000-000000000501","status":"present"}]','[]',gen_random_uuid(),2);
select rls_check('credits: center admin can log attendance with charge', (select balance from credit_accounts) = 0);
reset role;
delete from enrollments where student_id = '00000000-0000-4000-8000-000000000501';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a02","role":"authenticated"}', true);
set local role authenticated;
select public.log_session_credits('00000000-0000-4000-8000-000000000201','unenrolled refund',
  '[{"studentId":"00000000-0000-4000-8000-000000000501","status":"unmarked"}]','[]',gen_random_uuid(),3);
select rls_expect_state('credits: cannot charge an unenrolled learner again',
  $$select public.log_session_credits('00000000-0000-4000-8000-000000000201','invalid',
  '[{"studentId":"00000000-0000-4000-8000-000000000501","status":"present"}]','[]',gen_random_uuid(),4)$$,'42501');
reset role;
select rls_check('credits: unmark after unenrollment refunds the previous charge',
  (select balance from credit_accounts where student_id = '00000000-0000-4000-8000-000000000501') = 1);
insert into enrollments(student_id,class_id) values
 ('00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000c11'),
 ('00000000-0000-4000-8000-000000000502','00000000-0000-4000-8000-000000000c11');
set local role authenticated;
select rls_expect_state('credits: one unfunded learner rolls back the whole class log',
 $$select public.log_session_credits('00000000-0000-4000-8000-000000000201','partial must roll back',
 '[{"studentId":"00000000-0000-4000-8000-000000000501","status":"present"},{"studentId":"00000000-0000-4000-8000-000000000502","status":"present"}]','[]',gen_random_uuid(),4)$$,'P0001');
reset role;
select rls_check('credits: partial charge account creation and revision all roll back',
 (select balance from credit_accounts where student_id = '00000000-0000-4000-8000-000000000501') = 1
 and not exists(select 1 from credit_accounts where student_id = '00000000-0000-4000-8000-000000000502')
 and (select revision from sessions where id = '00000000-0000-4000-8000-000000000201') = 4);
delete from enrollments where class_id = '00000000-0000-4000-8000-000000000c11';
select rls_check('credits: balances reconcile exactly to append-only ledger',
  not exists(select 1 from credit_accounts a where balance <> (select coalesce(sum(amount),0) from credit_entries e where e.student_id = a.student_id)));
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a05","role":"authenticated"}', true);
set local role authenticated;
select rls_check('credits: guardian can read own child after unenrollment', (select count(*) from credit_accounts) = 1);
select rls_expect_state('credits: guardian cannot adjust balance',
  $$select public.adjust_credits('00000000-0000-4000-8000-000000000501',1,'top_up','forged',gen_random_uuid())$$,'42501');
select rls_check('credits: operation receipts are private', (select count(*) from credit_operations) = 0);
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a06","role":"authenticated"}', true);
set local role authenticated;
select rls_check('credits: another family sees no balance or ledger', (select count(*) from credit_accounts) = 0 and (select count(*) from credit_entries) = 0);
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select rls_check('credits: anonymous reads denied', (select count(*) from credit_accounts) = 0 and (select count(*) from credit_entries) = 0);
select rls_expect_state('credits: anonymous RPC denied',
  $$select public.adjust_credits('00000000-0000-4000-8000-000000000501',1,'top_up','forged',gen_random_uuid())$$,'42501');
reset role;
set constraints all immediate;

-- ============================================================
-- COVERAGE CHECK — every table must have RLS on
-- ============================================================
-- Catches the CLAUDE.md §11 rule "DO NOT skip RLS on any new table": a table
-- added later without policies would otherwise pass every test above simply by
-- never being tested.
reset role;
select rls_check('coverage: RLS enabled on every public table',
  (select count(*) from pg_tables t
    where t.schemaname = 'public'
      and t.tablename <> 'rls_results'
      and not exists (
        select 1 from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = t.tablename and c.relrowsecurity
      )) = 0,
  (select coalesce(string_agg(t.tablename, ', '), 'none') from pg_tables t
    where t.schemaname = 'public'
      and t.tablename <> 'rls_results'
      and not exists (
        select 1 from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = t.tablename and c.relrowsecurity
      )));

select rls_check('coverage: every RLS-enabled table has at least one policy',
  (select count(*) from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
      and not exists (select 1 from pg_policies p
                      where p.schemaname = 'public' and p.tablename = c.relname)) = 0);

-- ============================================================
-- RESULTS — failures first
-- ============================================================
select
  case when ok then 'pass' else 'FAIL' end as result,
  name,
  detail
from rls_results
order by ok, seq;

select
  count(*) filter (where not ok) as failures,
  count(*) as checks,
  case when count(*) filter (where not ok) = 0
       then 'ALL CHECKS PASSED'
       else 'RLS BOUNDARY BROKEN — see the failing rows above'
  end as verdict
from rls_results;

rollback;
