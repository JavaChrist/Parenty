-- =====================================================================
-- Active Supabase Realtime sur les tables partagées de la famille.
--
-- Sans ça, le Parent B ne voit les créations/modifications du Parent A
-- qu'après un reload manuel. L'abonnement côté client vit dans
-- `src/hooks/useFamilyRealtime.js` et s'appuie sur ces publications.
--
-- `messages` est déjà ajouté à la publication par la migration
-- d'origine du chat — on ne le remet pas.
-- =====================================================================

-- Supprime d'abord si présent (idempotent) puis ré-ajoute.
-- `alter publication add table` échoue si la table est déjà présente,
-- on utilise donc un bloc PL/pgSQL avec un try/catch silencieux.
do $$
begin
  begin
    alter publication supabase_realtime add table public.events;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.expenses;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.documents;
  exception when duplicate_object then null;
  end;
end $$;
