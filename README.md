# Parenty

> Organisation parentale partagée, simple et factuelle.

PWA destinée aux parents séparés ou divorcés. L'application centralise les informations liées aux enfants (garde, événements, dépenses, documents, communication) dans un espace neutre, factuel et partagé. **Aucune vocation de médiation ou de conseil juridique.**

## Stack

- **Frontend** : React 18 + Vite + Tailwind CSS + PWA
- **Routing** : React Router v6
- **État** : Zustand (auth) + TanStack Query (données serveur, realtime)
- **Backend** : Supabase (Auth, Postgres + RLS, Storage, Realtime, Edge Functions)
- **Paiement** : Mollie (abonnement mensuel sans engagement) — _à venir_
- **Hébergement** : Vercel (front) + Supabase (données, région Francfort UE)

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
# Renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 3. Lancer le dev server
npm run dev
```

## Configuration Supabase

1. Crée un projet Supabase (région : UE — Frankfurt ou Paris).
2. Applique les migrations SQL **dans l'ordre** depuis le SQL Editor ou via `supabase db push` :
   ```
   supabase/migrations/20260421000001_initial_schema.sql
   supabase/migrations/20260421000002_rls_policies.sql
   supabase/migrations/20260422000003_storage_documents.sql
   supabase/migrations/20260422000004_messages.sql
   supabase/migrations/20260422000005_profiles_and_avatars.sql
   supabase/migrations/20260422000006_message_attachments.sql
   supabase/migrations/20260422000007_user_deletion_cascade.sql
   supabase/migrations/20260423000001_realtime_shared_tables.sql
   ```
3. Déploie les edge functions :
   ```bash
   supabase functions deploy invite-parent
   supabase functions deploy accept-invite
   ```
   (ou `npm run sb:deploy` pour les deux en une seule commande)
4. Les buckets Storage sont créés automatiquement par les migrations :

   | Bucket            | Visibilité | Usage                                  |
   |-------------------|------------|----------------------------------------|
   | `documents`       | Privé      | PDF, justificatifs, pièces partagées   |
   | `avatars`         | Public     | Photos de profil (affichées via `<img src>`) |
   | `chat-attachments`| Privé      | Pièces jointes envoyées dans le chat   |

## Arborescence

```
parenty/
├── public/                 # Assets statiques (icônes PWA, favicon…)
├── src/
│   ├── components/
│   │   ├── documents/      # UploadDocumentForm
│   │   ├── events/         # AddEventForm, EventDetailModal,
│   │   │                   # EventHistoryTimeline
│   │   ├── expenses/       # AddExpenseForm, RejectExpenseForm
│   │   ├── layout/         # AppLayout, ProtectedRoute, RequireFamily,
│   │   │                   # LegalLayout, UpdatePrompt
│   │   ├── profile/        # PersonalInfoForm, ChangePasswordForm,
│   │   │                   # AddChildForm, InviteCoParentForm
│   │   └── ui/             # Modal, ImageLightbox…
│   ├── hooks/              # useFamily, useProfile, useMessages,
│   │                       # useExpenses, useEvents, useDocuments,
│   │                       # useActivityFeed, useFamilyRealtime…
│   ├── lib/                # supabase.js, image.js, pendingInvite.js
│   ├── pages/
│   │   ├── legal/          # MentionsLegales, Privacy, CGU, CGV
│   │   └── …               # Un fichier par écran principal
│   ├── stores/             # Zustand (authStore)
│   ├── styles/             # CSS global Tailwind
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── migrations/         # Schéma SQL + RLS + triggers + buckets
│   └── functions/          # Edge Functions (invite-parent, accept-invite)
└── docs/                   # Documentation projet
```

## Modèle de données

| Table / Bucket         | Rôle |
|------------------------|------|
| `families`             | Espace familial (unité de facturation et de partage) |
| `family_members`       | Lien user ↔ family avec rôle (`owner` / `parent`) |
| `profiles`             | Identité enrichie : prénom, nom, téléphone, avatar |
| `children`             | Enfants (soft-delete) |
| `events` + `event_history` | Agenda — immutable, annulations + historique complet |
| `expenses` + `expense_history` | Dépenses — validation par l'autre parent obligatoire |
| `documents`            | Documents (PDF/images) — soft-delete |
| `messages`             | Chat avec pièces jointes, `read_at` pour les non-lus |
| `invitations`          | Invitation du co-parent (token unique, expire sous 7j) |

## Fonctionnalités principales

### Authentification & Onboarding
- Inscription / connexion par email + mot de passe (Supabase Auth)
- Toggle œil sur tous les champs mot de passe
- Parcours d'onboarding : création famille → ajout enfant → invitation co-parent
- Page publique d'acceptation d'invitation via token signé

### Profil & Compte
- Informations personnelles (prénom, nom, téléphone, email)
- **Photo de profil** avec redimensionnement + recadrage automatique côté client (512×512 JPEG qualité 0.9, ≈ 50 Ko finals)
- Changement de mot de passe avec vérification du mot de passe actuel
- Modification de l'email (confirmation par lien)
- Bandeau « Complète ton profil » sur le Dashboard tant que le prénom est vide (deep-link `?edit=personal`)

### Dashboard
- Salutation contextuelle selon l'heure (Bonjour / Bon après-midi / Bonsoir)
- Carte « Prochain événement » hero
- Statistiques 2×2 (dépenses à valider, documents, messages, enfants)
- **Flux d'activité unifié** : événements + dépenses + documents triés par date, avec statuts traduits
- Lien discret **« Voir tout l'historique »** vers la page `/history` globale

### Agenda
- 5 types d'événements : garde, vacances, école, santé, autre
- **Aucun événement supprimable** : seule l'annulation (avec motif) est possible
- **Modification** et **annulation** des événements via un modal de détail dédié
- Les événements annulés restent visibles dans la liste du jour (barrés, pill neutre « Annulé », lecture seule) — **pas de rouge**, ton factuel
- **Historique contextuel** dans le modal : chronologie des créations / modifications / annulations avec auteur et diff par champ
- Toute modification est enregistrée dans `event_history` (trigger PL/pgSQL)

### Historique global (`/history`)
- Agrégation des 3 sources : `event_history`, `expense_history`, `documents`
- Filtres pilulaires : Tout / Événements / Dépenses / Documents
- Regroupement par jour (« Aujourd'hui », « Hier », date formatée)
- Chaque entrée lie vers la page d'origine ; raison d'annulation visible pour les `cancelled`
- Parti pris éditorial : **journal factuel neutre**, pas de tableau accusatoire

### Dépenses
- Upload de justificatif (image ou PDF) dans le bucket `documents`
- **Le payeur ne peut pas valider sa propre dépense** (contrainte CHECK au niveau DB)
- Refus obligatoirement motivé (contrainte DB)
- Statuts traduits et colorés : En attente / Validée / Refusée
- Historique complet via `expense_history`

### Documents
- Upload (PDF, images) avec catégorie et enfant optionnel
- URL signées temporaires (60 s) pour la consultation
- Soft-delete : la ligne reste en base avec `deleted_at`

### Messagerie
- Chat en realtime (Supabase Postgres changes)
- **Pièces jointes** : images (preview inline), PDF, bureautique (téléchargement signé)
- Badge de messages non lus dans la bottom nav (marqués comme lus à l'ouverture du chat)
- Aucun message supprimable ni éditable

### Notifications
- Cloche dans le header avec compteur agrégé (dépenses à valider + messages non lus)
- Badge coloré en rouge avec nombre (9+ au-delà)
- Lien intelligent vers la page concernée

### Realtime inter-parents
- Hook `useFamilyRealtime` monté dans `AppLayout` : souscrit aux `postgres_changes` sur `events`, `expenses`, `documents` pour le `family_id` courant
- Invalide les caches TanStack Query (`events`, `expenses`, `documents`, `activity-feed`) à chaque insert/update/delete
- Migration `20260423000001_realtime_shared_tables.sql` : ajoute les trois tables à la publication `supabase_realtime`

### PWA & mises à jour
- `vite-plugin-pwa` en mode `registerType: 'prompt'` + `cleanupOutdatedCaches: true`
- Composant `UpdatePrompt` : bandeau « Une nouvelle version est disponible » dès qu'un nouveau service worker est prêt, avec bouton « Mettre à jour »
- Évite les caches fantômes entre parents après déploiement

### Pages légales
Routes publiques accessibles sans authentification :
- `/mentions-legales` — éditeur, hébergeur, contact, responsabilités
- `/privacy` — RGPD, données collectées, durées, droits, cookies (pas de tracker externe)
- `/cgu` — règles d'usage, parti pris anti-surveillance, modération
- `/cgv` — publiées en prévision du futur abonnement Premium Mollie

Toutes partagent `LegalLayout` (retour, titre, date de mise à jour).

## Principes de conception (non négociables)

- **Neutralité** : aucun champ libre émotionnel, pas de commentaires en roue libre.
- **Factuel** : tout est daté, chiffré, attribué.
- **Horodaté** : chaque événement / dépense / document / message porte `created_at` et un ID d'auteur.
- **Rien n'est supprimé** : les événements ne peuvent être qu'annulés. Les documents sont en soft-delete. Les messages sont indélébiles.
- **Sécurité par la base** : toute la logique d'accès est en RLS Postgres. Le client ne peut rien faire que la RLS ne permette.

## Règles métier à retenir

| Domaine      | Règle |
|--------------|-------|
| Agenda       | Aucun événement supprimable. Toute modif est historisée dans `event_history`. |
| Dépenses     | Le payeur ne peut pas valider sa propre dépense (CHECK + RLS). Refus motivé obligatoire. |
| Documents    | Pas d'édition. Soft delete via `deleted_at`. |
| Messagerie   | Pas d'édition ni de suppression. `read_at` tracke les non-lus. |
| Profils      | Un user voit son propre profil et ceux des membres de sa famille (RLS + fonction `is_family_member`). |
| Familles     | Un user n'appartient qu'à une famille au MVP. |
| Avatars      | Bucket public — photos non sensibles. Les autres buckets sont privés avec URLs signées. |

## Scripts

```bash
npm run dev      # Dev server
npm run build    # Build production
npm run preview  # Prévisualiser le build
npm run lint     # ESLint
```

## Roadmap

### MVP
- [x] Setup Vite + React + Tailwind + PWA
- [x] Auth email/password
- [x] Onboarding (enfant + invitation parent)
- [x] Schéma SQL + RLS
- [x] Agenda complet (création, annulation, historique)
- [x] Dépenses complet (création, validation, refus motivé)
- [x] Documents (upload, soft-delete, URL signées)
- [x] Chat realtime avec pièces jointes
- [x] Profils enrichis (prénom, nom, téléphone, avatar)
- [x] Notifications badgées (cloche + messagerie)
- [x] Événements annulés visibles + historique contextuel + page `/history`
- [x] Realtime inter-parents (events / expenses / documents) + prompt de mise à jour PWA
- [x] Pages légales (mentions, CGU, CGV, RGPD)
- [ ] Intégration Mollie (abonnement + paywall)
- [ ] Emails transactionnels Supabase (confirmation, mot de passe oublié, abonnement)

### V2
- Export PDF certifié
- Notifications push (web push)
- Accès médiateur (lecture seule)
- Multi-familles
- Recherche dans la messagerie
- Réactions / accusés de lecture détaillés

## Éditeur

Christian Grohens — Autoentrepreneur JavaChrist  
5 rue Maurice Fonvieille, 31120 Portet-sur-Garonne  
service@javachrist.fr
