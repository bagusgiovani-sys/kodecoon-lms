revoke all on function public.manage_assignment(text,uuid,uuid,integer,uuid,jsonb) from public,anon;
revoke all on function public.can_manage_class(uuid),public.can_read_assignment(uuid,uuid) from public,anon;
grant execute on function public.manage_assignment(text,uuid,uuid,integer,uuid,jsonb),public.can_manage_class(uuid),public.can_read_assignment(uuid,uuid) to authenticated;
revoke truncate on assignments,assignment_learners,assignment_write_receipts from public,anon,authenticated;
