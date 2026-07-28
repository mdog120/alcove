-- Alcove Supabase setup
-- Run this entire file in Supabase Dashboard → SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    school_name text,
    avatar_url text,
    age integer,
    state text default '',
    city text default '',
    education_level text default 'college',
    school_district text default '',
    major text default '',
    grad_year text default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- A single document per student keeps the current client-side data model
-- intact while making it secure and portable across devices.
create table if not exists public.workspace_data (
    user_id uuid primary key references auth.users(id) on delete cascade,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists workspace_data_set_updated_at on public.workspace_data;
create trigger workspace_data_set_updated_at
before update on public.workspace_data
for each row execute function public.set_updated_at();

-- Create a profile automatically when an account is created. The app's
-- onboarding flow will enrich these fields immediately afterward.
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (
        id, full_name, school_name, avatar_url, age, state, city,
        education_level, school_district, major, grad_year
    )
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        coalesce(new.raw_user_meta_data ->> 'school_name', ''),
        coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
        nullif(new.raw_user_meta_data ->> 'age', '')::integer,
        coalesce(new.raw_user_meta_data ->> 'state', ''),
        coalesce(new.raw_user_meta_data ->> 'city', ''),
        coalesce(new.raw_user_meta_data ->> 'education_level', 'college'),
        coalesce(new.raw_user_meta_data ->> 'school_district', ''),
        coalesce(new.raw_user_meta_data ->> 'major', ''),
        coalesce(new.raw_user_meta_data ->> 'grad_year', '')
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.workspace_data enable row level security;

drop policy if exists "Students can view their own profile" on public.profiles;
create policy "Students can view their own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

drop policy if exists "Students can create their own profile" on public.profiles;
create policy "Students can create their own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "Students can update their own profile" on public.profiles;
create policy "Students can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Students can view their own workspace" on public.workspace_data;
create policy "Students can view their own workspace"
on public.workspace_data for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Students can create their own workspace" on public.workspace_data;
create policy "Students can create their own workspace"
on public.workspace_data for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Students can update their own workspace" on public.workspace_data;
create policy "Students can update their own workspace"
on public.workspace_data for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
