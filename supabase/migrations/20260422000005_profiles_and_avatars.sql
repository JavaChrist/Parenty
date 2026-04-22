-- =====================================================================
-- Parenty — Profils utilisateurs & bucket "avatars"
-- - Table public.profiles (1:1 avec auth.users)
-- - Auto-création à l'inscription via trigger
-- - RLS : on voit son profil + ceux des membres de sa famille
-- - Bucket public "avatars" pour les photos de profil
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table : profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  avatar_path text, -- chemin dans le bucket storage "avatars"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at auto
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Auto-création d'un profil à l'inscription
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill pour les users déjà existants
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Helper : un user donné est-il membre de ma famille ?
-- SECURITY DEFINER pour éviter la récursion RLS sur family_members
-- ---------------------------------------------------------------------
create or replace function public.is_family_member(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = public.current_family_id()
      and fm.user_id = target_user_id
  );
$$;

-- ---------------------------------------------------------------------
-- RLS profiles
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile and family profiles" on public.profiles;
create policy "Users can view their own profile and family profiles"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.is_family_member(id)
  );

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- L'INSERT est réservé au trigger (SECURITY DEFINER).
-- On autorise quand même le self-insert si le trigger n'a pas eu lieu
-- (migrations, import manuel, etc.)
drop policy if exists "Users can self-insert their profile" on public.profiles;
create policy "Users can self-insert their profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- =====================================================================
-- Bucket Storage "avatars"
-- Bucket PUBLIC (les photos de profil sont affichées via <img src>).
-- Convention de path : `<user_id>/avatar.<ext>`
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Lecture publique (les photos de profil ne sont pas sensibles)
drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Un user ne peut écrire que dans son propre dossier
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and auth.uid() = owner
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
