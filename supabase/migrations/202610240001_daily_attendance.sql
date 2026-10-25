-- Fresh installs include this in schema.sql. Existing databases apply once.
begin;
create or replace function public.log_session_credits(
  p_session_id uuid, p_notes text, p_attendance jsonb, p_lesson_completions jsonb,
  p_request uuid, p_expected_revision integer
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_session public.sessions; v_payload jsonb; v_receipt public.credit_operations;
  a record; v_charged boolean; v_delta integer; v_balance integer; v_result jsonb;
begin
  if auth.uid() is null or p_request is null or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Invalid request identity or revision' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || p_request::text, 0));
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found or not exists (select 1 from public.users u join public.classes c on c.center_id = u.center_id
    where u.id = auth.uid() and c.id = v_session.class_id and
      (u.role = 'admin' or (u.role = 'teacher' and c.teacher_id = u.id and v_session.teacher_id = u.id))) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  v_payload := jsonb_build_object('operation','log','session',p_session_id,'notes',p_notes,
    'attendance',p_attendance,'lessons',p_lesson_completions,'revision',p_expected_revision);
  select * into v_receipt from public.credit_operations where actor_id = auth.uid() and request_id = p_request;
  if found then
    if v_receipt.payload <> v_payload then raise exception 'Request ID already used for different data' using errcode = 'P0002'; end if;
    return v_receipt.result;
  end if;
  if v_session.revision <> p_expected_revision then raise exception 'Session changed. Reload before saving.' using errcode = 'P0002'; end if;
  if jsonb_typeof(p_attendance) is distinct from 'array' or jsonb_typeof(p_lesson_completions) is distinct from 'array'
    or length(coalesce(p_notes,'')) > 10000 then
    raise exception 'Invalid session payload' using errcode = '22023';
  end if;
  if jsonb_array_length(p_attendance) > 500 or jsonb_array_length(p_lesson_completions) > 5000 then
    raise exception 'Session payload too large' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_attendance) as x("studentId" uuid,status text)
    left join public.students s on s.id = x."studentId"
    join public.classes c on c.id = v_session.class_id
    where s.id is null or s.center_id <> c.center_id or x.status is null or x.status not in ('present','mia','excused','absent','unmarked')
    or (not exists (select 1 from public.enrollments e where e.student_id = x."studentId" and e.class_id = c.id)
      and not (x.status in ('absent','excused','unmarked') and exists (select 1 from public.session_credit_state sc
        where sc.session_id = p_session_id and sc.student_id = x."studentId" and sc.charged))))
    or exists (select 1 from jsonb_to_recordset(p_attendance) as x("studentId" uuid)
      group by x."studentId" having count(*) > 1) then
    raise exception 'Invalid attendance scope' using errcode = '42501';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_lesson_completions) as x("studentId" uuid,"lessonId" uuid)
    left join public.enrollments e on e.student_id = x."studentId" and e.class_id = v_session.class_id
    left join public.lessons l on l.id = x."lessonId" and l.class_id = v_session.class_id
    left join public.students s on s.id = x."studentId"
    join public.classes c on c.id = v_session.class_id
    where e.id is null or l.id is null or s.center_id <> c.center_id
    or coalesce((select mark.status from jsonb_to_recordset(p_attendance) as mark("studentId" uuid,status text) where mark."studentId"=x."studentId"),
      (select mark.status from attendance mark where mark.session_id=p_session_id and mark.student_id=x."studentId"),'unmarked') <> 'present')
    or exists (select 1 from jsonb_to_recordset(p_lesson_completions) as x("studentId" uuid,"lessonId" uuid)
      group by x."studentId", x."lessonId" having count(*) > 1) then
    raise exception 'Invalid lesson scope' using errcode = '42501';
  end if;
  if v_session.credit_billable then
    -- Stable ordering prevents two class logs from locking shared learners in reverse order.
    for a in select * from jsonb_to_recordset(p_attendance) as x("studentId" uuid,status text) order by x."studentId" loop
      insert into public.credit_accounts(student_id) values(a."studentId") on conflict do nothing;
      select balance into v_balance from public.credit_accounts where student_id = a."studentId" for update;
      select charged into v_charged from public.session_credit_state where session_id = p_session_id and student_id = a."studentId";
      v_delta := coalesce(v_charged,false)::integer - (a.status in ('present','mia'))::integer;
      if v_balance::bigint + v_delta < 0 or v_balance::bigint + v_delta > 2147483647 then
        raise exception 'Credit balance would be out of range' using errcode = 'P0001';
      end if;
      if v_delta <> 0 then
        update public.credit_accounts set balance = balance + v_delta, revision = revision + 1 where student_id = a."studentId";
        insert into public.credit_entries(student_id,amount,kind,reason,actor_id,request_id,session_id,effective_date)
          values(a."studentId",v_delta,case when v_delta < 0 then 'attendance_charge' else 'attendance_refund' end,
            case when v_delta < 0 then 'Session attendance' else 'Attendance correction' end,
            auth.uid(),p_request,p_session_id,v_session.session_date);
      end if;
      insert into public.session_credit_state(session_id,student_id,charged) values(p_session_id,a."studentId",a.status in ('present','mia'))
        on conflict(session_id,student_id) do update set charged = excluded.charged;
    end loop;
  end if;
  update public.sessions set status = 'completed', notes = p_notes, revision = revision + 1, updated_at = now() where id = p_session_id;
  insert into public.attendance(session_id,student_id,status)
    select p_session_id,x."studentId",x.status from jsonb_to_recordset(p_attendance) as x("studentId" uuid,status text)
    on conflict(session_id,student_id) do update set status = excluded.status;
  insert into public.student_lesson_progress(student_id,lesson_id,status,session_id,completed_date,updated_at)
    select x."studentId",x."lessonId",'completed',p_session_id,(now() at time zone 'Asia/Jakarta')::date,now()
    from jsonb_to_recordset(p_lesson_completions) as x("studentId" uuid,"lessonId" uuid)
    on conflict(student_id,lesson_id) do update set status = 'completed',session_id = excluded.session_id,
      completed_date = excluded.completed_date,updated_at = excluded.updated_at;
  v_result := jsonb_build_object('revision',v_session.revision + 1);
  insert into public.credit_operations(actor_id,request_id,payload,result) values(auth.uid(),p_request,v_payload,v_result);
  return v_result;
