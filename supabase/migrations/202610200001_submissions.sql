begin;

-- ASCII/punycode hostnames, optional valid TCP port, no credentials or backslashes.
create function public.valid_submission_url(p_url text) returns boolean
language sql immutable set search_path=public,pg_temp as $$
  select coalesce(length(p_url) between 1 and 2048
    and p_url !~ '[[:space:]]'
    and p_url ~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]{1,5})?([/?#][^[:space:]\\]*)?$'
    and coalesce(substring(p_url from '^https://[^/?#:]+:([0-9]+)')::integer between 1 and 65535,true),false)
$$;

create table submission_threads (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null,
  student_id uuid not null,
  next_version integer not null default 1 check (next_version > 0),
  unique (assignment_id,student_id),
  foreign key (assignment_id,student_id) references assignment_learners(assignment_id,student_id)
);
create table submission_versions (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references submission_threads(id),
  version integer not null check (version > 0),
  project_url text not null check (public.valid_submission_url(project_url)),
  reflection text not null check (length(btrim(reflection,E' \t\r\n')) between 1 and 10000),
  submitted_by uuid not null references users(id),
  submitted_role text not null check (submitted_role in ('parent','teacher','admin')),
  submitted_at timestamptz not null default clock_timestamp(),
  is_late boolean not null,
  request_id uuid not null,
  unique (thread_id,version),
  unique (submitted_by,request_id)
);
create table submission_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submission_versions(id),
  sequence integer not null check (sequence > 0),
  outcome text not null check (outcome in ('revision','approved')),
  feedback text not null check (length(btrim(feedback,E' \t\r\n')) between 1 and 10000),
  reviewed_by uuid not null references users(id),
  reviewed_at timestamptz not null default clock_timestamp(),
  supersedes_id uuid,
  request_id uuid not null,
  unique (submission_id,sequence),
  unique (id,submission_id),
  foreign key (supersedes_id,submission_id) references submission_reviews(id,submission_id),
  unique (reviewed_by,request_id)
);
create table submission_write_receipts (
  actor_id uuid not null references users(id),
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  primary key (actor_id,request_id)
);

create function public.can_read_submission_thread(p_thread uuid) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from submission_threads t join assignments a on a.id=t.assignment_id
    where t.id=p_thread and (public.can_manage_class(a.class_id)
      or public.can_read_assignment(a.id,t.student_id)))
$$;
alter table submission_threads enable row level security;
alter table submission_versions enable row level security;
alter table submission_reviews enable row level security;
alter table submission_write_receipts enable row level security;
create policy "submission_threads_read" on submission_threads for select to authenticated
  using(public.can_read_submission_thread(id));
create policy "submission_versions_read" on submission_versions for select to authenticated
  using(public.can_read_submission_thread(thread_id));
create policy "submission_reviews_read" on submission_reviews for select to authenticated
  using(exists(select 1 from submission_versions v where v.id=submission_id));
create policy "submission_receipts_private" on submission_write_receipts for select to authenticated using(false);
grant select on submission_threads,submission_versions,submission_reviews to authenticated;
revoke truncate on submission_threads,submission_versions,submission_reviews,submission_write_receipts from public,anon,authenticated;

-- Re-enrollment does not silently reopen previously closed learner snapshots.
create function public.close_removed_learner_submissions() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if tg_op='DELETE' or old.class_id is distinct from new.class_id or old.student_id is distinct from new.student_id then
    update assignment_learners set submission_open=false
      where class_id=old.class_id and student_id=old.student_id and submission_open;
  end if;
  return null;
end;
$$;
create trigger enrollment_closes_submissions after delete or update of class_id,student_id on enrollments
  for each row execute function public.close_removed_learner_submissions();

-- Close already-unenrolled snapshots at migration cutover too.
update assignment_learners al set submission_open=false
  where al.submission_open and not exists(select 1 from enrollments e
    where e.class_id=al.class_id and e.student_id=al.student_id);

