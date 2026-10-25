begin;
create table public.student_media (
 id uuid primary key, student_id uuid not null references students(id),
 kind text not null check(kind in ('photo','video')), storage_path text not null unique,
 description text not null default '' check(length(description)<=2000),
 recorded_date date not null, ready boolean not null default false,
 created_by uuid not null references users(id), created_at timestamptz not null default now()
);
alter table student_media enable row level security;
create policy student_media_read on student_media for select to authenticated using (
 can_read_credits(student_id) and (ready or created_by=auth.uid())
);
create policy student_media_insert on student_media for insert to authenticated with check (
 current_user_role() in ('teacher','admin') and can_read_credits(student_id) and created_by=auth.uid()
 and not ready and storage_path like student_id::text || '/' || id::text || '.%'
);
revoke all on student_media from public,anon,authenticated;
grant select,insert on student_media to authenticated;
-- Only the trusted API finalizes uploads after verifying storage metadata.
grant all on student_media to service_role;
commit;
