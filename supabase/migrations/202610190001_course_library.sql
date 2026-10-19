begin;

-- Reusable courses do not change existing class lessons or learner progress.
alter table users add constraint users_id_center_unique unique (id, center_id);
create table courses (
  id uuid primary key,
  center_id uuid not null references centers(id),
  owner_id uuid not null,
  title text not null check (length(btrim(title)) between 1 and 200),
  category text not null check (length(category) <= 100),
  age_range text not null check (length(age_range) <= 100),
  level text not null check (length(level) <= 100),
  description text not null check (length(description) <= 10000),
  prerequisites text not null check (length(prerequisites) <= 10000),
  revision integer not null default 1 check (revision > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (owner_id, center_id) references users(id, center_id)
);
create index courses_center_id_idx on courses(center_id, id);

create table course_lessons (
  id uuid primary key,
  course_id uuid not null references courses(id),
  sequence integer not null check (sequence between 1 and 10000),
  title text not null check (length(btrim(title)) between 1 and 200),
  minutes integer not null check (minutes between 1 and 1440),
  objective text not null check (length(objective) <= 10000),
  materials text not null check (length(materials) <= 10000),
  steps text not null check (length(steps) <= 20000),
  evidence text not null check (length(evidence) <= 10000),
  revision integer not null default 1 check (revision > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, sequence)
);

create table course_write_receipts (
  actor_id uuid not null references users(id),
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, request_id)
);
alter table courses enable row level security;
alter table course_lessons enable row level security;
alter table course_write_receipts enable row level security;
create policy "courses_read_staff" on courses for select to authenticated
  using (center_id = public.current_user_center() and public.current_user_role() in ('teacher','admin'));
create policy "course_lessons_read_staff" on course_lessons for select to authenticated
  using (exists (select 1 from courses c where c.id = course_id));
create policy "course_receipts_private" on course_write_receipts for select to authenticated using (false);
-- No client mutation policies; receipts remain private to the RPC.

