# Setup Parenty — à faire une fois

Tout ce qui suit est à faire **manuellement de ton côté** (j'ai pas accès à ton compte Supabase ni à ton réseau npm). Le tout prend **5 à 10 minutes**.

## 1. Installer la CLI Supabase dans le projet

```bash
cd C:\Users\conta\Desktop\parenty
npm install
```

(La CLI Supabase est maintenant déclarée en `devDependencies` dans `package.json`, donc un simple `npm install` la télécharge.)

## 2. Login + lien projet

```bash
npm run sb:login
# Ça ouvre ton navigateur → tu te connectes à Supabase → reviens dans le terminal

npm run sb:link
# Te demandera le mot de passe de ta DB (Dashboard → Project Settings → Database)
```

## 3. Désactiver "Confirm email" (Dashboard uniquement)

Dashboard Supabase → **Authentication** → **Providers** → **Email** → désactive la case **"Confirm email"** → Save.

> Sinon ton signup reste bloqué en "email à confirmer" et tu ne peux pas compléter l'onboarding immédiatement.

## 4. Appliquer les migrations SQL

**Option A — via la CLI :**
```bash
npm run sb:db:push
```

**Option B — via le Dashboard (SQL Editor) :** colle le contenu de :
1. `supabase/migrations/20260421000001_initial_schema.sql`
2. `supabase/migrations/20260421000002_rls_policies.sql`
3. `supabase/migrations/20260422000003_storage_documents.sql`
4. `supabase/migrations/20260422000004_messages.sql`
5. `supabase/migrations/20260422000005_profiles_and_avatars.sql`
6. `supabase/migrations/20260422000006_message_attachments.sql`

Et clique **Run** pour chaque.

**Vérification** : Dashboard → **Table Editor** → tu dois voir les tables `families`, `family_members`, `children`, `events`, `expenses`, `documents`, `invitations`.

## 5. Déployer les Edge Functions

```bash
npm run sb:deploy
```

Puis définir la variable `APP_URL` utilisée par `invite-parent` :

```bash
npx supabase secrets set APP_URL=http://localhost:5173
```

Vérif : Dashboard → **Edge Functions** → tu vois `invite-parent` et `accept-invite`.

## 6. Tester

```bash
npm run dev
```

- Ouvre http://localhost:5173, crée un compte
- Tu es automatiquement redirigé vers `/onboarding/child` (grâce au guard `RequireFamily`)
- Crée ton premier enfant → famille créée en base par le trigger
- Tu arrives sur le Dashboard
- Va dans Profil → "Inviter le co-parent" → entre un email → lien d'invitation généré
- Ajoute une dépense → ça marche

---

## 🆘 Diagnostic en cas de problème

Colle ceci dans **Dashboard → SQL Editor**, connecté à ton compte :

```sql
-- 1. Qui suis-je ?
select auth.uid() as my_user_id, auth.email() as my_email;

-- 2. Ai-je une famille ?
select * from public.family_members where user_id = auth.uid();

-- 3. La fonction helper existe-t-elle ?
select public.current_family_id();

-- 4. Toutes les tables sont-elles créées ?
select tablename from pg_tables where schemaname = 'public' order by tablename;
-- Attendu : children, documents, event_history, events, expense_history, expenses,
--           families, family_members, invitations

-- 5. Les Edge Functions sont-elles déployées ?
-- Va sur le Dashboard → Edge Functions (pas de SQL pour ça)

-- 6. Les policies RLS sont-elles actives ?
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

---

## 🔑 Scripts npm disponibles

| Commande | Utilité |
|----------|---------|
| `npm run sb:login` | Se connecter à Supabase |
| `npm run sb:link` | Lier le code local au projet distant |
| `npm run sb:db:push` | Appliquer les migrations SQL |
| `npm run sb:deploy` | Déployer les 2 Edge Functions |
| `npm run sb:deploy:invite` | Redéployer seulement invite-parent |
| `npm run sb:deploy:accept` | Redéployer seulement accept-invite |
| `npm run sb:logs:invite` | Voir les logs d'invite-parent en live |
| `npm run sb:logs:accept` | Voir les logs d'accept-invite en live |
| `npm run sb:secrets` | Lister les secrets Supabase |

---

## Récap : 5 commandes pour tout débloquer

```bash
npm install
npm run sb:login
npm run sb:link
npm run sb:db:push         # si les tables n'existent pas déjà
npm run sb:deploy
npx supabase secrets set APP_URL=http://localhost:5173
```

+ **désactiver "Confirm email"** dans le Dashboard Auth.
