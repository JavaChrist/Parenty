-- =====================================================================
-- Parenty — Partage des dépenses en montant absolu
--
-- Ajoute share_payer_cents (nullable) :
--   - NULL    → on utilise share_payer_pct (mode pourcentage, défaut)
--   - >= 0    → montant exact à la charge du payeur, en centimes
--               (le co-parent supporte amount_cents - share_payer_cents)
--
-- Permet de distinguer les cas où le partage doit être un montant fixe
-- (ex : "tu me dois 30€" plutôt que "33,33%") sans perte d'arrondi.
-- =====================================================================

alter table public.expenses
  add column if not exists share_payer_cents bigint
  check (share_payer_cents is null or share_payer_cents >= 0);

-- Cohérence : si share_payer_cents est défini, il ne doit pas dépasser le
-- montant total de la dépense (sinon le co-parent serait crédité d'un
-- montant négatif).
alter table public.expenses
  drop constraint if exists expenses_share_payer_cents_lte_amount;
alter table public.expenses
  add constraint expenses_share_payer_cents_lte_amount
  check (share_payer_cents is null or share_payer_cents <= amount_cents);

comment on column public.expenses.share_payer_cents is
  'Si non null : montant exact à la charge du payeur (centimes). Sinon, share_payer_pct est utilisé.';
