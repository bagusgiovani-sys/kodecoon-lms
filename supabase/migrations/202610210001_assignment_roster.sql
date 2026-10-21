begin;

alter table assignment_learners add column revision integer not null default 1 check (revision > 0);

-- Automatic enrollment closure and assignment archive must invalidate stale edits too.
create function public.bump_assignment_learner_revision() returns trigger
language plpgsql set search_path=public,pg_temp as $$
begin
  if new.submission_open is distinct from old.submission_open then
    new.revision:=old.revision+1;
  end if;
  return new;
end;
$$;
create trigger assignment_learner_revision before update on assignment_learners
  for each row execute function public.bump_assignment_learner_revision();
revoke all on function public.bump_assignment_learner_revision() from public,anon,authenticated;

create function public.set_assignment_learner(
  p_assignment uuid,p_student uuid,p_open boolean,p_expected_revision integer,p_request uuid
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_actor uuid:=auth.uid(); v_assignment assignments%rowtype;
  v_learner assignment_learners%rowtype; v_receipt assignment_write_receipts%rowtype;
  v_payload jsonb; v_result jsonb; v_enrolled boolean;
begin
  if v_actor is null then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_assignment is null or p_student is null or p_open is null or p_request is null
    or p_expected_revision is null or p_expected_revision<0 then
    raise exception 'Invalid roster request' using errcode='22023'; end if;
  -- Share the assignment receipt namespace and retry lock with other assignment writes.
  perform pg_advisory_xact_lock(hashtextextended('assignment-request:'||v_actor::text||':'||p_request::text,0));
  select * into v_assignment from assignments where id=p_assignment for share;
  if v_assignment.id is null or not public.can_manage_class(v_assignment.class_id) then
    raise exception 'Not authorized' using errcode='42501'; end if;
  v_payload:=jsonb_build_object('action','roster','assignment',p_assignment,'student',p_student,
    'open',p_open,'revision',p_expected_revision);
  select * into v_receipt from assignment_write_receipts where actor_id=v_actor and request_id=p_request;
  if found then
    if v_receipt.payload<>v_payload then raise exception 'Request reused' using errcode='P0002'; end if;
    return v_receipt.result;
  end if;
  if v_assignment.status<>'published' then raise exception 'Assignment not published' using errcode='P0002'; end if;
  -- Same order as submission and enrollment deletion: enrollment, then learner.
  perform 1 from enrollments where class_id=v_assignment.class_id and student_id=p_student for share;
  v_enrolled:=found;
  if p_open and not v_enrolled then raise exception 'Learner not enrolled' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('assignment-learner:'||p_assignment::text||':'||p_student::text,0));
  select * into v_learner from assignment_learners where assignment_id=p_assignment and student_id=p_student for update;
  if not found then
    if not p_open or p_expected_revision<>0 then raise exception 'Learner changed' using errcode='P0002'; end if;
    -- Enrollment alone does not establish center consistency in legacy data.
    perform 1 from students where id=p_student and center_id=v_assignment.center_id for share;
    if not found then raise exception 'Learner unavailable' using errcode='22023'; end if;
    insert into assignment_learners(assignment_id,class_id,center_id,student_id)
      values(p_assignment,v_assignment.class_id,v_assignment.center_id,p_student) returning * into v_learner;
  else
    if v_learner.revision<>p_expected_revision then raise exception 'Learner changed' using errcode='P0002'; end if;
    update assignment_learners set submission_open=p_open
      where assignment_id=p_assignment and student_id=p_student returning * into v_learner;
  end if;
  v_result:=jsonb_build_object('assignmentId',p_assignment,'studentId',p_student,
    'submissionOpen',v_learner.submission_open,'revision',v_learner.revision);
  insert into assignment_write_receipts(actor_id,request_id,payload,result) values(v_actor,p_request,v_payload,v_result);
  return v_result;
end;
$$;
revoke all on function public.set_assignment_learner(uuid,uuid,boolean,integer,uuid) from public,anon;
grant execute on function public.set_assignment_learner(uuid,uuid,boolean,integer,uuid) to authenticated;
commit;
