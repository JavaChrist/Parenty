-- =====================================================================
-- Parenty — Limites plan gratuit (v2)
--
-- Complète la limite 1 enfant déjà en place avec :
--   - 10 documents actifs max par famille (non soft-deleted)
--   - 10 dépenses max par mois calendaire par famille (status != rejected)
--
-- Les triggers BEFORE INSERT lèvent une exception explicite si la famille
-- n'est pas Premium (subscription_status != 'active') et dépasse la quota.
--
-- L'historique visible est en revanche filtré côté client dans /history
-- pour ne pas pénaliser la requête SQL (simple filtre de date).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Documents : 10 actifs max
-- ---------------------------------------------------------------------
create or replace function public.enforce_free_plan_documents_limit()
returns trigger
language plpgsql
as $$
declare
  v_status text;
  v_count int;
begin
  select subscription_status
    into v_status
    from public.families
   where id = new.family_id;

  if v_status = 'active' then
    return new;
  end if;

  select count(*)
    into v_count
    from public.documents
   where family_id = new.family_id
     and deleted_at is null;

  if v_count >= 10 then
    raise exception using
      errcode = 'P0001',
      message = 'free_plan_limit_documents: plan gratuit limité à 10 documents. Passe en Premium pour en stocker plus.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_free_plan_documents_limit on public.documents;
create trigger trg_enforce_free_plan_documents_limit
before insert on public.documents
for each row
execute function public.enforce_free_plan_documents_limit();

-- ---------------------------------------------------------------------
-- Dépenses : 10 par mois calendaire max
--
-- On se base sur date_trunc('month', incurred_on) pour compter sur le
-- mois de la dépense qu'on essaie de créer (et pas sur la date du jour),
-- cohérent avec la notion "10 dépenses par mois" que l'utilisateur attend.
-- On exclut les refusées pour que le compteur retombe si on les refuse,
-- car une refusée ne consomme pas réellement le quota partagé.
-- ---------------------------------------------------------------------
create or replace function public.enforce_free_plan_expenses_limit()
returns trigger
language plpgsql
as $$
declare
  v_status text;
  v_count int;
begin
  select subscription_status
    into v_status
    from public.families
   where id = new.family_id;

  if v_status = 'active' then
    return new;
  end if;

  select count(*)
    into v_count
    from public.expenses
   where family_id = new.family_id
     and status != 'rejected'
     and date_trunc('month', incurred_on) = date_trunc('month', new.incurred_on);

  if v_count >= 10 then
    raise exception using
      errcode = 'P0001',
      message = 'free_plan_limit_expenses: plan gratuit limité à 10 dépenses par mois. Passe en Premium pour lever la limite.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_free_plan_expenses_limit on public.expenses;
create trigger trg_enforce_free_plan_expenses_limit
before insert on public.expenses
for each row
execute function public.enforce_free_plan_expenses_limit();
