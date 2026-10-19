revoke all on function public.save_course_content(uuid,uuid,integer,uuid,jsonb) from public,anon;
grant execute on function public.save_course_content(uuid,uuid,integer,uuid,jsonb) to authenticated;
revoke truncate on courses,course_lessons,course_write_receipts from public,anon,authenticated;
