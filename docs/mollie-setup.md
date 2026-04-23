# Configuration Mollie — Parenty Premium

Ce document décrit la mise en place de l'abonnement **Parenty Premium**
(6,99 € / mois, sans période d'essai) via **Mollie**.

---

## 1. Ce qui est en place côté code

### Base de données

Migration `supabase/migrations/20260423000003_mollie_billing.sql` :

- Ajoute sur `families` : `mollie_customer_id`, `mollie_subscription_id`,
  `mollie_mandate_id`.
- Crée la table `billing_events` pour auditer tous les événements Mollie.

Migration `supabase/migrations/20260423000004_free_plan_children_limit.sql` :

- Trigger `enforce_free_plan_children_limit` qui bloque la création d'un
  2ᵉ enfant si `subscription_status != 'active'`.

### Edge Functions

Trois fonctions dans `supabase/functions/` :

| Fonction                        | JWT | Rôle                                                           |
| ------------------------------- | --- | -------------------------------------------------------------- |
| `mollie-create-subscription`    | ✅   | Crée customer Mollie + first payment, renvoie `checkoutUrl`    |
| `mollie-webhook`                | ❌   | Reçoit les events Mollie (paid / failed / canceled)            |
| `mollie-cancel-subscription`    | ✅   | Résilie la subscription active (uniquement par l'owner)        |

Le flow Mollie :

1. Utilisateur clique **« Passer au Premium »** sur `/profile`
2. `mollie-create-subscription` crée un **customer** puis un **first payment**
   (`sequenceType: first`) de 6,99 € et renvoie le `checkoutUrl`
3. Le navigateur redirige vers Mollie, l'utilisateur paie
4. Mollie redirige vers `/subscribe/success` côté app
5. En parallèle, Mollie appelle le **webhook** → on crée la subscription
   récurrente et on passe la famille en `active`
6. Chaque mois, Mollie crée un paiement récurrent → webhook étend
   `subscription_ends_at`

### Frontend

- `/profile` : bouton « Passer au Premium » qui appelle le hook
  `useStartSubscription` (`src/hooks/useBilling.js`)
- `/profile` : bouton « Résilier » (visible uniquement pour l'owner si
  `subscription_status = 'active'`)
- `/subscribe/success` : page atterrissage qui attend la confirmation du
  webhook et redirige vers le profil
- `usePlanLimits` (`src/hooks/usePlanLimits.js`) : règle « 1 enfant gratuit »
  partagée UI + DB

---

## 2. Ce qu'il reste à configurer dans les dashboards

### 2.1 Mollie Dashboard

1. Se connecter sur <https://my.mollie.com>
2. **Developers → API keys** → copier la **Live API Key** (`live_xxx…`)
   ou la Test key (`test_xxx…`) selon l'environnement souhaité
3. **Developers → Webhooks** (optionnel) : Mollie utilise l'URL passée
   dans chaque paiement ; pas besoin de webhook global
4. Dans **Settings → Website profiles** : renseigner
   `https://parenty.vercel.app` comme profile web

### 2.2 Secrets Supabase Edge Functions

Ouvrir **Supabase Dashboard → Edge Functions → Manage secrets** et ajouter :

```
MOLLIE_API_KEY=live_xxxxxxxxxxxxxxxxxxxxxxx
APP_URL=https://parenty.vercel.app
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont déjà présents par défaut.

Optionnel — si un jour tu mets le webhook sur un autre domaine :

```
MOLLIE_WEBHOOK_URL=https://parenty.vercel.app/api/mollie-webhook
```

Par défaut, l'URL est reconstruite automatiquement :
`${SUPABASE_URL}/functions/v1/mollie-webhook`.

### 2.3 Déploiement des fonctions

Depuis la racine du repo :

```bash
supabase functions deploy mollie-create-subscription
supabase functions deploy mollie-webhook --no-verify-jwt
supabase functions deploy mollie-cancel-subscription
```

Note : le flag `--no-verify-jwt` est facultatif si ton `config.toml` est
synchronisé avec la plateforme (c'est déjà configuré dans le repo).

### 2.4 Appliquer les migrations

```bash
# Avec la CLI Supabase liée au projet distant
supabase db push
```

Ou copier-coller le contenu des fichiers
`supabase/migrations/20260423000003_mollie_billing.sql` et
`supabase/migrations/20260423000004_free_plan_children_limit.sql` dans
**SQL Editor**.

---

## 3. Tester le flow en mode Test

1. Basculer la clé Mollie en `test_xxx…` dans les secrets
2. Sur `/profile`, cliquer « Passer au Premium »
3. Mollie propose différentes **méthodes de test** (carte, iDEAL…) — choisir
   une carte test et statut **paid**
4. Retour sur `/subscribe/success` puis `/profile` qui affiche **Premium**
5. Vérifier dans **Supabase → Table Editor → families** que
   `subscription_status = 'active'` et que `mollie_subscription_id` est
   renseigné
6. Vérifier dans **billing_events** que l'event `payment.paid` est tracé

Pour tester la résiliation :

1. Cliquer **Résilier l'abonnement** sur `/profile`, confirmer
2. Vérifier sur Mollie Dashboard que la subscription passe `canceled`
3. Vérifier en base que `subscription_status = 'cancelled'`

---

## 4. Debug

### Les logs Edge Functions

```bash
supabase functions logs mollie-webhook --follow
supabase functions logs mollie-create-subscription --follow
```

### Les events Mollie reçus

```sql
select event_type, received_at, payload->>'status' as status
  from billing_events
 order by received_at desc
 limit 20;
```

### Replay d'un webhook manuel

```bash
curl -X POST "$SUPABASE_URL/functions/v1/mollie-webhook" \
  -H "content-type: application/x-www-form-urlencoded" \
  -d "id=tr_xxxxxxxxxxxx"
```

(N'oublie pas : le contenu est ignoré, c'est l'état récupéré depuis Mollie
qui fait foi.)

---

## 5. Limitations connues

- L'annulation immédiate passe la famille en `cancelled` tout de suite.
  L'utilisateur conserve néanmoins l'accès jusqu'à `subscription_ends_at`.
  Un futur cron pourra rétrograder en `free` à la date exacte.
- Les méthodes de paiement disponibles dépendent de la config Mollie
  (`Settings → Payment methods`). Au minimum : **Carte bancaire** pour la
  France.
