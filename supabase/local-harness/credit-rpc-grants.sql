revoke all on function public.log_session(uuid,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.can_read_credits(uuid) from public,anon;
revoke all on function public.adjust_credits(uuid,integer,text,text,uuid) from public,anon;
revoke all on function public.log_session_credits(uuid,text,jsonb,jsonb,uuid,integer) from public,anon;
grant execute on function public.can_read_credits(uuid) to authenticated;
grant execute on function public.adjust_credits(uuid,integer,text,text,uuid) to authenticated;
grant execute on function public.log_session_credits(uuid,text,jsonb,jsonb,uuid,integer) to authenticated;
