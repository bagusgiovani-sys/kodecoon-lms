revoke all on function public.can_read_submission_thread(uuid),public.close_removed_learner_submissions(),public.submit_assignment(uuid,uuid,uuid,text,text),public.review_submission(uuid,integer,uuid,uuid,text,text) from public,anon;
revoke all on function public.close_removed_learner_submissions() from authenticated;
grant execute on function public.can_read_submission_thread(uuid),public.submit_assignment(uuid,uuid,uuid,text,text),public.review_submission(uuid,integer,uuid,uuid,text,text) to authenticated;
revoke truncate on submission_threads,submission_versions,submission_reviews,submission_write_receipts from public,anon,authenticated;
