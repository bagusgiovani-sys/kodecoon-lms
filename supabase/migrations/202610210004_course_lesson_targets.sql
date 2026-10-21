begin;

alter table courses add column lesson_count integer not null default 0
  check (lesson_count between 0 and 10000);
update courses c set lesson_count = (
  select count(*)::integer from course_lessons l
  where l.course_id = c.id and l.archived_at is null
);

drop policy if exists "course_lessons_read_guardian_active_class" on course_lessons;
drop policy if exists "course_lessons_read_staff" on course_lessons;
create policy "course_lessons_read_staff" on course_lessons for select to authenticated
using (
  exists (
    select 1 from courses c where c.id=course_lessons.course_id
      and c.center_id=public.current_user_center()
      and public.current_user_role() in ('teacher','admin')
  )
);

create table course_target_write_receipts (
  actor_id uuid not null references users(id),
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, request_id)
);
alter table course_target_write_receipts enable row level security;
create policy "course_target_receipts_private" on course_target_write_receipts for select to authenticated using (false);
revoke all on course_target_write_receipts from public,anon,authenticated;
revoke truncate on course_target_write_receipts from public,anon,authenticated;

alter function public.save_course_content(uuid,uuid,integer,uuid,jsonb) rename to save_course_content_v1;
revoke all on function public.save_course_content_v1(uuid,uuid,integer,uuid,jsonb) from public,anon,authenticated;

create function public.save_course_content(
  p_course uuid, p_lesson uuid, p_expected_revision integer,
  p_request uuid, p_content jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_center uuid;
  v_course courses%rowtype;
  v_receipt course_target_write_receipts%rowtype;
  v_payload jsonb;
  v_content jsonb;
  v_result jsonb;
  v_count integer;
begin
  if p_lesson is not null then
    return public.save_course_content_v1(p_course,p_lesson,p_expected_revision,p_request,p_content);
  end if;
  if p_content is null or jsonb_typeof(p_content) <> 'object'
     or jsonb_typeof(p_content->'lesson_count') is distinct from 'number'
     or (p_content->>'lesson_count') !~ '^[0-9]{1,5}$' then
    raise exception 'Invalid lesson count' using errcode='22023';
  end if;
  v_count := (p_content->>'lesson_count')::integer;
  if v_count < 0 or v_count > 10000 then
    raise exception 'Invalid lesson count' using errcode='22023';
  end if;
  select role,center_id into v_role,v_center from users where id=v_actor;
  if v_actor is null or v_center is null or v_role not in ('teacher','admin') then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('course-request:'||v_actor::text||':'||p_request::text,0));
  perform pg_advisory_xact_lock(hashtextextended('course:'||p_course::text,0));
  select * into v_course from courses where id=p_course for update;
  if v_course.id is not null and (v_course.center_id<>v_center or (v_role<>'admin' and v_course.owner_id<>v_actor)) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  v_payload:=jsonb_build_object('course',p_course,'lesson',p_lesson,'revision',p_expected_revision,'content',p_content);
  select * into v_receipt from course_target_write_receipts where actor_id=v_actor and request_id=p_request;
  if found then
    if v_receipt.payload<>v_payload then raise exception 'Request reused' using errcode='P0002'; end if;
    return v_receipt.result;
  end if;
  v_content:=p_content-'lesson_count';
  v_result:=public.save_course_content_v1(p_course,null,p_expected_revision,p_request,v_content);
  update courses set lesson_count=v_count where id=p_course;
  insert into course_target_write_receipts(actor_id,request_id,payload,result)
    values(v_actor,p_request,v_payload,v_result);
  return v_result;
end;
$$;
revoke all on function public.save_course_content(uuid,uuid,integer,uuid,jsonb) from public,anon;
grant execute on function public.save_course_content(uuid,uuid,integer,uuid,jsonb) to authenticated;

commit;