-- Full content replacement with optimistic revisions. Revision 0 creates a row.
-- The course lock also serializes lesson edits against course archiving.
create function public.save_course_content(
  p_course uuid, p_lesson uuid, p_expected_revision integer,
  p_request uuid, p_content jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_center uuid;
  v_course courses%rowtype;
  v_lesson course_lessons%rowtype;
  v_receipt course_write_receipts%rowtype;
  v_payload jsonb;
  v_result jsonb;
  v_fields text[];
  v_key text;
  v_revision integer;
  v_archived timestamptz;
begin
  select role, center_id into v_role, v_center from users where id = v_actor;
  if v_actor is null or v_center is null or v_role not in ('teacher','admin') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_course is null or p_request is null or p_expected_revision is null or p_expected_revision < 0
     or p_content is null or jsonb_typeof(p_content) <> 'object' then
    raise exception 'Invalid content' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('course-request:' || v_actor::text || ':' || p_request::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('course:' || p_course::text, 0));
  select * into v_course from courses where id = p_course for update;
  if v_course.id is not null and (v_course.center_id <> v_center or (v_role <> 'admin' and v_course.owner_id <> v_actor)) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if v_course.id is null and (p_lesson is not null or p_expected_revision <> 0) then
    raise exception 'Not found' using errcode = '42501';
  end if;
  v_payload := jsonb_build_object('course',p_course,'lesson',p_lesson,'revision',p_expected_revision,'content',p_content);
  select * into v_receipt from course_write_receipts where actor_id = v_actor and request_id = p_request;
  if found then
    if v_receipt.payload <> v_payload then
      raise exception 'Request reused' using errcode = 'P0002';
    end if;
    return v_receipt.result;
  end if;
  v_fields := case when p_lesson is null
    then array['title','category','age_range','level','description','prerequisites']
    else array['title','objective','materials','steps','evidence'] end;
  foreach v_key in array v_fields loop
    if jsonb_typeof(p_content->v_key) is distinct from 'string' then
      raise exception 'Invalid text field' using errcode = '22023';
    end if;
  end loop;
  v_fields := v_fields || array['archived'];
  if p_lesson is not null then
    v_fields := v_fields || array['sequence','minutes'];
    if jsonb_typeof(p_content->'sequence') is distinct from 'number'
       or jsonb_typeof(p_content->'minutes') is distinct from 'number'
       or (p_content->>'sequence') !~ '^[0-9]+$' or (p_content->>'minutes') !~ '^[0-9]+$' then
      raise exception 'Invalid lesson numbers' using errcode = '22023';
    end if;
  end if;
  if jsonb_typeof(p_content->'archived') is distinct from 'boolean'
     or exists (select 1 from jsonb_object_keys(p_content) k where not (k = any(v_fields))) then
    raise exception 'Invalid fields' using errcode = '22023';
  end if;
  if p_lesson is null then
    v_revision := coalesce(v_course.revision, 0);
    v_archived := v_course.archived_at;
  else
    if v_course.archived_at is not null then
      raise exception 'Restore course before editing lessons' using errcode = 'P0002';
    end if;
    -- Also lock absent lesson IDs: two courses must not concurrently create the
    -- same lesson ID and reach an UPSERT against another course's content.
    perform pg_advisory_xact_lock(hashtextextended('course-lesson:' || p_lesson::text, 0));
    -- Also lock absent lesson IDs: two courses must not concurrently create the
    -- same lesson ID and reach an UPSERT against another course's content.
    perform pg_advisory_xact_lock(hashtextextended('course-lesson:' || p_lesson::text, 0));
    select * into v_lesson from course_lessons where id = p_lesson for update;
    if v_lesson.id is not null and v_lesson.course_id <> p_course then
      raise exception 'Not authorized' using errcode = '42501';
    end if;
    v_revision := coalesce(v_lesson.revision, 0);
    v_archived := v_lesson.archived_at;
  end if;
  if v_revision <> p_expected_revision then
    raise exception 'Stale revision' using errcode = 'P0002';
  end if;
  v_archived := case when (p_content->>'archived')::boolean then coalesce(v_archived, now()) else null end;
  if p_lesson is null then
    insert into courses(id,center_id,owner_id,title,category,age_range,level,description,prerequisites,archived_at)
    values(p_course,v_center,v_actor,p_content->>'title',p_content->>'category',p_content->>'age_range',
      p_content->>'level',p_content->>'description',p_content->>'prerequisites',v_archived)
    on conflict(id) do update set title=excluded.title, category=excluded.category, age_range=excluded.age_range,
      level=excluded.level, description=excluded.description, prerequisites=excluded.prerequisites,
      archived_at=excluded.archived_at, revision=courses.revision+1, updated_at=now();
  else
    insert into course_lessons(id,course_id,sequence,title,minutes,objective,materials,steps,evidence,archived_at)
    values(p_lesson,p_course,(p_content->>'sequence')::integer,p_content->>'title',(p_content->>'minutes')::integer,
      p_content->>'objective',p_content->>'materials',p_content->>'steps',p_content->>'evidence',v_archived)
    on conflict(id) do update set sequence=excluded.sequence,title=excluded.title,minutes=excluded.minutes,
      objective=excluded.objective,materials=excluded.materials,steps=excluded.steps,evidence=excluded.evidence,
      archived_at=excluded.archived_at, revision=course_lessons.revision+1,updated_at=now();
  end if;
  v_result := jsonb_build_object('id',coalesce(p_lesson,p_course),'revision',v_revision+1);
  insert into course_write_receipts(actor_id,request_id,payload,result) values(v_actor,p_request,v_payload,v_result);
  return v_result;
end;
$$;
revoke all on function public.save_course_content(uuid,uuid,integer,uuid,jsonb) from public,anon;
grant execute on function public.save_course_content(uuid,uuid,integer,uuid,jsonb) to authenticated;
grant select on courses,course_lessons to authenticated;
-- TRUNCATE bypasses RLS; Supabase bootstrap privileges must not permit it.
revoke truncate on courses,course_lessons,course_write_receipts from public,anon,authenticated;
commit;
