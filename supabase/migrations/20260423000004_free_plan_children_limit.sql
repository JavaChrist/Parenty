-- =====================================================================
-- Parenty — Limite plan gratuit : 1 enfant max
--
-- En plan gratuit (subscription_status != 'active'), une famille ne peut
-- avoir qu'un seul enfant non supprimé. Au-delà, il faut passer Premium.
--
-- On pose un trigger BEFORE INSERT qui lève une exception claire plutôt
-- que de se reposer uniquement sur le client (qui peut être contourné).
-- =====================================================================

create or replace function public.enforce_free_plan_children_limit()
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

  -- Si la famille est premium, aucune limite.
  if v_status = 'active' then
    return new;
  end if;

  select count(*)
    into v_count
    from public.children
   where family_id = new.family_id
     and deleted_at is null;

  if v_count >= 1 then
    raise exception using
      errcode = 'P0001',
      message = 'free_plan_limit: plan gratuit limité à 1 enfant. Passe en Premium pour en ajouter plus.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_free_plan_children_limit on public.children;
create trigger trg_enforce_free_plan_children_limit
before insert on public.children
for each row
execute function public.enforce_free_plan_children_limit();

-- Idem dans bootstrap_family : la fonction insère déjà un enfant à la
-- création, ce qui reste OK (0 → 1). Aucun changement nécessaire.
