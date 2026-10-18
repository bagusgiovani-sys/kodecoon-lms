-- Apply once, after report publications. Existing sessions are billing-exempt.
begin;
alter table public.sessions add column credit_billable boolean not null default false;
alter table public.sessions alter column credit_billable set default true;
alter table public.sessions add column revision integer not null default 0 check (revision >= 0);

create table public.credit_accounts (
  student_id uuid primary key references public.students(id),
  balance integer not null default 0 check (balance >= 0),
  revision integer not null default 0 check (revision >= 0)
);
create table public.credit_operations (
  actor_id uuid not null references public.users(id),
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, request_id)
);
create table public.credit_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.credit_accounts(student_id),
  amount integer not null check (amount <> 0),
  kind text not null check (kind in ('top_up','adjustment','attendance_charge','attendance_refund')),
  reason text not null check (length(trim(reason)) between 1 and 500),
  actor_id uuid not null references public.users(id),
  request_id uuid not null,
  session_id uuid references public.sessions(id),
  effective_date date not null,
  recorded_at timestamptz not null default now(),
  unique (actor_id, request_id, student_id),
  foreign key (actor_id, request_id) references public.credit_operations(actor_id, request_id) deferrable initially deferred,
  check ((kind = 'top_up' and amount > 0 and session_id is null)
    or (kind = 'adjustment' and session_id is null)
    or (kind = 'attendance_charge' and amount = -1 and session_id is not null)
    or (kind = 'attendance_refund' and amount = 1 and session_id is not null))
);
create table public.session_credit_state (
  session_id uuid not null references public.sessions(id),
  student_id uuid not null references public.credit_accounts(student_id),
  charged boolean not null,
  primary key (session_id, student_id)
);
create index credit_entries_student_history on public.credit_entries(student_id, recorded_at desc, id desc);
insert into public.credit_accounts(student_id) select id from public.students;

create or replace function public.can_read_credits(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users u join public.students s on s.id = p_student
    where u.id = auth.uid() and (
      (u.role = 'admin' and u.center_id = s.center_id)
      or (u.role = 'teacher' and u.center_id = s.center_id and exists (
        select 1 from public.enrollments e join public.classes c on c.id = e.class_id
        where e.student_id = s.id and c.teacher_id = u.id and c.center_id = u.center_id))
      or (u.role = 'parent' and exists (select 1 from public.student_guardians g
        where g.student_id = s.id and g.guardian_id = u.id))));
$$;
alter table public.credit_accounts enable row level security;
alter table public.credit_entries enable row level security;
alter table public.credit_operations enable row level security;
alter table public.session_credit_state enable row level security;
create policy "credit_accounts_read" on public.credit_accounts for select to authenticated
  using (public.can_read_credits(student_id));
create policy "credit_entries_read" on public.credit_entries for select to authenticated
  using (public.can_read_credits(student_id));
create policy "credit_operations_private" on public.credit_operations for select using (false);
create policy "session_credit_state_private" on public.session_credit_state for select using (false);
grant select on public.credit_accounts, public.credit_entries to authenticated;

-- Direct attendance writes and billing-flag edits would bypass the ledger.
-- Definer RPCs execute as the schema owner; ordinary PostgREST users do not.
create or replace function public.guard_credit_writes()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_table_name = 'attendance' then
      raise exception 'Use the session logging RPC' using errcode = '42501';
    elsif tg_op = 'INSERT' then
      if not new.credit_billable or new.revision <> 0 or new.status <> 'scheduled' then
        raise exception 'Invalid new session billing state' using errcode = '42501';
      end if;
    elsif new.credit_billable is distinct from old.credit_billable
      or new.revision is distinct from old.revision or new.class_id is distinct from old.class_id
      or new.status is distinct from old.status or new.notes is distinct from old.notes then
      raise exception 'Use the session logging RPC' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger attendance_credit_guard before insert or update or delete on public.attendance
  for each row execute function public.guard_credit_writes();
create trigger session_credit_guard before insert or update on public.sessions
  for each row execute function public.guard_credit_writes();

create or replace function public.adjust_credits(p_student uuid, p_amount integer, p_kind text, p_reason text, p_request uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_payload jsonb; v_receipt public.credit_operations; v_balance integer; v_result jsonb;
begin
  if not exists (select 1 from public.users u join public.students s on s.center_id = u.center_id
      where u.id = auth.uid() and u.role = 'admin' and s.id = p_student) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_request is null or p_amount is null or p_amount = 0 or abs(p_amount::bigint) > 10000
    or p_kind is null or p_kind not in ('top_up','adjustment') or (p_kind = 'top_up' and p_amount < 0)
    or p_reason is null or length(trim(p_reason)) not between 1 and 500 then
    raise exception 'Invalid credit adjustment' using errcode = '22023';
  end if;
  v_payload := jsonb_build_object('operation','adjust','student',p_student,'amount',p_amount,'kind',p_kind,'reason',trim(p_reason));
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || p_request::text, 0));
  select * into v_receipt from public.credit_operations where actor_id = auth.uid() and request_id = p_request;
  if found then
    if v_receipt.payload <> v_payload then raise exception 'Request ID already used for different data' using errcode = 'P0002'; end if;
    return v_receipt.result;
  end if;
  insert into public.credit_accounts(student_id) values (p_student) on conflict do nothing;
  select balance into v_balance from public.credit_accounts where student_id = p_student for update;
  if v_balance::bigint + p_amount < 0 or v_balance::bigint + p_amount > 2147483647 then
    raise exception 'Insufficient credits or balance limit exceeded' using errcode = 'P0001';
  end if;
  update public.credit_accounts set balance = balance + p_amount, revision = revision + 1 where student_id = p_student;
  insert into public.credit_entries(student_id,amount,kind,reason,actor_id,request_id,effective_date)
    values (p_student,p_amount,p_kind,trim(p_reason),auth.uid(),p_request,(now() at time zone 'Asia/Jakarta')::date);
  v_result := jsonb_build_object('balance',v_balance + p_amount);
  insert into public.credit_operations(actor_id,request_id,payload,result) values(auth.uid(),p_request,v_payload,v_result);
  return v_result;
end;
$$;

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
    where s.id is null or s.center_id <> c.center_id or x.status is null or x.status not in ('present','absent','unmarked')
    or (not exists (select 1 from public.enrollments e where e.student_id = x."studentId" and e.class_id = c.id)
      and not (x.status in ('absent','unmarked') and exists (select 1 from public.session_credit_state sc
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
    where e.id is null or l.id is null or s.center_id <> c.center_id)
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
      v_delta := coalesce(v_charged,false)::integer - (a.status = 'present')::integer;
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
      insert into public.session_credit_state(session_id,student_id,charged) values(p_session_id,a."studentId",a.status = 'present')
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

revoke all on function public.log_session(uuid,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.can_read_credits(uuid) from public,anon;
revoke all on function public.adjust_credits(uuid,integer,text,text,uuid) from public,anon;
revoke all on function public.log_session_credits(uuid,text,jsonb,jsonb,uuid,integer) from public,anon;
grant execute on function public.can_read_credits(uuid) to authenticated;
grant execute on function public.adjust_credits(uuid,integer,text,text,uuid) to authenticated;
grant execute on function public.log_session_credits(uuid,text,jsonb,jsonb,uuid,integer) to authenticated;
commit;
