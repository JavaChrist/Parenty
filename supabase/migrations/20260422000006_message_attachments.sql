-- =====================================================================
-- Parenty — Pièces jointes dans le chat
-- - Colonnes attachment_* sur public.messages
-- - body devient nullable (un message peut être "photo seule")
-- - Nouveau bucket privé "chat-attachments" avec RLS par famille
--   Convention de path : `<family_id>/<uuid>.<ext>`
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Schéma : ajout des colonnes de pièce jointe
-- ---------------------------------------------------------------------
alter table public.messages
  alter column body drop not null;

-- L'ancien check (inline à la création) porte sur body > 0 : on le vire
alter table public.messages
  drop constraint if exists messages_body_check;

alter table public.messages
  add column if not exists attachment_path text,
  add column if not exists attachment_mime text,
  add column if not exists attachment_name text,
  add column if not exists attachment_size bigint;

-- Un message doit avoir soit du texte non vide, soit une pièce jointe
alter table public.messages
  drop constraint if exists messages_body_or_attachment_check;

alter table public.messages
  add constraint messages_body_or_attachment_check check (
    (body is not null and length(trim(body)) > 0)
    or attachment_path is not null
  );

-- ---------------------------------------------------------------------
-- 2. Bucket Storage "chat-attachments" (privé)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

-- Les membres de la famille peuvent lire
drop policy if exists "Family can read chat attachments" on storage.objects;
create policy "Family can read chat attachments"
  on storage.objects for select
  using (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = public.current_family_id()::text
  );

-- Les membres de la famille peuvent uploader dans le dossier de leur famille
drop policy if exists "Family can upload chat attachments" on storage.objects;
create policy "Family can upload chat attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = public.current_family_id()::text
    and auth.uid() = owner
  );

-- Pas de policy UPDATE/DELETE : les messages (et donc leurs PJ) sont
-- immutables et indélébiles, comme le reste du chat.
