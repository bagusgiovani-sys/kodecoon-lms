begin;

alter table students add constraint students_id_center_unique unique (id,center_id);

alter table class_course_assignments add constraint class_course_assignment_composite_unique
  unique (id,class_id,course_id,center_id);
alter table course_lessons add constraint course_lessons_id_course_unique unique (id,course_id);

create table assignments (
  id uuid primary key,
  class_id uuid not null,
  center_id uuid not null,
  course_assignment_id uuid not null,
  course_id uuid not null,
  course_lesson_id uuid,
  title text not null check (length(btrim(title)) between 1 and 200),
  brief text not null check (length(brief) <= 20000),
  due_at timestamptz,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  lesson_title_snapshot text,
  lesson_objective_snapshot text,
  revision integer not null default 1 check (revision > 0),
  created_by uuid not null references users(id),
  updated_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  foreign key (course_assignment_id,class_id,course_id,center_id)
    references class_course_assignments(id,class_id,course_id,center_id),
  foreign key (class_id,center_id) references classes(id,center_id),
  foreign key (course_lesson_id,course_id) references course_lessons(id,course_id),
  unique (id,class_id),
  check ((status='draft' and published_at is null) or status in ('published','archived'))
);
create index assignments_class_idx on assignments(class_id,status,updated_at desc,id);

create table assignment_learners (
  assignment_id uuid not null,
  class_id uuid not null,
  center_id uuid not null,
  student_id uuid not null,
  assigned_at timestamptz not null default now(),
  submission_open boolean not null default true,
  primary key (assignment_id,student_id),
  foreign key (assignment_id,class_id) references assignments(id,class_id),
  foreign key (class_id,center_id) references classes(id,center_id),
  foreign key (student_id,center_id) references students(id,center_id)
);
create index assignment_learners_student_idx on assignment_learners(student_id,assigned_at desc,assignment_id);

create table assignment_write_receipts (
  actor_id uuid not null references users(id), request_id uuid not null,
  payload jsonb not null, result jsonb not null, created_at timestamptz not null default now(),
  primary key(actor_id,request_id)
);

