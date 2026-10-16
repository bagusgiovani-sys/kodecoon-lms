-- Simulate the function grants Supabase's bootstrap may apply after schema.sql.
-- Keep the session writer callable only through an authenticated RLS context.
revoke all on function public.log_session(uuid, text, jsonb, jsonb) from public, anon;
grant execute on function public.log_session(uuid, text, jsonb, jsonb) to authenticated;
