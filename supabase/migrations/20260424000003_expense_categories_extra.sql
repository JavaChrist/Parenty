-- =====================================================================
-- Parenty — Catégories de dépenses étendues
--
-- Ajoute : vacation, school_trip, sport, transport, gifts, childcare.
-- On supprime puis recrée la contrainte CHECK pour inclure les nouvelles
-- valeurs, en conservant les anciennes pour ne pas casser l'existant.
-- =====================================================================

alter table public.expenses
  drop constraint if exists expenses_category_check;

alter table public.expenses
  add constraint expenses_category_check
  check (
    category in (
      'school',
      'medical',
      'clothing',
      'leisure',
      'food',
      'vacation',
      'school_trip',
      'sport',
      'transport',
      'gifts',
      'childcare',
      'other'
    )
  );
