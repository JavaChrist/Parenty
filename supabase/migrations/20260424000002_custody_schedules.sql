-- =====================================================================
-- Parenty — Schéma de garde récurrent (custody_schedules)
--
-- Permet de définir des blocs de garde qui se répètent chaque semaine
-- ou toutes les deux semaines (paires / impaires), avec un parent
-- responsable (user_id membre de la famille) et un intervalle
-- jour+heure de début / jour+heure de fin.
--
-- Ex : « Chez Papa » du dimanche 17:00 au mercredi 10:00, chaque semaine.
--
-- Les périodes sont étendues en événements virtuels côté client (pas
-- matérialisés en base) pour rester souples et permettre la gestion
-- d'exceptions ultérieure.
-- =====================================================================

create table if not exists public.custody_schedules (
  id                 uuid primary key default gen_random_uuid(),
  family_id          uuid not null references public.families(id) on delete cascade,
  parent_user_id     uuid not null references auth.users(id) on delete cascade,
  label              text,                               -- ex : "Chez Papa"
  start_day_of_week  smallint not null check (start_day_of_week between 0 and 6), -- 0 = dimanche
  start_time         time not null,
  end_day_of_week    smallint not null check (end_day_of_week between 0 and 6),
  end_time           time not null,
  recurrence         text not null default 'weekly'
                        check (recurrence in ('weekly', 'biweekly_even', 'biweekly_odd')),
  valid_from         date,                               -- inclusif, null = sans borne
  valid_to           date,                               -- inclusif, null = sans borne
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create index if not exists custody_schedules_family_idx
  on public.custody_schedules (family_id)
  where deleted_at is null;

-- trigger updated_at
create or replace function public.touch_custody_schedule_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_custody_schedule on public.custody_schedules;
create trigger trg_touch_custody_schedule
before update on public.custody_schedules
for each row
execute function public.touch_custody_schedule_updated_at();

-- =====================================================================
-- RLS : membre de la famille = lecture ; owner OU parent concerné =
-- peut écrire son propre schéma. On laisse tout membre modifier pour
-- aligner avec la logique co-parentale (les deux parents définissent
-- ensemble le schéma).
-- =====================================================================
alter table public.custody_schedules enable row level security;

drop policy if exists "Family can read custody_schedules" on public.custody_schedules;
create policy "Family can read custody_schedules"
  on public.custody_schedules for select
  using (family_id = public.current_family_id());

drop policy if exists "Family can insert custody_schedules" on public.custody_schedules;
create policy "Family can insert custody_schedules"
  on public.custody_schedules for insert
  with check (
    family_id = public.current_family_id()
    and created_by = auth.uid()
  );

drop policy if exists "Family can update custody_schedules" on public.custody_schedules;
create policy "Family can update custody_schedules"
  on public.custody_schedules for update
  using (family_id = public.current_family_id())
  with check (family_id = public.current_family_id());

drop policy if exists "Family can delete custody_schedules" on public.custody_schedules;
create policy "Family can delete custody_schedules"
  on public.custody_schedules for delete
  using (family_id = public.current_family_id());
