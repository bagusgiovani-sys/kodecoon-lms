revoke all on function public.set_class_course(uuid,uuid,uuid) from public,anon;
grant execute on function public.set_class_course(uuid,uuid,uuid) to authenticated;
revoke truncate on class_course_assignments,class_course_write_receipts from public,anon,authenticated;
