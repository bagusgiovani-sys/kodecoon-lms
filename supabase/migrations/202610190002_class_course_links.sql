begin;

alter table classes add constraint classes_id_center_unique unique (id, center_id);
alter table courses add constraint courses_id_center_unique unique (id, center_id);

create table class_course_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  center_id uuid not null,
  course_id uuid not null,
  assigned_by uuid not null references users(id),
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  foreign key (class_id, center_id) references classes(id, center_id),
  foreign key (course_id, center_id) references courses(id, center_id),
  unique (id, class_id)
);
create unique index class_course_one_active_per_class
  on class_course_assignments(class_id) where ended_at is null;
create index class_course_history_idx on class_course_assignments(class_id, assigned_at desc, id);

create table class_course_write_receipts (
  actor_id uuid not null references users(id),
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, request_id)
);

alter table class_course_assignments enable row level security;
alter table class_course_write_receipts enable row level security;
create policy "class_course_assignments_read_staff" on class_course_assignments for select to authenticated
using (
  (public.current_user_role() = 'teacher' and public.is_teacher_of_class(class_id)) or
  (public.current_user_role() = 'admin' and center_id = public.current_user_center())
);
create policy "class_course_receipts_private" on class_course_write_receipts for select to authenticated using (false);
grant select on class_course_assignments to authenticated;
revoke truncate on class_course_assignments,class_course_write_receipts from public,anon,authenticated;

create function public.set_class_course(p_class uuid, p_course uuid, p_request uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_user_center uuid;
  v_center uuid;
  v_active class_course_assignments%rowtype;
  v_receipt class_course_write_receipts%rowtype;
  v_payload jsonb;
  v_result jsonb;
begin
  select role,center_id into v_role,v_user_center from users where id = v_actor;
  if v_actor is null or v_role is null or v_role not in ('teacher','admin') then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  if p_class is null or p_request is null then
    raise exception 'Invalid request' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('class-course-request:'||v_actor::text||':'||p_request::text,0));
  perform pg_advisory_xact_lock(hashtextextended('class-course:'||p_class::text,0));
  select center_id into v_center from classes where id=p_class for update;
  if v_center is null or
    (v_role='teacher' and (v_user_center is distinct from v_center or not public.is_teacher_of_class(p_class))) or
    (v_role='admin' and v_user_center is distinct from v_center) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  v_payload:=jsonb_build_object('class',p_class,'course',p_course);
  select * into v_receipt from class_course_write_receipts where actor_id=v_actor and request_id=p_request;
  if found then
    if v_receipt.payload<>v_payload then raise exception 'Request reused' using errcode='P0002'; end if;
    return v_receipt.result;
  end if;
  select * into v_active from class_course_assignments where class_id=p_class and ended_at is null for update;
  if p_course is not null then
    perform 1 from courses where id=p_course and center_id=v_center and archived_at is null;
    if not found then raise exception 'Course unavailable' using errcode='42501'; end if;
  end if;
  if v_active.id is not null and v_active.course_id is not distinct from p_course then
    v_result:=jsonb_build_object('id',v_active.id,'courseId',p_course,'changed',false);
  else
    if v_active.id is not null then
      update class_course_assignments set ended_at=now() where id=v_active.id;
    end if;
    if p_course is null then
      v_result:=jsonb_build_object('id',null,'courseId',null,'changed',v_active.id is not null);
    else
      insert into class_course_assignments(class_id,center_id,course_id,assigned_by)
        values(p_class,v_center,p_course,v_actor) returning id into v_active.id;
      v_result:=jsonb_build_object('id',v_active.id,'courseId',p_course,'changed',true);
    end if;
  end if;
  insert into class_course_write_receipts(actor_id,request_id,payload,result)
    values(v_actor,p_request,v_payload,v_result);
  return v_result;
end;
$$;
revoke all on function public.set_class_course(uuid,uuid,uuid) from public,anon;
grant execute on function public.set_class_course(uuid,uuid,uuid) to authenticated;
commit;
