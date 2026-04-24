-- =====================================================================
-- Parenty — Partage personnalisé des dépenses
--
-- Ajoute une colonne share_payer_pct sur les dépenses :
--   - 0   = le payeur ne supporte rien (le co-parent paie tout)
--   - 50  = partage équitable (par défaut, comportement historique)
--   - 100 = à la charge unique du payeur (pas remboursable par le co-parent)
--
-- La part du co-parent est implicitement 100 - share_payer_pct.
-- Les dépenses existantes sont initialisées à 50% pour rester rétrocompatibles.
-- =====================================================================

alter table public.expenses
  add column if not exists share_payer_pct numeric(5,2) not null default 50.00
  check (share_payer_pct >= 0 and share_payer_pct <= 100);

comment on column public.expenses.share_payer_pct is
  'Pourcentage du montant à la charge du payeur (0–100). Le co-parent supporte (100 - share_payer_pct).';
