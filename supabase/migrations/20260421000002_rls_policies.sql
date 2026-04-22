-- =====================================================================
-- Parenty — Row Level Security & triggers
-- Toute la sécurité repose ici. Aucune logique critique côté client.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Fonction utilitaire : retourne la family_id du user courant
-- SECURITY DEFINER pour éviter la récursion RLS sur family_members
-- ---------------------------------------------------------------------
create or replace function public.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id
  from public.family_members
  where user_id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- Trigger : quand une famille est créée, le créateur en devient owner
-- ---------------------------------------------------------------------
create or replace function public.handle_new_family()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.family_members (family_id, user_id, role)
  values (new.id, auth.uid(), 'owner');
  return new;
end;
$$;

create trigger on_family_created
  after insert on public.families
  for each row execute function public.handle_new_family();

-- ---------------------------------------------------------------------
-- Triggers d'historisation pour events et expenses
-- SECURITY DEFINER obligatoire : sans ça, le trigger s'exécute avec les
-- droits de l'utilisateur qui fait l'INSERT, et la RLS sur event_history
-- / expense_history bloque l'insertion (il n'y a pas de policy INSERT
-- sur ces tables — elles ne sont accessibles qu'en lecture côté app).
-- ---------------------------------------------------------------------
create or replace function public.log_event_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_history (event_id, changed_by, action, snapshot)
  values (
    new.id,
    auth.uid(),
    case
      when tg_op = 'INSERT' then 'created'
      when new.cancelled_at is not null and (old.cancelled_at is null) then 'cancelled'
      else 'updated'
    end,
    to_jsonb(new)
  );
  return new;
end;
$$;

create trigger trg_event_history
  after insert or update on public.events
  for each row execute function public.log_event_change();

create or replace function public.log_expense_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.expense_history (expense_id, changed_by, action, snapshot)
  values (
    new.id,
    auth.uid(),
    case
      when tg_op = 'INSERT' then 'created'
      when new.status != old.status then 'status_changed'
      else 'updated'
    end,
    to_jsonb(new)
  );
  return new;
end;
$$;

create trigger trg_expense_history
  after insert or update on public.expenses
  for each row execute function public.log_expense_change();

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.children enable row level security;
alter table public.events enable row level security;
alter table public.event_history enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_history enable row level security;
alter table public.documents enable row level security;
alter table public.invitations enable row level security;

-- ---------------------------------------------------------------------
-- families
-- ---------------------------------------------------------------------
create policy "Users can view their own family"
  on public.families for select
  using (id = public.current_family_id());

create policy "Authenticated users can create a family"
  on public.families for insert
  with check (auth.uid() is not null);

create policy "Only family members can update their family"
  on public.families for update
  using (id = public.current_family_id());

-- ---------------------------------------------------------------------
-- family_members
-- ---------------------------------------------------------------------
create policy "Users see members of their own family"
  on public.family_members for select
  using (family_id = public.current_family_id());

-- L'insertion directe est empêchée ; on passe par le trigger + l'edge function invite
create policy "Service role only inserts family_members"
  on public.family_members for insert
  with check (false);

-- ---------------------------------------------------------------------
-- children
-- ---------------------------------------------------------------------
create policy "Family members can view their children"
  on public.children for select
  using (family_id = public.current_family_id());

create policy "Family members can add children"
  on public.children for insert
  with check (family_id = public.current_family_id());

create policy "Family members can soft-delete children"
  on public.children for update
  using (family_id = public.current_family_id());

-- ---------------------------------------------------------------------
-- events — jamais de DELETE
-- ---------------------------------------------------------------------
create policy "Family members can view events"
  on public.events for select
  using (family_id = public.current_family_id());

create policy "Family members can create events"
  on public.events for insert
  with check (
    family_id = public.current_family_id()
    and created_by = auth.uid()
  );

create policy "Family members can update events"
  on public.events for update
  using (family_id = public.current_family_id());

-- Aucune policy DELETE : les DELETE sont donc impossibles

-- ---------------------------------------------------------------------
-- event_history — lecture seule
-- ---------------------------------------------------------------------
create policy "Family members can read event history"
  on public.event_history for select
  using (
    event_id in (
      select id from public.events where family_id = public.current_family_id()
    )
  );

-- ---------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------
create policy "Family members can view expenses"
  on public.expenses for select
  using (family_id = public.current_family_id());

create policy "Family members can create expenses (must be payer)"
  on public.expenses for insert
  with check (
    family_id = public.current_family_id()
    and payer_id = auth.uid()
  );

create policy "Family members can validate (not as payer)"
  on public.expenses for update
  using (family_id = public.current_family_id())
  with check (
    family_id = public.current_family_id()
    -- la contrainte check de la table vérifie déjà payer != validator
  );

-- ---------------------------------------------------------------------
-- expense_history
-- ---------------------------------------------------------------------
create policy "Family members can read expense history"
  on public.expense_history for select
  using (
    expense_id in (
      select id from public.expenses where family_id = public.current_family_id()
    )
  );

-- ---------------------------------------------------------------------
-- documents — pas d'UPDATE (règle : pas d'édition)
-- ---------------------------------------------------------------------
create policy "Family members can view documents"
  on public.documents for select
  using (family_id = public.current_family_id() and deleted_at is null);

create policy "Family members can upload documents"
  on public.documents for insert
  with check (
    family_id = public.current_family_id()
    and uploaded_by = auth.uid()
  );

-- UPDATE autorisé uniquement pour marquer deleted_at (soft delete)
-- Pour garantir qu'on ne modifie QUE le soft-delete, on peut ajouter un trigger
-- qui rejette toute update autre que deleted_at / deleted_by
create policy "Family members can soft-delete documents"
  on public.documents for update
  using (family_id = public.current_family_id());

-- ---------------------------------------------------------------------
-- invitations
-- ---------------------------------------------------------------------
create policy "Family members can view their invitations"
  on public.invitations for select
  using (family_id = public.current_family_id());

create policy "Family members can create invitations"
  on public.invitations for insert
  with check (
    family_id = public.current_family_id()
    and invited_by = auth.uid()
  );