end;
$$;

create function public.can_manage_daily_class(p_class uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from classes c join users u on u.center_id=c.center_id
   where c.id=p_class and u.id=auth.uid() and (u.role='admin' or (u.role='teacher' and c.teacher_id=u.id)))
$$;
revoke all on function public.can_manage_daily_class(uuid) from public,anon;
grant execute on function public.can_manage_daily_class(uuid) to authenticated;

create table public.weekly_class_slots (
 id uuid primary key, class_id uuid not null references classes(id),
 weekday integer not null check(weekday between 0 and 6), start_time time not null,
 starts_on date not null, created_by uuid not null references users(id),
 unique(class_id,weekday,start_time,starts_on)
);
create table public.weekly_slot_members (
 id uuid primary key default gen_random_uuid(), slot_id uuid not null references weekly_class_slots(id),
 student_id uuid not null references students(id), starts_on date not null, ends_on date,
 check(ends_on is null or ends_on>=starts_on)
);
alter table weekly_class_slots enable row level security;
alter table weekly_slot_members enable row level security;
create policy weekly_slots_rpc_only on weekly_class_slots for all using (false) with check (false);
create policy weekly_members_rpc_only on weekly_slot_members for all using (false) with check (false);
revoke all on weekly_class_slots,weekly_slot_members from public,anon,authenticated;
alter table sessions add column weekly_slot_id uuid references weekly_class_slots(id);
create unique index sessions_weekly_slot_date on sessions(weekly_slot_id,session_date) where weekly_slot_id is not null;

