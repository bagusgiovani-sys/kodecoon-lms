revoke all on function public.save_course_content(uuid,uuid,integer,uuid,jsonb) from public,anon;
grant execute on function public.save_course_content(uuid,uuid,integer,uuid,jsonb) to authenticated;
revoke all on function public.map_class_course_lessons(uuid,uuid,uuid,jsonb) from public,anon;
grant execute on function public.map_class_course_lessons(uuid,uuid,uuid,jsonb) to authenticated;
revoke truncate on courses,course_lessons,course_write_receipts,course_target_write_receipts,course_curriculum_write_receipts from public,anon,authenticated;
