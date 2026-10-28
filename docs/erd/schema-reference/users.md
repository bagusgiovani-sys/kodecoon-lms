# users

Existing schema.sql:27. Not a standalone migration.

```sql
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'teacher', -- 'teacher' | 'center_manager' | 'admin' | 'parent'
  center_id uuid references centers(id), -- null for parents, required for staff
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Enforced, not just documented: several RLS policies scope by
  -- "center_id in (select center_id from users where id = auth.uid())".
  -- A parent with a non-null center_id would silently widen those policies to
  -- every student in the center, so the invariant has to be a constraint.
  constraint users_parent_has_no_center
    check (role <> 'parent' or center_id is null)
);
alter table users add constraint users_id_center_unique unique (id, center_id);
```
