-- Supabase surface shim. Faithful, not fake: auth.uid() is Supabase's own
-- implementation (a read of the request.jwt.claims GUC), and auth.users
-- mirrors the real column list the harness inserts into.
create role anon;
create role authenticated;
create role service_role;

create schema auth;

create table auth.users (
  instance_id        uuid,
  id                 uuid primary key,
  aud                varchar(255),
  role               varchar(255),
  email              varchar(255),
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  created_at         timestamptz,
  updated_at         timestamptz,
  raw_app_meta_data  jsonb,
  raw_user_meta_data jsonb,
  is_super_admin     boolean
);

-- Supabase's own definition, verbatim in shape: nullif BEFORE the cast, so an
-- empty claims GUC (which is how the harness impersonates anon) yields NULL
-- rather than a 22P02 on ''::jsonb.
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create function auth.role() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to anon, authenticated, service_role;

-- Minimal metadata only: does not emulate Storage uploads/downloads or policies.
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean default false);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, unique(bucket_id, name));
