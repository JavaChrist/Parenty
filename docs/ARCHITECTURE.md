# Architecture technique — Parenty

## 1. Vue d'ensemble

```
┌──────────────────────┐
│   PWA React (Vite)   │  ← client unique, installable
│   + Service Worker   │
└──────────┬───────────┘
           │ HTTPS
           ▼
┌──────────────────────┐
│   Supabase JS SDK    │
└──────────┬───────────┘
           │
    ┌──────┴──────┬─────────────┬────────────────┐
    ▼             ▼             ▼                ▼
┌────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐
│  Auth  │  │ Postgres │  │ Storage  │  │ Edge Functions│
│        │  │  + RLS   │  │  (fichiers)│ │ (Mollie, mail)│
└────────┘  └──────────┘  └──────────┘  └───────┬───────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │    Mollie    │
                                         └──────────────┘
```

## 2. Responsabilités par couche

### 2.1 PWA React
- UI, routing, état local.
- Ne contient **aucune** logique de sécurité.
- Communique exclusivement via le SDK Supabase.
- Offline-first sur les données de lecture (cache TanStack Query + service worker).

### 2.2 Supabase Auth
- Email + mot de passe uniquement au MVP.
- Pas de Magic Link ni OAuth (périmètre MVP).
- Vérification d'email activée.

### 2.3 Postgres + RLS
- **Toute** la sécurité est ici.
- Fonction `current_family_id()` stable, utilisée dans chaque policy.
- Aucune policy ne permet de contourner la `family_id`.
- Les contraintes métier critiques sont des CHECK SQL (ex : payeur ≠ validateur).
- Les historiques sont en triggers (jamais côté client).

### 2.4 Storage
- Bucket `documents` (privé) : pièces du coffre-fort.
- Bucket `receipts` (privé) : justificatifs de dépense.
- Accès **uniquement via URL signées** générées côté client authentifié.
- Les chemins suivent la convention `family_id/child_id/uuid-filename.ext`.

### 2.5 Edge Functions
- `invite-parent` : création d'une invitation + envoi d'email.
- `mollie-webhook` (à venir) : réception des événements Mollie (abonnement activé, échec paiement, annulation).
- `mollie-create-subscription` (à venir) : création d'une souscription pour une famille.

## 3. Modèle de données

### Relations principales

```
auth.users ─────< family_members >───── families
                                          │
                     ┌────────────────────┼────────────────────┐
                     ▼                    ▼                    ▼
                 children             events ──> event_history
                     │                    │
                     │                 expenses ──> expense_history
                     │                    │
                     └─────────────> documents
                                      │
                                invitations
```

### Invariants garantis par la base

1. Un user ne voit jamais que sa `family_id` (RLS).
2. Un événement créé ne peut pas être DELETE (aucune policy DELETE).
3. Une dépense ne peut pas être validée par son payeur (CHECK + RLS).
4. Un refus de dépense sans motif est rejeté (CHECK).
5. Toute modif d'event/expense est historisée automatiquement (trigger).

## 4. Flux critiques

### 4.1 Inscription → première famille
1. `supabase.auth.signUp()`
2. Email de confirmation (optionnel selon config)
3. Après premier signin : `/onboarding/child`
4. `insert into families` → trigger `on_family_created` crée le `family_member` avec role `owner`
5. `insert into children`
6. `/onboarding/invite` (optionnel)

### 4.2 Invitation second parent
1. Parent A crée une invitation via Edge Function `invite-parent`
2. Token unique + email envoyé
3. Parent B clique, crée son compte, puis `/invite/:token` consomme l'invitation
4. Edge Function (service_role) insère B dans `family_members`

### 4.3 Création d'une dépense
1. Parent A (payeur) insère (`status=pending`, `payer_id=A`)
2. Parent B consulte, peut valider (`status=approved`, `validated_by=B`) ou refuser avec motif (`status=rejected`, `reject_reason=...`)
3. La CHECK constraint + RLS garantissent que A ne peut pas se valider lui-même.
4. Le trigger `trg_expense_history` enregistre chaque transition.

### 4.4 Abonnement Mollie
1. Depuis `/profile`, l'utilisateur clique "S'abonner"
2. Edge Function `mollie-create-subscription` :
   - crée un customer Mollie si besoin
   - crée une subscription
   - stocke `mollie_customer_id` et `mollie_subscription_id` dans `families`
3. Mollie redirige vers la page de paiement
4. Webhook `mollie-webhook` met à jour `subscription_status` et `subscription_ends_at`

## 5. PWA et offline

- **Manifest** et **service worker** générés par `vite-plugin-pwa`.
- Cache stratégie `NetworkFirst` pour les appels Supabase (fallback sur cache si offline).
- Pas de mutations offline au MVP (trop risqué vis-à-vis des règles métier de validation).

## 6. Sécurité & RGPD

| Aspect | Mesure |
|--------|--------|
| Chiffrement transit | HTTPS (Supabase + IONOS) |
| Chiffrement repos | Géré par Supabase/Postgres |
| Isolation tenant | RLS par `family_id` sur toutes les tables |
| Stockage fichiers | URL signées uniquement, expiration courte |
| Mot de passe | Hashé côté Supabase (bcrypt) |
| Données UE | Supabase région UE + IONOS UE |
| Durée de conservation | 24 mois après suppression de compte |
| Export données | Sur demande à service@javachrist.fr |

## 7. Dette technique / points d'attention

- La fonction `current_family_id()` suppose un user = une famille. À revoir si V2 multi-familles.
- Les edge functions ne sont pas encore typées (Deno). Prévoir une validation zod côté serveur.
- Prévoir un rate limit sur les invitations pour éviter le spam.
- Les uploads Storage devraient passer par un pré-check de mime type + taille max.
