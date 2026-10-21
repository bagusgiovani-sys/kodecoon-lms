begin;

alter table lessons add constraint lessons_id_class_unique unique(id,class_id);
create table student_feedback (
  id uuid primary key,
  student_id uuid not null,
  class_id uuid not null,
  center_id uuid not null,
  lesson_id uuid,
  title text not null check(length(btrim(title)) between 1 and 200),
  strengths text not null check(length(btrim(strengths,E' \t\r\n')) between 1 and 10000),
  next_steps text not null check(length(btrim(next_steps,E' \t\r\n')) between 1 and 10000),
  rating text not null check(rating in ('Getting started','Growing','Confident','Independent')),
  revision integer not null default 1 check(revision>0),
  created_by uuid not null references users(id),
  updated_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(student_id,center_id) references students(id,center_id),
  foreign key(class_id,center_id) references classes(id,center_id),
  foreign key(lesson_id,class_id) references lessons(id,class_id),
  unique(id,student_id,class_id,center_id)
);
create index student_feedback_student_idx on student_feedback(student_id,id);
create table published_feedback (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null,
  student_id uuid not null,
  class_id uuid not null,
  center_id uuid not null,
  draft_revision integer not null check(draft_revision>0),
  title text not null check(length(btrim(title)) between 1 and 200),
  strengths text not null check(length(btrim(strengths,E' \t\r\n')) between 1 and 10000),
  next_steps text not null check(length(btrim(next_steps,E' \t\r\n')) between 1 and 10000),
  rating text not null check(rating in ('Getting started','Growing','Confident','Independent')),
  published_by uuid not null references users(id),
  published_at timestamptz not null default now(),
  withdrawn_by uuid references users(id),
  withdrawn_at timestamptz,
  foreign key(feedback_id,student_id,class_id,center_id) references student_feedback(id,student_id,class_id,center_id),
  unique(feedback_id,draft_revision),
  check((withdrawn_at is null)=(withdrawn_by is null))
);
create index published_feedback_student_idx on published_feedback(student_id,id);
create table feedback_write_receipts (
  actor_id uuid not null references users(id),request_id uuid not null,
  payload jsonb not null,result jsonb not null,created_at timestamptz not null default now(),
  primary key(actor_id,request_id)
);
alter table student_feedback enable row level security;
alter table published_feedback enable row level security;
alter table feedback_write_receipts enable row level security;
create policy "feedback_drafts_staff" on student_feedback for select to authenticated
  using(public.can_manage_class(class_id));
create policy "feedback_publications_scoped" on published_feedback for select to authenticated
  using(public.can_manage_class(class_id) or (withdrawn_at is null and exists(
    select 1 from student_guardians sg join users u on u.id=sg.guardian_id
    where sg.student_id=published_feedback.student_id and u.id=auth.uid() and u.role='parent')));
create policy "feedback_receipts_private" on feedback_write_receipts for select to authenticated using(false);
grant select on student_feedback,published_feedback to authenticated;
revoke truncate on student_feedback,published_feedback,feedback_write_receipts from public,anon,authenticated;

