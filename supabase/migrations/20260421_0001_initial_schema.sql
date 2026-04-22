-- =====================================================================
-- Parenty — Schéma initial
-- Philosophie : tout est factuel, horodaté, rien n'est vraiment supprimé.
-- La sécurité repose sur la RLS côté Postgres.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Table : families
-- Un espace familial = une unité de facturation et de partage
-- ---------------------------------------------------------------------
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  subscription_status text not null default 'free'
    check (subscription_status in ('free', 'active', 'cancelled', 'past_due')),
  subscription_ends_at timestamptz
);

-- ---------------------------------------------------------------------
-- Table : family_members
-- Lien users <-> families (un user peut n'être dans qu'une famille au MVP)
-- ---------------------------------------------------------------------
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'parent' check (role in ('parent', 'owner')),
  joined_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create index idx_family_members_user on public.family_members(user_id);
create index idx_family_members_family on public.family_members(family_id);

-- ---------------------------------------------------------------------
-- Table : children
-- ---------------------------------------------------------------------
create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  first_name text not null,
  birth_date date not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  -- soft delete uniquement
  deleted_at timestamptz
);

create index idx_children_family on public.children(family_id) where deleted_at is null;

-- ---------------------------------------------------------------------
-- Table : events (agenda)
-- Règle : aucun événement n'est jamais supprimé. Modifications historisées.
-- ---------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid references public.children(id) on delete restrict,
  title text not null,
  description text,
  kind text not null check (kind in ('custody', 'vacation', 'school', 'medical', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  -- pas de deleted_at : événement jamais supprimable
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id),
  cancel_reason text,
  check (ends_at >= starts_at)
);

create index idx_events_family_starts on public.events(family_id, starts_at);
create index idx_events_child on public.events(child_id);

-- ---------------------------------------------------------------------
-- Table : event_history
-- Historique de toute modif sur un événement
-- ---------------------------------------------------------------------
create table public.event_history (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id),
  action text not null check (action in ('created', 'updated', 'cancelled')),
  snapshot jsonb not null -- état complet après le changement
);

create index idx_event_history_event on public.event_history(event_id, changed_at desc);

-- ---------------------------------------------------------------------
-- Table : expenses
-- Règle : le payeur ne peut pas valider. Refus motivé obligatoire.
-- ---------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid references public.children(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'EUR',
  description text not null,
  category text not null check (category in ('school', 'medical', 'clothing', 'leisure', 'food', 'other')),
  incurred_on date not null,
  payer_id uuid not null references auth.users(id),
  receipt_path text, -- chemin dans Supabase Storage
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  validated_by uuid references auth.users(id),
  validated_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now(),
  -- Contrainte métier : le payeur ne peut pas valider (vérifié par trigger)
  check (
    validated_by is null or validated_by != payer_id
  ),
  check (
    status != 'rejected' or reject_reason is not null
  )
);

create index idx_expenses_family_status on public.expenses(family_id, status);

-- ---------------------------------------------------------------------
-- Table : expense_history
-- ---------------------------------------------------------------------
create table public.expense_history (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id),
  action text not null,
  snapshot jsonb not null
);

create index idx_expense_history_expense on public.expense_history(expense_id, changed_at desc);

-- ---------------------------------------------------------------------
-- Table : documents
-- Règle : pas d'édition. Soft delete uniquement.
-- ---------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  title text not null,
  category text check (category in ('school', 'medical', 'admin', 'legal', 'other')),
  storage_path text not null, -- chemin Supabase Storage
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

create index idx_documents_family on public.documents(family_id) where deleted_at is null;

-- ---------------------------------------------------------------------
-- Table : invitations
-- Invitation du second parent
-- ---------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id)
);

create index idx_invitations_token on public.invitations(token);
create index idx_invitations_family on public.invitations(family_id);
