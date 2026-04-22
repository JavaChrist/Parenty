-- =============================================================================
-- 20260422000007_user_deletion_cascade.sql
--
-- Corrige les contraintes de clé étrangère vers auth.users pour permettre la
-- suppression d'un utilisateur (soit via le Dashboard Supabase, soit via
-- supabase.auth.admin.deleteUser).
--
-- Stratégie :
--   - SET NULL partout où la donnée doit rester (historique / audit).
--     Le co-parent continue de voir la dépense, l'événement, le document,
--     même si l'auteur a supprimé son compte. La colonne affiche alors
--     "utilisateur supprimé" côté UI (à gérer dans l'app).
--
--   - CASCADE pour les invitations non consommées : sans leur inviteur
--     elles n'ont plus de sens, autant les supprimer.
--
-- Les FKs déjà correctement configurées ne sont pas touchées :
--   - profiles.id              ON DELETE CASCADE (migration 0005)
--   - family_members.user_id   ON DELETE CASCADE (migration 0001)
--   - messages.sender_id       ON DELETE CASCADE (migration 0004)
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- children.created_by
-- -----------------------------------------------------------------------------
alter table public.children
  drop constraint if exists children_created_by_fkey;
alter table public.children
  add constraint children_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- -----------------------------------------------------------------------------
-- events.created_by + events.cancelled_by
-- -----------------------------------------------------------------------------
alter table public.events
  drop constraint if exists events_created_by_fkey;
alter table public.events
  add constraint events_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table public.events
  drop constraint if exists events_cancelled_by_fkey;
alter table public.events
  add constraint events_cancelled_by_fkey
  foreign key (cancelled_by) references auth.users(id) on delete set null;

-- -----------------------------------------------------------------------------
-- event_history.changed_by
-- -----------------------------------------------------------------------------
alter table public.event_history
  drop constraint if exists event_history_changed_by_fkey;
alter table public.event_history
  add constraint event_history_changed_by_fkey
  foreign key (changed_by) references auth.users(id) on delete set null;

-- -----------------------------------------------------------------------------
-- expenses.payer_id + expenses.validated_by
-- payer_id était NOT NULL → on le rend nullable pour permettre SET NULL.
-- -----------------------------------------------------------------------------
alter table public.expenses
  alter column payer_id drop not null;

alter table public.expenses
  drop constraint if exists expenses_payer_id_fkey;
alter table public.expenses
  add constraint expenses_payer_id_fkey
  foreign key (payer_id) references auth.users(id) on delete set null;

alter table public.expenses
  drop constraint if exists expenses_validated_by_fkey;
alter table public.expenses
  add constraint expenses_validated_by_fkey
  foreign key (validated_by) references auth.users(id) on delete set null;

-- -----------------------------------------------------------------------------
-- expense_history.changed_by
-- -----------------------------------------------------------------------------
alter table public.expense_history
  drop constraint if exists expense_history_changed_by_fkey;
alter table public.expense_history
  add constraint expense_history_changed_by_fkey
  foreign key (changed_by) references auth.users(id) on delete set null;

-- -----------------------------------------------------------------------------
-- documents.uploaded_by + documents.deleted_by
-- -----------------------------------------------------------------------------
alter table public.documents
  drop constraint if exists documents_uploaded_by_fkey;
alter table public.documents
  add constraint documents_uploaded_by_fkey
  foreign key (uploaded_by) references auth.users(id) on delete set null;

alter table public.documents
  drop constraint if exists documents_deleted_by_fkey;
alter table public.documents
  add constraint documents_deleted_by_fkey
  foreign key (deleted_by) references auth.users(id) on delete set null;

-- -----------------------------------------------------------------------------
-- invitations.invited_by (CASCADE) + invitations.accepted_by (SET NULL)
-- Une invitation sans inviteur n'a plus de sens → cascade.
-- -----------------------------------------------------------------------------
alter table public.invitations
  drop constraint if exists invitations_invited_by_fkey;
alter table public.invitations
  add constraint invitations_invited_by_fkey
  foreign key (invited_by) references auth.users(id) on delete cascade;

alter table public.invitations
  drop constraint if exists invitations_accepted_by_fkey;
alter table public.invitations
  add constraint invitations_accepted_by_fkey
  foreign key (accepted_by) references auth.users(id) on delete set null;

commit;
