-- Supabase grants these at project bootstrap, outside the user's schema.sql.
-- Table privileges are wide open by design; RLS is what actually restricts.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