create function public.manage_feedback(
  p_action text,p_id uuid,p_student uuid,p_class uuid,p_expected_revision integer,p_request uuid,p_content jsonb
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_actor uuid:=auth.uid(); v_draft student_feedback%rowtype;
  v_publication published_feedback%rowtype; v_receipt feedback_write_receipts%rowtype;
  v_center uuid; v_lesson uuid; v_payload jsonb; v_result jsonb;
begin
  if v_actor is null or not exists(select 1 from users where id=v_actor and role in ('teacher','admin')) then
    raise exception 'Not authorized' using errcode='42501'; end if;
  if p_action is null or p_action not in ('create','edit','publish','withdraw') or p_id is null or p_request is null
    or p_expected_revision is null or p_expected_revision<0 then raise exception 'Invalid request' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('feedback-request:'||v_actor::text||':'||p_request::text,0));
  if p_action='create' then
    if p_student is null or p_class is null or p_expected_revision<>0 then raise exception 'Invalid feedback' using errcode='22023'; end if;
    if not public.can_manage_class(p_class) then raise exception 'Not authorized' using errcode='42501'; end if;
    perform pg_advisory_xact_lock(hashtextextended('feedback:'||p_id::text,0));
  else
    if p_student is not null or p_class is not null then raise exception 'Invalid scope' using errcode='22023'; end if;
    if p_action='withdraw' then
      select * into v_publication from published_feedback where id=p_id;
      select * into v_draft from student_feedback where id=v_publication.feedback_id for update;
    else
      select * into v_draft from student_feedback where id=p_id for update;
    end if;
    if v_draft.id is null or not public.can_manage_class(v_draft.class_id) then
      raise exception 'Not authorized' using errcode='42501'; end if;
  end if;
  v_payload:=jsonb_build_object('action',p_action,'id',p_id,'student',p_student,'class',p_class,
    'revision',p_expected_revision,'content',p_content);
  select * into v_receipt from feedback_write_receipts where actor_id=v_actor and request_id=p_request;
  if found then
    if v_receipt.payload<>v_payload then raise exception 'Request reused' using errcode='P0002'; end if;
    return v_receipt.result;
  end if;
  if p_action in ('create','edit') then
    if p_content is null or jsonb_typeof(p_content)<>'object' then raise exception 'Invalid content' using errcode='22023'; end if;
    if jsonb_typeof(p_content->'title') is distinct from 'string'
      or jsonb_typeof(p_content->'strengths') is distinct from 'string'
      or jsonb_typeof(p_content->'nextSteps') is distinct from 'string'
      or jsonb_typeof(p_content->'rating') is distinct from 'string'
      or not(p_content ? 'lessonId') or jsonb_typeof(p_content->'lessonId') not in ('null','string')
      or exists(select 1 from jsonb_object_keys(p_content) k where k not in ('title','strengths','nextSteps','rating','lessonId')) then
      raise exception 'Invalid content' using errcode='22023'; end if;
    v_lesson:=(p_content->>'lessonId')::uuid;
    if p_action='create' then
      if exists(select 1 from student_feedback where id=p_id) then raise exception 'Feedback exists' using errcode='P0002'; end if;
      select center_id into v_center from classes where id=p_class;
      perform 1 from enrollments where class_id=p_class and student_id=p_student for share;
      if not found then raise exception 'Learner not enrolled' using errcode='22023'; end if;
      insert into student_feedback(id,student_id,class_id,center_id,lesson_id,title,strengths,next_steps,rating,created_by,updated_by)
        values(p_id,p_student,p_class,v_center,v_lesson,p_content->>'title',p_content->>'strengths',p_content->>'nextSteps',p_content->>'rating',v_actor,v_actor)
        returning * into v_draft;
    else
      if v_draft.revision<>p_expected_revision then raise exception 'Stale draft' using errcode='P0002'; end if;
      update student_feedback set lesson_id=v_lesson,title=p_content->>'title',strengths=p_content->>'strengths',
        next_steps=p_content->>'nextSteps',rating=p_content->>'rating',revision=revision+1,updated_by=v_actor,updated_at=now()
        where id=p_id returning * into v_draft;
    end if;
    v_result:=jsonb_build_object('id',v_draft.id,'revision',v_draft.revision);
  else
    if p_content is not null then raise exception 'Invalid content' using errcode='22023'; end if;
    if p_action='publish' then
      if v_draft.revision<>p_expected_revision then raise exception 'Stale draft' using errcode='P0002'; end if;
      if exists(select 1 from published_feedback where feedback_id=p_id and draft_revision=p_expected_revision) then
        raise exception 'Revision already published' using errcode='P0002'; end if;
      insert into published_feedback(feedback_id,student_id,class_id,center_id,draft_revision,title,strengths,next_steps,rating,published_by)
        values(v_draft.id,v_draft.student_id,v_draft.class_id,v_draft.center_id,v_draft.revision,v_draft.title,v_draft.strengths,v_draft.next_steps,v_draft.rating,v_actor)
        returning * into v_publication;
    else
      if v_publication.draft_revision<>p_expected_revision then raise exception 'Wrong publication revision' using errcode='P0002'; end if;
      update published_feedback set withdrawn_at=coalesce(withdrawn_at,now()),withdrawn_by=coalesce(withdrawn_by,v_actor)
        where id=p_id returning * into v_publication;
    end if;
    v_result:=jsonb_build_object('id',v_publication.id,'feedbackId',v_publication.feedback_id,
      'draftRevision',v_publication.draft_revision,'withdrawn',v_publication.withdrawn_at is not null);
  end if;
  insert into feedback_write_receipts(actor_id,request_id,payload,result) values(v_actor,p_request,v_payload,v_result);
  return v_result;
end;
$$;
revoke all on function public.manage_feedback(text,uuid,uuid,uuid,integer,uuid,jsonb) from public,anon;
grant execute on function public.manage_feedback(text,uuid,uuid,uuid,integer,uuid,jsonb) to authenticated;
commit;
