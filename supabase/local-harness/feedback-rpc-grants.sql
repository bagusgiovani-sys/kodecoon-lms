revoke all on function public.manage_feedback(text,uuid,uuid,uuid,integer,uuid,jsonb) from public,anon;
grant execute on function public.manage_feedback(text,uuid,uuid,uuid,integer,uuid,jsonb) to authenticated;
revoke truncate on student_feedback,published_feedback,feedback_write_receipts from public,anon,authenticated;
