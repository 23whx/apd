-- Ensure public.users exists and is kept in sync with auth.users
-- This fixes admin permission checks (reading users.role) and profile pages.

-- 1) Table (create if missing; safe for existing DBs)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  avatar_id int default 1,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Columns (for older schemas)
alter table public.users add column if not exists role text default 'user';
alter table public.users add column if not exists display_name text;
alter table public.users add column if not exists avatar_id int default 1;
alter table public.users add column if not exists updated_at timestamptz default now();

-- 3) updated_at trigger
create or replace function public.users_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.users_set_updated_at();

-- 4) Auto-create profile row on signup
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _username text;
begin
  _username := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1),
    'User'
  );

  insert into public.users (id, username, display_name, avatar_id, role)
  values (new.id, _username, coalesce(new.raw_user_meta_data->>'display_name', _username), 1, 'user')
  on conflict (id) do update
    set username = excluded.username,
        display_name = excluded.display_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- 5) RLS policies (minimal)
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
on public.users
for insert
with check (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Optional: admins can read all users
drop policy if exists "users_select_admin" on public.users;
create policy "users_select_admin"
on public.users
for select
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin','mod')
  )
);

