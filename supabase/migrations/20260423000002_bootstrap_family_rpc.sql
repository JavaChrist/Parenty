-- =============================================================================
-- 20260423000002_bootstrap_family_rpc.sql
--
-- Problème constaté en prod :
--   L'onboarding faisait 2 INSERT RLS-dépendants successifs (families, puis
--   children), pilotés depuis le client. Quand quoi que ce soit foirait avec
--   le JWT (service worker qui intercepte /auth/v1, session pas encore
--   synchronisée, token périmé…), auth.uid() arrivait null côté Postgres et
--   la RLS rejetait l'INSERT families avec "new row violates row-level
--   security policy for table families". Bloquant : l'utilisateur ne peut
--   plus jamais créer sa famille.
--
-- Solution :
--   Une RPC atomique `bootstrap_family` en SECURITY DEFINER qui :
--     1. vérifie auth.uid() IS NOT NULL en tête et lève une erreur explicite
--        si la session est absente (au lieu du message RLS cryptique)
--     2. vérifie que le user n'a pas déjà de famille (idempotence / anti-
--        doublon : un user = une famille au MVP)
--     3. INSERT families  (le trigger on_family_created ajoute family_members)
--     4. INSERT children
--     5. renvoie le family_id
--
--   Tout se fait dans une seule transaction côté Postgres. Plus aucune
--   surface RLS à traverser côté client pour cette étape d'amorçage.
--
-- Sécurité :
--   - SECURITY DEFINER : la fonction s'exécute avec les droits de son owner
--     (postgres), donc bypass la RLS. C'est VOULU et cadré par les checks
--     internes (auth.uid() not null + anti-doublon).
--   - search_path = public, pg_temp : évite l'injection via search_path.
--   - GRANT EXECUTE to authenticated UNIQUEMENT. Les anons ne peuvent pas
--     l'appeler.
-- =============================================================================

begin;

create or replace function public.bootstrap_family(
  p_family_name text,
  p_child_first_name text,
  p_child_birth_date date
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_existing_family uuid;
begin
  if v_user_id is null then
    raise exception 'Utilisateur non authentifié.'
      using errcode = '42501', hint = 'Reconnecte-toi et réessaie.';
  end if;

  if coalesce(trim(p_family_name), '') = '' then
    raise exception 'Le nom de la famille est obligatoire.'
      using errcode = '22023';
  end if;

  if coalesce(trim(p_child_first_name), '') = '' then
    raise exception 'Le prénom de l''enfant est obligatoire.'
      using errcode = '22023';
  end if;

  if p_child_birth_date is null then
    raise exception 'La date de naissance de l''enfant est obligatoire.'
      using errcode = '22023';
  end if;

  -- Anti-doublon : un user = une famille au MVP. Si l'utilisateur a déjà
  -- une famille (retry de l'onboarding après un bug par exemple), on
  -- renvoie l'existante plutôt que d'en créer une deuxième orpheline.
  select family_id into v_existing_family
  from public.family_members
  where user_id = v_user_id
  limit 1;

  if v_existing_family is not null then
    -- L'user a déjà une famille : on ajoute juste l'enfant si le nom n'est
    -- pas déjà pris dans cette famille (filet anti double-clic).
    if not exists (
      select 1 from public.children
      where family_id = v_existing_family
        and lower(first_name) = lower(p_child_first_name)
        and deleted_at is null
    ) then
      insert into public.children (family_id, first_name, birth_date, created_by)
      values (v_existing_family, p_child_first_name, p_child_birth_date, v_user_id);
    end if;
    return v_existing_family;
  end if;

  -- Cas nominal : création de la famille (trigger on_family_created insère
  -- automatiquement dans family_members avec role='owner').
  insert into public.families (name)
  values (p_family_name)
  returning id into v_family_id;

  insert into public.children (family_id, first_name, birth_date, created_by)
  values (v_family_id, p_child_first_name, p_child_birth_date, v_user_id);

  return v_family_id;
end;
$$;

comment on function public.bootstrap_family(text, text, date) is
  'Amorce une nouvelle famille + premier enfant en une transaction atomique, '
  'en SECURITY DEFINER pour contourner les aléas de session côté client. '
  'Idempotent : si le user a déjà une famille, renvoie l''existante.';

-- Personne d'autre que les utilisateurs authentifiés ne peut l'exécuter.
revoke all on function public.bootstrap_family(text, text, date) from public;
revoke all on function public.bootstrap_family(text, text, date) from anon;
grant execute on function public.bootstrap_family(text, text, date) to authenticated;

commit;
