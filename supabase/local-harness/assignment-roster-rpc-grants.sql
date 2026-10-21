revoke all on function public.bump_assignment_learner_revision() from public,anon,authenticated;
revoke all on function public.set_assignment_learner(uuid,uuid,boolean,integer,uuid) from public,anon;
grant execute on function public.set_assignment_learner(uuid,uuid,boolean,integer,uuid) to authenticated;
