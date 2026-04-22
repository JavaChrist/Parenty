# Parenty

> Organisation parentale partagée, simple et factuelle.

PWA destinée aux parents séparés ou divorcés. L'application centralise les informations liées aux enfants (garde, événements, dépenses, documents) dans un espace neutre, factuel et partagé. **Aucune vocation de médiation ou de conseil juridique.**

## Stack

- **Frontend** : React 18 + Vite + Tailwind CSS + PWA
- **Routing** : React Router v6
- **État** : Zustand (auth) + TanStack Query (données serveur)
- **Backend** : Supabase (Auth, Postgres + RLS, Storage, Edge Functions)
- **Paiement** : Mollie (abonnement mensuel sans engagement)
- **Hébergement** : IONOS (UE)

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 3. Lancer le dev server
npm run dev
```

## Configuration Supabase

1. Crée un projet Supabase (région : UE — Frankfurt ou Paris).
2. Applique les migrations SQL dans l'ordre :
   ```
   supabase/migrations/20260421_0001_initial_schema.sql
   supabase/migrations/20260421_0002_rls_policies.sql
   ```
3. Déploie l'edge function :
   ```bash
   supabase functions deploy invite-parent
   ```
4. Crée un bucket Storage `documents` (privé) et `receipts` (privé).

## Arborescence

```
parenty/
├── public/               # Assets statiques (icônes PWA, favicon…)
├── src/
│   ├── components/
│   │   ├── layout/       # AppLayout, ProtectedRoute
│   │   └── ui/           # Composants réutilisables
│   ├── hooks/            # Hooks custom (à venir : useFamily, useEvents…)
│   ├── lib/              # supabase.js et utilitaires
│   ├── pages/            # Un fichier par écran
│   ├── stores/           # Zustand (authStore)
│   ├── styles/           # CSS global Tailwind
│   ├── App.jsx           # Routes principales
│   └── main.jsx          # Entrée
├── supabase/
│   ├── migrations/       # Schéma SQL + RLS
│   └── functions/        # Edge Functions
└── docs/                 # Documentation projet
```

## Principes de conception (non négociables)

- **Neutralité** : aucun champ libre émotionnel, pas de commentaires en roue libre.
- **Factuel** : tout est daté, chiffré, attribué.
- **Horodaté** : chaque événement/dépense/document porte `created_at` et `created_by`.
- **Rien n'est supprimé** : les événements ne peuvent pas être supprimés (uniquement annulés). Les documents sont en soft-delete.
- **Sécurité par la base** : toute la logique d'accès est en RLS Postgres. Le client ne peut rien faire que la RLS ne permette.

## Règles métier à retenir

| Domaine | Règle |
|---------|-------|
| Agenda | Aucun événement supprimable. Toute modif est historisée dans `event_history`. |
| Dépenses | Le payeur ne peut pas valider sa propre dépense (contrainte CHECK + RLS). Refus obligatoirement motivé. |
| Documents | Pas d'édition. Soft delete via `deleted_at`. |
| Familles | Un user n'appartient qu'à une famille au MVP. |

## Scripts

```bash
npm run dev      # Dev server
npm run build    # Build production
npm run preview  # Prévisualiser le build
npm run lint     # ESLint
```

## Roadmap

### MVP (en cours)
- [x] Setup Vite + React + Tailwind + PWA
- [x] Auth email/password
- [x] Onboarding (enfant + invitation parent)
- [x] Schéma SQL + RLS
- [ ] Agenda complet (création, édition, annulation, historique)
- [ ] Dépenses complet (création, validation, refus motivé)
- [ ] Documents (upload, soft-delete, URL signées)
- [ ] Intégration Mollie (abonnement + paywall)
- [ ] Pages légales (mentions, CGU, CGV, RGPD)

### V2
- Export PDF certifié
- Notifications avancées
- Accès médiateur (lecture seule)
- Multi-familles

## Éditeur

Christian Grohens — Autoentrepreneur JavaChrist  
5 rue Maurice Fonvieille, 31120 Portet-sur-Garonne  
service@javachrist.fr