create function public.daily_attendance_workspace(p_date date) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare v_center uuid;
begin
 select center_id into v_center from users where id=auth.uid() and role in ('teacher','admin');
 if v_center is null then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_date is null then raise exception 'Choose a date' using errcode='22023'; end if;
 return jsonb_build_object(
  'centers',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name)),'[]') from centers where id=v_center),
  'classes',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'centerId',center_id)),'[]') from classes where can_manage_daily_class(id)),
  'students',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'credits',case when can_read_credits(s.id) then coalesce(ca.balance,0) else null end) order by s.name),'[]') from students s left join credit_accounts ca on ca.student_id=s.id where s.center_id=v_center),
  'enrollments',(select coalesce(jsonb_agg(jsonb_build_object('classId',class_id,'studentId',student_id)),'[]') from enrollments where can_manage_daily_class(class_id) and enrolled_date<=p_date),
  'slots',(select coalesce(jsonb_agg(jsonb_build_object('id',ws.id,'classId',ws.class_id,'weekday',weekday,'time',start_time,'start',starts_on,
    'members',(select coalesce(jsonb_agg(jsonb_build_object('studentId',student_id,'start',starts_on,'end',ends_on)),'[]') from weekly_slot_members where slot_id=ws.id))),'[]') from weekly_class_slots ws where can_manage_daily_class(class_id)),
  'sessions',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'classId',s.class_id,'slotId',s.weekly_slot_id,'date',session_date,'time',session_time,'revision',revision,'notes',notes,
    'attendance',(select coalesce(jsonb_object_agg(student_id,status),'{}') from attendance where session_id=s.id))),'[]') from sessions s where session_date=p_date and can_manage_daily_class(class_id))
 );
end $$;

