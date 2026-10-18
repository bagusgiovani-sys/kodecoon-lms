-- Apply once to the existing KodeHub schema. Existing reports stay private.
begin;

alter table public.reports add column pdf_storage_path text;
drop policy if exists "reports_select_parent" on public.reports;

-- Stable class scope, not merely another class that happens to share a student.
create or replace function public.can_manage_report(p_student uuid, p_class uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users u
    join public.classes c on c.id = p_class and c.center_id = u.center_id
    join public.students s on s.id = p_student and s.center_id = c.center_id
    where u.id = auth.uid() and
      (u.role = 'admin' or (u.role = 'teacher' and c.teacher_id = u.id))
  );
$$;
revoke all on function public.can_manage_report(uuid, uuid) from public, anon;
grant execute on function public.can_manage_report(uuid, uuid) to authenticated;

drop policy "reports_all_teacher" on public.reports;
create policy "reports_manage_staff" on public.reports for all to authenticated
  using (public.can_manage_report(student_id, class_id))
  with check (
    public.can_manage_report(student_id, class_id)
    and exists (select 1 from public.enrollments e
      where e.student_id = reports.student_id and e.class_id = reports.class_id)
  );

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
alter table public.published_reports enable row level security;
grant select on public.published_reports to authenticated;
create policy "published_reports_staff_read" on public.published_reports
  for select to authenticated using (public.can_manage_report(student_id, class_id));
create policy "published_reports_family_read" on public.published_reports
  for select to authenticated using (
    withdrawn_at is null and exists (
      select 1 from public.student_guardians g
      where g.student_id = published_reports.student_id and g.guardian_id = auth.uid()
    )
  );

-- No client INSERT/UPDATE/DELETE policy. Only these narrowly scoped RPCs write.
create or replace function public.publish_report(p_report_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare r public.reports; publication_id uuid;
begin
  select * into r from public.reports where id = p_report_id for update;
  if not found or not public.can_manage_report(r.student_id, r.class_id) then
    raise exception 'Report not found' using errcode = '42501';
  end if;
  if r.final_text is null or length(trim(r.final_text)) = 0
    or r.pdf_storage_path is distinct from r.student_id::text || '/' || r.id::text || '.pdf' then
    raise exception 'Export a PDF before publishing' using errcode = '23514';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'reports' and name = r.pdf_storage_path) then
    raise exception 'Export a PDF before publishing' using errcode = '23514';
  end if;
  insert into public.published_reports
    (report_id, student_id, class_id, final_text, generated_date, pdf_storage_path, published_by)
  values (r.id, r.student_id, r.class_id, r.final_text, r.generated_date, r.pdf_storage_path, auth.uid())
  on conflict (report_id) do nothing returning id into publication_id;
  if publication_id is null then
    select id into publication_id from public.published_reports where report_id = r.id;
  end if;
  -- A retry never reopens a withdrawn snapshot. Export a new version to republish.
  return publication_id;
end;
$$;

create or replace function public.withdraw_report(p_publication_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare r public.published_reports;
begin
  select * into r from public.published_reports where id = p_publication_id for update;
  if not found or not public.can_manage_report(r.student_id, r.class_id) then
    raise exception 'Report not found' using errcode = '42501';
  end if;
  update public.published_reports set withdrawn_at = coalesce(withdrawn_at, now())
    where id = r.id;
end;
$$;
revoke all on function public.publish_report(uuid) from public, anon;
revoke all on function public.withdraw_report(uuid) from public, anon;
grant execute on function public.publish_report(uuid) to authenticated;
grant execute on function public.withdraw_report(uuid) to authenticated;

commit;
