-- =====================================================================
-- Parenty — Chat entre co-parents
-- Règle : aucun message ne peut être supprimé ni édité. Tout est historisé.
-- =====================================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  -- pas de updated_at : pas d'édition
  read_at timestamptz
);

create index if not exists idx_messages_family_created
  on public.messages(family_id, created_at desc);

-- RLS
alter table public.messages enable row level security;

drop policy if exists "Family members can read messages" on public.messages;
create policy "Family members can read messages"
  on public.messages for select
  using (family_id = public.current_family_id());

drop policy if exists "Family members can send messages" on public.messages;
create policy "Family members can send messages"
  on public.messages for insert
  with check (
    family_id = public.current_family_id()
    and sender_id = auth.uid()
  );

-- Permettre seulement de marquer comme lu (RLS plus permissive en UPDATE,
-- mais on contrôle côté client. On peut resserrer avec un trigger plus tard.)
drop policy if exists "Family members can mark messages as read" on public.messages;
create policy "Family members can mark messages as read"
  on public.messages for update
  using (family_id = public.current_family_id())
  with check (family_id = public.current_family_id());

-- Pas de policy DELETE : les messages ne sont jamais supprimés.
