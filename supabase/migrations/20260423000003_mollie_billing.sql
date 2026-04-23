-- =====================================================================
-- Parenty — Colonnes Mollie pour la facturation
--
-- Ajoute les identifiants Mollie sur families pour persister le lien entre
-- une famille et son abonnement payant côté Mollie. On reste simple :
-- pas de table subscriptions dédiée pour l'instant, tout vit sur families.
--
-- Les statuts existants (subscription_status, subscription_ends_at) sont
-- maintenus par l'Edge Function mollie-webhook en réaction aux events
-- envoyés par Mollie (payment.paid, subscription.canceled…).
-- =====================================================================

alter table public.families
  add column if not exists mollie_customer_id text,
  add column if not exists mollie_subscription_id text,
  add column if not exists mollie_mandate_id text;

create index if not exists idx_families_mollie_customer
  on public.families(mollie_customer_id)
  where mollie_customer_id is not null;

create index if not exists idx_families_mollie_subscription
  on public.families(mollie_subscription_id)
  where mollie_subscription_id is not null;

comment on column public.families.mollie_customer_id is
  'Identifiant Mollie du customer lié à la famille (cst_xxx). Créé au premier clic S''abonner.';
comment on column public.families.mollie_subscription_id is
  'Identifiant Mollie de la souscription active (sub_xxx). Créé après le first payment ok.';
comment on column public.families.mollie_mandate_id is
  'Mandat Mollie (mdt_xxx) autorisant les prélèvements récurrents. Nécessaire pour créer la subscription.';

-- =====================================================================
-- Trail d'audit : table billing_events
-- Historise les événements Mollie reçus par le webhook pour debug + legal.
-- =====================================================================

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete set null,
  mollie_resource_id text not null, -- tr_xxx, sub_xxx…
  event_type text not null, -- payment.paid, subscription.canceled, etc.
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists idx_billing_events_family
  on public.billing_events(family_id);
create index if not exists idx_billing_events_received
  on public.billing_events(received_at desc);

-- RLS : lecture seule pour les owners de la famille (pratique pour un futur
-- écran "historique de facturation"), insert/update/delete réservés au
-- service_role (les Edge Functions).
alter table public.billing_events enable row level security;

drop policy if exists "Members can read their family billing events" on public.billing_events;
create policy "Members can read their family billing events"
  on public.billing_events for select
  using (
    family_id in (
      select family_id from public.family_members where user_id = auth.uid()
    )
  );
