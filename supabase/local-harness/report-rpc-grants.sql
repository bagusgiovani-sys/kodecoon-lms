-- Reapply intended function grants after the simulated bootstrap's blanket grant.
revoke all on function public.can_manage_report(uuid, uuid) from public, anon;
revoke all on function public.publish_report(uuid) from public, anon;
revoke all on function public.withdraw_report(uuid) from public, anon;
grant execute on function public.can_manage_report(uuid, uuid) to authenticated;
grant execute on function public.publish_report(uuid) to authenticated;
grant execute on function public.withdraw_report(uuid) to authenticated;