create function public.can_manage_class(p_class uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists (
    select 1 from classes c join users u on u.id=auth.uid()
    where c.id=p_class and (
      (u.role='teacher' and u.center_id=c.center_id and c.teacher_id=u.id) or
      (u.role='admin' and u.center_id=c.center_id)
    )
  )
$$;
create function public.can_read_assignment(p_assignment uuid,p_student uuid default null)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists (
    select 1 from assignments a join assignment_learners al on al.assignment_id=a.id
    join student_guardians sg on sg.student_id=al.student_id
    join users u on u.id=auth.uid()
    where a.id=p_assignment and a.status in ('published','archived')
      and u.role='parent' and sg.guardian_id=u.id
      and (p_student is null or al.student_id=p_student)
  )
$$;
revoke all on function public.can_manage_class(uuid) from public;
revoke all on function public.can_read_assignment(uuid,uuid) from public;
grant execute on function public.can_manage_class(uuid),public.can_read_assignment(uuid,uuid) to authenticated;

alter table assignments enable row level security;
alter table assignment_learners enable row level security;
alter table assignment_write_receipts enable row level security;
create policy "assignments_read_staff_or_family" on assignments for select to authenticated
using (public.can_manage_class(class_id) or public.can_read_assignment(id,null));
create policy "assignment_learners_read_staff_or_family" on assignment_learners for select to authenticated
using (public.can_manage_class(class_id) or public.can_read_assignment(assignment_id,student_id));
create policy "assignment_receipts_private" on assignment_write_receipts for select to authenticated using(false);
grant select on assignments,assignment_learners to authenticated;
revoke truncate on assignments,assignment_learners,assignment_write_receipts from public,anon,authenticated;

create function public.manage_assignment(
  p_action text,p_assignment uuid,p_class uuid,p_expected_revision integer,p_request uuid,p_content jsonb
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_actor uuid:=auth.uid(); v_role text; v_center uuid; v_class_center uuid;
  v_assignment assignments%rowtype; v_link class_course_assignments%rowtype;
  v_receipt assignment_write_receipts%rowtype; v_payload jsonb; v_result jsonb;
  v_lesson course_lessons%rowtype; v_title text; v_objective text; v_due timestamptz; v_lesson_id uuid;
begin
  select role,center_id into v_role,v_center from users where id=v_actor;
  if v_actor is null or v_role is null or v_role not in ('teacher','admin') then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  if p_action is null or p_action not in ('create','edit','publish','archive') or p_assignment is null or p_request is null or p_expected_revision is null or p_expected_revision<0 then
    raise exception 'Invalid request' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('assignment-request:'||v_actor::text||':'||p_request::text,0));
  if p_action='create' then
    if p_class is null or p_expected_revision<>0 or p_content is null or jsonb_typeof(p_content)<>'object' then
      raise exception 'Invalid assignment' using errcode='22023'; end if;
    perform pg_advisory_xact_lock(hashtextextended('assignment-class:'||p_class::text,0));
    select center_id into v_class_center from classes where id=p_class for update;
    if v_class_center is null or not public.can_manage_class(p_class) then raise exception 'Not authorized' using errcode='42501'; end if;

  else
    perform pg_advisory_xact_lock(hashtextextended('assignment:'||p_assignment::text,0));
    select * into v_assignment from assignments where id=p_assignment for update;
    if v_assignment.id is null or not public.can_manage_class(v_assignment.class_id) then raise exception 'Not authorized' using errcode='42501'; end if;
    if p_class is not null and p_class<>v_assignment.class_id then raise exception 'Invalid class' using errcode='22023'; end if;
  end if;
  v_payload:=jsonb_build_object('action',p_action,'assignment',p_assignment,'class',p_class,'revision',p_expected_revision,'content',p_content);
  select * into v_receipt from assignment_write_receipts where actor_id=v_actor and request_id=p_request;
  if found then
    if v_receipt.payload<>v_payload then raise exception 'Request reused' using errcode='P0002'; end if;
    return v_receipt.result;
  end if;
  if p_action='create' then
    select * into v_link from class_course_assignments where class_id=p_class and ended_at is null for update;
    if v_link.id is null then raise exception 'No active course' using errcode='P0002'; end if;
    perform pg_advisory_xact_lock(hashtextextended('assignment:'||p_assignment::text,0));
    if exists(select 1 from assignments where id=p_assignment) then raise exception 'Assignment already exists' using errcode='P0002'; end if;
  elsif p_action in ('edit','publish') then
    perform 1 from class_course_assignments where id=v_assignment.course_assignment_id and ended_at is null for share;
    if not found then raise exception 'Class course changed' using errcode='P0002'; end if;
  end if;
  if p_action in ('create','edit') then
    if p_content is null or jsonb_typeof(p_content)<>'object' then raise exception 'Invalid content' using errcode='22023'; end if;
    if jsonb_typeof(p_content->'title') is distinct from 'string' or jsonb_typeof(p_content->'brief') is distinct from 'string'
      or not (p_content ? 'dueAt') or not (p_content ? 'courseLessonId') or exists(select 1 from jsonb_object_keys(p_content) k where k not in ('title','brief','dueAt','courseLessonId'))
      or (p_content ? 'dueAt' and jsonb_typeof(p_content->'dueAt') not in ('string','null'))
      or jsonb_typeof(p_content->'courseLessonId') not in ('string','null') then
      raise exception 'Invalid content' using errcode='22023';
    end if;
    if length(btrim(p_content->>'title')) not between 1 and 200 or length(p_content->>'brief')>20000 then
      raise exception 'Invalid content' using errcode='22023';
    end if;
    v_lesson_id:=nullif(p_content->>'courseLessonId','')::uuid;
    if p_content->>'dueAt' is not null then v_due:=(p_content->>'dueAt')::timestamptz; else v_due:=null; end if;
    if p_action='create' then
      if v_lesson_id is not null then
        perform 1 from course_lessons where id=v_lesson_id and course_id=v_link.course_id and archived_at is null for share;
        if not found then raise exception 'Course lesson unavailable' using errcode='22023'; end if;
      end if;
      insert into assignments(id,class_id,center_id,course_assignment_id,course_id,course_lesson_id,title,brief,due_at,created_by,updated_by)
        values(p_assignment,p_class,v_link.center_id,v_link.id,v_link.course_id,v_lesson_id,p_content->>'title',p_content->>'brief',v_due,v_actor,v_actor);
      v_result:=jsonb_build_object('id',p_assignment,'revision',1,'status','draft');
    else
      if v_assignment.status<>'draft' then raise exception 'Published assignment is immutable' using errcode='P0002'; end if;
      if v_assignment.revision<>p_expected_revision then raise exception 'Stale revision' using errcode='P0002'; end if;
      if not exists(select 1 from class_course_assignments ca where ca.id=v_assignment.course_assignment_id and ca.ended_at is null) then
        raise exception 'Class course changed' using errcode='P0002'; end if;
      if v_lesson_id is not null then
        perform 1 from course_lessons where id=v_lesson_id and course_id=v_assignment.course_id and archived_at is null for share;
        if not found then raise exception 'Course lesson unavailable' using errcode='22023'; end if;
      end if;
      update assignments set course_lesson_id=v_lesson_id,title=p_content->>'title',brief=p_content->>'brief',due_at=v_due,
        revision=revision+1,updated_by=v_actor,updated_at=now() where id=p_assignment returning * into v_assignment;
      v_result:=jsonb_build_object('id',p_assignment,'revision',v_assignment.revision,'status',v_assignment.status);
    end if;
  elsif p_action='publish' then
    if p_content is not null then raise exception 'Invalid content' using errcode='22023'; end if;
    if v_assignment.status<>'draft' or v_assignment.revision<>p_expected_revision then raise exception 'Stale or non-draft assignment' using errcode='P0002'; end if;
    if not exists(select 1 from class_course_assignments ca where ca.id=v_assignment.course_assignment_id and ca.ended_at is null) then
      raise exception 'Class course changed' using errcode='P0002'; end if;
    if v_assignment.course_lesson_id is not null then
      select * into v_lesson from course_lessons where id=v_assignment.course_lesson_id and course_id=v_assignment.course_id and archived_at is null for share;
      if v_lesson.id is null then raise exception 'Course lesson unavailable' using errcode='P0002'; end if;
      v_title:=v_lesson.title; v_objective:=v_lesson.objective;
    end if;
    update assignments set status='published',published_at=now(),lesson_title_snapshot=v_title,
      lesson_objective_snapshot=v_objective,revision=revision+1,updated_by=v_actor,updated_at=now()
      where id=p_assignment returning * into v_assignment;
    insert into assignment_learners(assignment_id,class_id,center_id,student_id)
      select p_assignment,e.class_id,c.center_id,s.id from enrollments e join classes c on c.id=e.class_id
      join students s on s.id=e.student_id and s.center_id=c.center_id
      where e.class_id=v_assignment.class_id on conflict(assignment_id,student_id) do nothing;
    v_result:=jsonb_build_object('id',p_assignment,'revision',v_assignment.revision,'status','published',
      'learnerCount',(select count(*) from assignment_learners where assignment_id=p_assignment));
  else
    if p_content is not null then raise exception 'Invalid content' using errcode='22023'; end if;
    if v_assignment.status='archived' or v_assignment.revision<>p_expected_revision then raise exception 'Stale assignment' using errcode='P0002'; end if;
    update assignments set status='archived',revision=revision+1,updated_by=v_actor,updated_at=now()
      where id=p_assignment returning * into v_assignment;
    update assignment_learners set submission_open=false where assignment_id=p_assignment;
    v_result:=jsonb_build_object('id',p_assignment,'revision',v_assignment.revision,'status','archived');
  end if;
  insert into assignment_write_receipts(actor_id,request_id,payload,result) values(v_actor,p_request,v_payload,v_result);
  return v_result;
end;
$$;
revoke all on function public.manage_assignment(text,uuid,uuid,integer,uuid,jsonb) from public,anon;
grant execute on function public.manage_assignment(text,uuid,uuid,integer,uuid,jsonb) to authenticated;
commit;