create function public.change_daily_attendance(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_slot weekly_class_slots; v_session sessions; v_student uuid; v_date date; v_result jsonb; v_status text;
begin
 if auth.uid() is null then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_action='create_slot' then
  if not can_manage_daily_class((p_data->>'classId')::uuid) then raise exception 'Not authorized' using errcode='42501'; end if;
  insert into weekly_class_slots(id,class_id,weekday,start_time,starts_on,created_by)
   values((p_data->>'id')::uuid,(p_data->>'classId')::uuid,(p_data->>'weekday')::int,(p_data->>'time')::time,(p_data->>'date')::date,auth.uid())
   on conflict(id) do nothing;
  if not exists(select 1 from weekly_class_slots where id=(p_data->>'id')::uuid and class_id=(p_data->>'classId')::uuid and weekday=(p_data->>'weekday')::int and start_time=(p_data->>'time')::time and starts_on=(p_data->>'date')::date) then raise exception 'Slot request changed' using errcode='P0002'; end if;
  return jsonb_build_object('ok',true);
 elsif p_action='roster' then
  select * into v_slot from weekly_class_slots where id=(p_data->>'slotId')::uuid for update;
  if not found or not can_manage_daily_class(v_slot.class_id) then raise exception 'Not authorized' using errcode='42501'; end if;
  v_student:=(p_data->>'studentId')::uuid; v_date:=(p_data->>'date')::date;
  if v_date is null or v_date<v_slot.starts_on then raise exception 'Choose a date on or after the slot starts' using errcode='22023'; end if;
  if not exists(select 1 from students s join classes c on c.center_id=s.center_id where s.id=v_student and c.id=v_slot.class_id) then raise exception 'Student belongs to another center' using errcode='42501'; end if;
  if (p_data->>'included') is null then raise exception 'Choose roster membership' using errcode='22023'; end if;
  -- A dated edit supersedes later roster changes for this learner.
  delete from weekly_slot_members where slot_id=v_slot.id and student_id=v_student and starts_on>=v_date;
  if (p_data->>'included')::boolean then
   insert into enrollments(student_id,class_id,enrolled_date) values(v_student,v_slot.class_id,v_date) on conflict(student_id,class_id) do nothing;
   if not exists(select 1 from weekly_slot_members where slot_id=v_slot.id and student_id=v_student and starts_on<=v_date and (ends_on is null or ends_on>v_date)) then
    insert into weekly_slot_members(slot_id,student_id,starts_on) values(v_slot.id,v_student,v_date);
   end if;
  else
   update weekly_slot_members set ends_on=v_date where slot_id=v_slot.id and student_id=v_student and starts_on<=v_date and (ends_on is null or ends_on>v_date);
  end if;
  return jsonb_build_object('ok',true);
 elsif p_action='mark' then
  v_date:=(p_data->>'date')::date; v_student:=(p_data->>'studentId')::uuid; v_status:=p_data->>'status';
  if v_status is null or v_status not in ('present','mia','excused','unmarked') then raise exception 'Invalid attendance status' using errcode='22023'; end if;
  if nullif(p_data->>'slotId','') is not null then
   select * into v_slot from weekly_class_slots where id=(p_data->>'slotId')::uuid for update;
   if not found or not can_manage_daily_class(v_slot.class_id) then raise exception 'Not authorized' using errcode='42501'; end if;
   if v_date is null or v_date<v_slot.starts_on or extract(dow from v_date)<>v_slot.weekday then raise exception 'Date does not match weekly slot' using errcode='22023'; end if;
   if not exists(select 1 from weekly_slot_members where slot_id=v_slot.id and student_id=v_student and starts_on<=v_date and (ends_on is null or ends_on>v_date)) and not exists(select 1 from attendance a join sessions s on s.id=a.session_id where s.weekly_slot_id=v_slot.id and s.session_date=v_date and a.student_id=v_student) then raise exception 'Student is not on this roster' using errcode='42501'; end if;
   -- Serialize slot operations and reuse a manually scheduled occurrence.
   if (select count(*) from sessions where class_id=v_slot.class_id and session_date=v_date and session_time=v_slot.start_time and weekly_slot_id is null)>1 then
    raise exception 'Multiple sessions match this slot. Resolve the schedule before marking.' using errcode='P0002';
   end if;
   if not exists(select 1 from sessions where weekly_slot_id=v_slot.id and session_date=v_date) then
    update sessions set weekly_slot_id=v_slot.id where class_id=v_slot.class_id and session_date=v_date and session_time=v_slot.start_time and weekly_slot_id is null;
   end if;
   insert into sessions(class_id,teacher_id,session_date,session_time,weekly_slot_id)
    select c.id,c.teacher_id,v_date,v_slot.start_time,v_slot.id from classes c where c.id=v_slot.class_id
    on conflict(weekly_slot_id,session_date) where weekly_slot_id is not null do nothing;
   select * into v_session from sessions where weekly_slot_id=v_slot.id and session_date=v_date for update;
  else
   select * into v_session from sessions where id=(p_data->>'sessionId')::uuid for update;
   if not found or not can_manage_daily_class(v_session.class_id) then raise exception 'Not authorized' using errcode='42501'; end if;
   if v_session.session_date<>v_date then raise exception 'Session date changed. Reload.' using errcode='P0002'; end if;
  end if;
  v_result:=log_session_credits(v_session.id,v_session.notes,jsonb_build_array(jsonb_build_object('studentId',v_student,'status',v_status)),'[]',
   (p_data->>'requestId')::uuid,(p_data->>'revision')::integer);
  return v_result || jsonb_build_object('sessionId',v_session.id);
 end if;
 raise exception 'Invalid operation' using errcode='22023';
end $$;
revoke all on function public.daily_attendance_workspace(date),public.change_daily_attendance(text,jsonb) from public,anon;
grant execute on function public.daily_attendance_workspace(date),public.change_daily_attendance(text,jsonb) to authenticated;
commit;
