-- =====================================================================
-- Parenty — Bucket Storage "documents" + policies RLS
-- Crée un bucket privé pour stocker les PDF, images, justificatifs.
-- L'accès est limité aux membres de la famille propriétaire du document.
--
-- Convention de path : `<family_id>/<uuid>.<ext>`
-- Cela permet de garantir la RLS en comparant le premier segment du path
-- à public.current_family_id().
-- =====================================================================

-- 1. Créer le bucket (privé)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- 2. Policies
-- Les utilisateurs peuvent voir les objets de leur famille
drop policy if exists "Family can read documents" on storage.objects;
create policy "Family can read documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_family_id()::text
  );

-- Les utilisateurs peuvent uploader dans le dossier de leur famille
drop policy if exists "Family can upload documents" on storage.objects;
create policy "Family can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_family_id()::text
    and auth.uid() = owner
  );

-- Les utilisateurs peuvent supprimer les objets de leur famille
-- (utilisé lors d'un soft-delete de document — on supprime le fichier physique)
drop policy if exists "Family can delete documents" on storage.objects;
create policy "Family can delete documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_family_id()::text
  );
