begin;

alter table lessons add column course_id uuid;
alter table lessons add column course_lesson_id uuid;
alter table lessons add constraint lessons_course_mapping_pair
  check ((course_id is null) = (course_lesson_id is null));
alter table lessons add constraint lessons_course_mapping_source_fk
  foreign key (course_lesson_id,course_id) references course_lessons(id,course_id);
create unique index lessons_course_mapping_once
  on lessons(class_id,course_id,course_lesson_id) where course_lesson_id is not null;

create table course_curriculum_write_receipts (
  actor_id uuid not null references users(id),
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id,request_id)
);
alter table course_curriculum_write_receipts enable row level security;
create policy "course_curriculum_receipts_private" on course_curriculum_write_receipts
  for select to authenticated using (false);
revoke all on course_curriculum_write_receipts from public,anon,authenticated;
revoke truncate on course_curriculum_write_receipts from public,anon,authenticated;

create function public.enforce_class_course_lesson_mapping()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.course_id is null and new.course_lesson_id is null then return new; end if;
  if new.course_id is null or new.course_lesson_id is null then
    raise exception 'Incomplete course lesson mapping' using errcode='23514';
  end if;
  if tg_op='UPDATE' and old.course_id is not distinct from new.course_id
     and old.course_lesson_id is not distinct from new.course_lesson_id then return new; end if;
  if not exists (
    select 1 from class_course_assignments ca
    join course_lessons cl on cl.course_id=ca.course_id
    where ca.class_id=new.class_id and ca.course_id=new.course_id and ca.ended_at is null
      and cl.id=new.course_lesson_id and cl.archived_at is null
  ) then raise exception 'Mapping requires a lesson from the active class course' using errcode='23514'; end if;
  return new;
end;
$$;
create trigger lessons_course_mapping_guard
  before insert or update of course_id,course_lesson_id on lessons
  for each row execute function public.enforce_class_course_lesson_mapping();
revoke all on function public.enforce_class_course_lesson_mapping() from public,anon,authenticated;

create function public.map_class_course_lessons(
  p_class uuid,p_course uuid,p_request uuid,p_mappings jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_actor uuid:=auth.uid();
  v_role text;
  v_user_center uuid;
  v_center uuid;
  v_teacher uuid;
  v_active class_course_assignments%rowtype;
  v_receipt course_curriculum_write_receipts%rowtype;
  v_course_lesson course_lessons%rowtype;
  v_class_lesson lessons%rowtype;
  v_item jsonb;
  v_source uuid;
  v_target uuid;
  v_target_text text;
  v_sequence integer;
  v_payload jsonb;
  v_results jsonb:='[]'::jsonb;
  v_created integer:=0;
  v_mapped integer:=0;
  v_duplicates integer;
begin
  select role,center_id into v_role,v_user_center from users where id=v_actor;
  select center_id,teacher_id into v_center,v_teacher from classes where id=p_class for update;
  if v_actor is null or v_role not in ('teacher','admin') or v_center is null
     or v_user_center is distinct from v_center
     or (v_role='teacher' and v_teacher is distinct from v_actor) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  if p_course is null or p_request is null or jsonb_typeof(p_mappings) is distinct from 'array'
     or jsonb_array_length(p_mappings) not between 1 and 100 then
    raise exception 'Invalid curriculum mapping' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('class-curriculum-request:'||v_actor::text||':'||p_request::text,0));
  perform pg_advisory_xact_lock(hashtextextended('class-curriculum:'||p_class::text,0));
  select * into v_active from class_course_assignments
    where class_id=p_class and course_id=p_course and ended_at is null for update;
  if v_active.id is null then raise exception 'Course is not active for class' using errcode='42501'; end if;

  select count(*) into v_duplicates from (
    select value->>'courseLessonId' from jsonb_array_elements(p_mappings)
    group by value->>'courseLessonId' having count(*)>1
  ) d;
  if v_duplicates>0 or exists (
    select 1 from jsonb_array_elements(p_mappings) item
    where jsonb_typeof(item) is distinct from 'object'
       or jsonb_typeof(item->'courseLessonId') is distinct from 'string'
       or (jsonb_typeof(item->'lessonId') is distinct from 'string'
           and jsonb_typeof(item->'lessonId') is distinct from 'null')
  ) then raise exception 'Invalid or duplicate curriculum mapping' using errcode='22023'; end if;
  select count(*) into v_duplicates from (
    select value->>'lessonId' from jsonb_array_elements(p_mappings)
    where jsonb_typeof(value->'lessonId')='string'
    group by value->>'lessonId' having count(*)>1
  ) d;
  if v_duplicates>0 then raise exception 'A class lesson can only be mapped once per request' using errcode='22023'; end if;

  v_payload:=jsonb_build_object('class',p_class,'course',p_course,'mappings',p_mappings);
  select * into v_receipt from course_curriculum_write_receipts
    where actor_id=v_actor and request_id=p_request;
  if found then
    if v_receipt.payload<>v_payload then raise exception 'Request reused' using errcode='P0002'; end if;
    return v_receipt.result;
  end if;

  for v_item in select value from jsonb_array_elements(p_mappings) loop
    v_source:=(v_item->>'courseLessonId')::uuid;
    v_target_text:=v_item->>'lessonId';
    v_target:=case when v_target_text is null then null else v_target_text::uuid end;
    select * into v_course_lesson from course_lessons
      where id=v_source and course_id=p_course and archived_at is null for share;
    if v_course_lesson.id is null then raise exception 'Course lesson unavailable' using errcode='22023'; end if;

    select * into v_class_lesson from lessons
      where class_id=p_class and course_id=p_course and course_lesson_id=v_source for update;
    if v_class_lesson.id is not null then
      if v_target is not null and v_class_lesson.id<>v_target then
        raise exception 'Course lesson is already mapped' using errcode='P0002';
      end if;
    elsif v_target is not null then
      select * into v_class_lesson from lessons where id=v_target and class_id=p_class for update;
      if v_class_lesson.id is null or v_class_lesson.course_lesson_id is not null then
        raise exception 'Class lesson unavailable for mapping' using errcode='22023';
      end if;
      update lessons set course_id=p_course,course_lesson_id=v_source where id=v_target;
    else
      select coalesce(max(sequence_number),0)+1 into v_sequence from lessons where class_id=p_class;
      if v_sequence>10000 then raise exception 'Class lesson limit reached' using errcode='22023'; end if;
      insert into lessons(class_id,sequence_number,title,description,course_id,course_lesson_id)
        values(p_class,v_sequence,v_course_lesson.title,nullif(v_course_lesson.objective,''),p_course,v_source)
        returning * into v_class_lesson;
      v_created:=v_created+1;
    end if;
    v_mapped:=v_mapped+1;
    v_results:=v_results||jsonb_build_array(jsonb_build_object(
      'courseLessonId',v_source,'lessonId',v_class_lesson.id,
      'sequenceNumber',v_class_lesson.sequence_number
    ));
  end loop;

  v_payload:=jsonb_build_object('classId',p_class,'courseId',p_course,
    'mappedCount',v_mapped,'createdCount',v_created,'mappings',v_results);
  insert into course_curriculum_write_receipts(actor_id,request_id,payload,result)
    values(v_actor,p_request,jsonb_build_object('class',p_class,'course',p_course,'mappings',p_mappings),v_payload);
  return v_payload;
end;
$$;
revoke all on function public.map_class_course_lessons(uuid,uuid,uuid,jsonb) from public,anon;
grant execute on function public.map_class_course_lessons(uuid,uuid,uuid,jsonb) to authenticated;
revoke truncate on lessons from public,anon,authenticated;

commit;