create function public.submit_assignment(
  p_assignment uuid,p_student uuid,p_request uuid,p_url text,p_reflection text
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_actor uuid:=auth.uid(); v_role text; v_assignment assignments%rowtype;
  v_thread submission_threads%rowtype; v_learner assignment_learners%rowtype;
  v_receipt submission_write_receipts%rowtype; v_payload jsonb; v_result jsonb;
  v_id uuid; v_time timestamptz;
begin
  select role into v_role from users where id=v_actor;
  if v_actor is null or v_role is null or v_role not in ('parent','teacher','admin') then
    raise exception 'Not authorized' using errcode='42501'; end if;
  if p_assignment is null or p_student is null or p_request is null or not public.valid_submission_url(p_url)
    or p_reflection is null or length(btrim(p_reflection,E' \t\r\n')) not between 1 and 10000 then
    raise exception 'Invalid submission' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('submission-request:'||v_actor::text||':'||p_request::text,0));
  select * into v_assignment from assignments where id=p_assignment for share;
  if v_assignment.id is null or not (public.can_manage_class(v_assignment.class_id)
    or public.can_read_assignment(p_assignment,p_student)) then
    raise exception 'Not authorized' using errcode='42501'; end if;
  if not exists(select 1 from assignment_learners where assignment_id=p_assignment and student_id=p_student) then
    raise exception 'Learner unavailable' using errcode='42501'; end if;
  v_payload:=jsonb_build_object('action','submit','assignment',p_assignment,'student',p_student,'url',p_url,'reflection',p_reflection);
  select * into v_receipt from submission_write_receipts where actor_id=v_actor and request_id=p_request;
  if found then
    if v_receipt.payload<>v_payload then raise exception 'Request reused' using errcode='P0002'; end if;
    return v_receipt.result;
  end if;
  if v_assignment.status<>'published' then raise exception 'Assignment closed' using errcode='P0002'; end if;
  -- Lock enrollment before learner, matching the deletion trigger's lock order.
  perform 1 from enrollments where class_id=v_assignment.class_id and student_id=p_student for share;
  if not found then raise exception 'Learner no longer enrolled' using errcode='P0002'; end if;
  select * into v_learner from assignment_learners where assignment_id=p_assignment and student_id=p_student for update;
  if not v_learner.submission_open then raise exception 'Submissions closed' using errcode='P0002'; end if;
  insert into submission_threads(assignment_id,student_id) values(p_assignment,p_student)
    on conflict(assignment_id,student_id) do nothing;
  select * into v_thread from submission_threads where assignment_id=p_assignment and student_id=p_student for update;
  v_time:=clock_timestamp();
  insert into submission_versions(thread_id,version,project_url,reflection,submitted_by,submitted_role,submitted_at,is_late,request_id)
    values(v_thread.id,v_thread.next_version,p_url,p_reflection,v_actor,v_role,v_time,
      coalesce(v_time>v_assignment.due_at,false),p_request) returning id into v_id;
  update submission_threads set next_version=next_version+1 where id=v_thread.id;
  v_result:=jsonb_build_object('id',v_id,'threadId',v_thread.id,'version',v_thread.next_version,
    'status','submitted','isLate',coalesce(v_time>v_assignment.due_at,false));
  insert into submission_write_receipts values(v_actor,p_request,v_payload,v_result);
  return v_result;
end;
$$;

create function public.review_submission(
  p_submission uuid,p_expected_version integer,p_expected_review uuid,
  p_request uuid,p_outcome text,p_feedback text
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_actor uuid:=auth.uid(); v_role text; v_version submission_versions%rowtype;
  v_thread submission_threads%rowtype; v_assignment assignments%rowtype;
  v_review submission_reviews%rowtype; v_receipt submission_write_receipts%rowtype;
  v_payload jsonb; v_result jsonb; v_id uuid;
begin
  select role into v_role from users where id=v_actor;
  if v_actor is null or v_role is null or v_role not in ('teacher','admin') then
    raise exception 'Not authorized' using errcode='42501'; end if;
  if p_submission is null or p_request is null or p_expected_version is null or p_expected_version<1
    or p_outcome is null or p_outcome not in ('revision','approved')
    or p_feedback is null or length(btrim(p_feedback,E' \t\r\n')) not between 1 and 10000 then
    raise exception 'Invalid review' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('submission-request:'||v_actor::text||':'||p_request::text,0));
  select * into v_version from submission_versions where id=p_submission;
  select * into v_thread from submission_threads where id=v_version.thread_id;
  select * into v_assignment from assignments where id=v_thread.assignment_id for share;
  if v_assignment.id is null or not public.can_manage_class(v_assignment.class_id) then
    raise exception 'Not authorized' using errcode='42501'; end if;
  v_payload:=jsonb_build_object('action','review','submission',p_submission,'version',p_expected_version,
    'previousReview',p_expected_review,'outcome',p_outcome,'feedback',p_feedback);
  select * into v_receipt from submission_write_receipts where actor_id=v_actor and request_id=p_request;
  if found then
    if v_receipt.payload<>v_payload then raise exception 'Request reused' using errcode='P0002'; end if;
    return v_receipt.result;
  end if;
  if v_assignment.status<>'published' then raise exception 'Assignment closed' using errcode='P0002'; end if;
  select * into v_thread from submission_threads where id=v_version.thread_id for update;
  if v_version.version<>p_expected_version or v_thread.next_version-1<>p_expected_version then
    raise exception 'Newer submission exists' using errcode='P0002'; end if;
  select * into v_review from submission_reviews where submission_id=p_submission order by sequence desc limit 1;
  if v_review.id is distinct from p_expected_review then raise exception 'Review changed' using errcode='P0002'; end if;
  insert into submission_reviews(submission_id,sequence,outcome,feedback,reviewed_by,supersedes_id,request_id)
    values(p_submission,coalesce(v_review.sequence,0)+1,p_outcome,p_feedback,v_actor,v_review.id,p_request) returning id into v_id;
  v_result:=jsonb_build_object('id',v_id,'submissionId',p_submission,'sequence',coalesce(v_review.sequence,0)+1,'status',p_outcome);
  insert into submission_write_receipts values(v_actor,p_request,v_payload,v_result);
  return v_result;
end;
$$;

revoke all on function public.can_read_submission_thread(uuid),public.close_removed_learner_submissions(),
  public.submit_assignment(uuid,uuid,uuid,text,text),public.review_submission(uuid,integer,uuid,uuid,text,text) from public,anon;
revoke all on function public.close_removed_learner_submissions() from authenticated;
grant execute on function public.can_read_submission_thread(uuid),
  public.submit_assignment(uuid,uuid,uuid,text,text),public.review_submission(uuid,integer,uuid,uuid,text,text) to authenticated;
commit;
