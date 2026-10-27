# Parenty

Application web installable (PWA) pour l’organisation parentale partagée. Deux adultes d’une même famille y retrouvent l’agenda, les gardes, les dépenses, les documents et une messagerie, avec un historique daté.

Parenty s’adresse à des personnes majeures qui organisent le quotidien d’un ou plusieurs enfants, qu’elles soient séparées ou non. Les conditions d’utilisation précisent que l’historique est une mémoire partagée, et non un outil de surveillance ni une preuve destinée à une procédure.

Version indiquée dans le projet : **0.1.0**. La mise en ligne effective reste **à confirmer** : la configuration de déploiement et l’adresse citée dans les mentions légales ne prouvent pas que le site répond.

## Fonctionnalités

### Opérationnelles dans le code

Ces écrans et règles sont branchés sur Supabase (données, droits d’accès, fichiers ou fonctions serveur). Ils fonctionnent une fois le projet Supabase configuré et les migrations appliquées.

**Compte et famille**

- Inscription et connexion par e-mail et mot de passe.
- Mot de passe oublié et réinitialisation, avec redirection dédiée si le lien de récupération arrive sur une autre page.
- Premier parcours : création de la famille et du premier enfant, puis invitation du co-parent (étape que l’on peut quitter).
- Invitation par e-mail, lien valable 7 jours, page publique `/invite?token=…`. Si l’envoi d’e-mail échoue, l’application propose le lien à copier. Une personne qui a déjà sa propre famille seule peut la quitter pour rejoindre celle qui l’invite.
- Profil : prénom, nom, téléphone, photo (recadrage carré, 512 px). Changement d’e-mail avec confirmation. Changement de mot de passe après vérification du mot de passe actuel.
- Un compte n’appartient qu’à une famille. Rôles `owner` et `parent`.
- Enfant retirable de la liste (masquage en base, la ligne n’est pas effacée).

**Agenda**

- Calendrier mensuel et liste du jour.
- Événements : garde, vacances, école, santé, autre. Création, modification, annulation avec motif. Un événement annulé reste visible, barré. Aucune suppression.
- Chaque changement est enregistré dans un historique (auteur, action, état).
- Schémas de garde récurrents : chaque semaine, ou une semaine sur deux (semaines paires ou impaires), avec horaires et parent responsable. L’agenda les affiche comme des événements calculés à l’écran, sans les recopier un par un en base. Un schéma peut être modifié ou retiré de l’affichage.

**Dépenses**

- Saisie avec montant, date, catégorie, enfant facultatif et justificatif (image ou PDF, 10 Mo max).
- Catégories : école, sortie scolaire, santé, vêtements, alimentation, loisirs, sport, vacances, transport, cadeaux, garde d’enfants, autre.
- Partage : moitié-moitié, tout à la charge du payeur, tout à la charge du co-parent, pourcentage libre ou montant libre en euros.
- L’autre parent valide ou refuse. Un refus exige un motif. Le payeur ne peut pas valider sa propre dépense (règle en base).
- Une dépense peut être corrigée ensuite. Le payeur d’origine ne change pas. Le statut n’est pas modifié par cette correction.
- Total du mois, « tu as payé », « ta part », et solde envers le co-parent, calculé sur les dépenses validées du mois. Le calcul est prévu pour deux parents.
- Graphique annuel des montants payés et des parts, hors dépenses refusées (les dépenses en attente y sont incluses).

**Documents**

- Dépôt de PDF et d’images, avec catégorie (école, santé, administratif, légal, autre) et enfant facultatif.
- Consultation par lien temporaire (60 secondes). Le retrait masque le document et supprime le fichier stocké. La ligne reste en base.

**Messagerie**

- Fil de messages entre les membres de la famille, mis à jour à l’arrivée d’un nouveau message.
- Pièces jointes : images, PDF, documents bureautique, texte et CSV (20 Mo max). Aperçu des images, lien temporaire d’une heure pour le téléchargement.
- Les messages ne se modifient pas et ne se suppriment pas. L’ouverture de la messagerie marque les messages reçus comme lus. Un badge indique les non-lus.

**Accueil, historique et synchronisation**

- Accueil : salutation, prochain événement, nombre de dépenses à valider, nombre de documents, nombre d’enfants, et cinq éléments récents (dépenses, documents, événements à venir).
- Cloche du bandeau : dépenses en attente de validation par l’autre parent, plus messages non lus. Au-delà de 9, l’affichage indique « 9+ ».
- Page Historique : journal des changements d’événements, de dépenses et de documents, filtré et regroupé par jour. Chaque source est limitée aux 100 derniers enregistrements.
- Les événements, dépenses et documents de l’autre parent rafraîchissent les écrans ouverts, sans rechargement manuel.

**Abonnement**

- Plan gratuit par défaut. Parenty Premium est codé à **6,99 € TTC par mois**, sans période d’essai, payable via Mollie.
- Le gratuit est limité, dans l’interface et en base, à **1 enfant**, **10 documents actifs** et **10 dépenses par mois** (hors dépenses refusées). L’historique affiché est limité à **1 an** : ce filtre est appliqué à l’écran, pas par la base.
- Premium lève ces plafonds. Le propriétaire du compte familial peut résilier. L’accès payant reste indiqué jusqu’à la date de fin de période renvoyée par le paiement.
- Parcours : paiement Mollie, retour sur `/subscribe/success`, activation par le webhook, historique des paiements sur `/billing`.
- Le texte des CGV ne mentionne que la limite d’un enfant. L’application applique aussi les plafonds de documents, de dépenses et d’historique.

**Autres écrans**

- Pages publiques : mentions légales, confidentialité, CGU, CGV.
- Page `/install` : QR code et mode d’emploi pour installer l’application sur Android ou iPhone, y compris une version imprimable.
- Application installable, avec un bandeau lorsqu’une nouvelle version est prête.
- Si le chargement dépasse cinq secondes, un bouton permet de réinitialiser l’application locale (déconnexion comprise).

### Partielles

- L’historique ne pagine pas : au-delà de 100 lignes par source, les plus anciennes ne sont pas chargées.
- La limite d’un an du plan gratuit ne s’applique qu’à cet historique déjà chargé.
- Le fil de l’accueil reprend des éléments courants. Le journal complet est la page Historique.
- La messagerie écoute les nouveaux messages. Le passage en « lu » n’est pas diffusé en temps réel par ce même canal.
- Les schémas de garde n’ont pas de gestion d’exceptions (un jour férié ou un échange ponctuel se saisit comme un événement à part).
- Le service worker met en cache l’interface. Les appels à Supabase (connexion, données, fichiers) ne sont pas mis en cache : les données demandent une connexion.
- Le script `npm run sb:deploy` ne déploie que les fonctions d’invitation. Les fonctions Mollie se déploient à part.
- La configuration locale Supabase désactive la confirmation d’e-mail à l’inscription. Le réglage du projet distant est **à confirmer**.
- La région de stockage « Francfort » est indiquée dans les mentions légales. Elle n’est pas fixée dans les fichiers de configuration du dépôt.

### Simulées

- Sur l’accueil, la carte « Messages » affiche un tiret et le mot « bientôt ». Le vrai compteur de non-lus est le badge de la messagerie et la cloche.
- Le bouton emoji de la messagerie est affiché et désactivé, avec le libellé « bientôt ».
- La ligne « Notifications » du profil affiche « À venir » et n’ouvre aucun réglage.

### Prévues ou absentes du code

Indiquées dans l’interface, sans écran derrière :

- réglages de notifications ;
- sélecteur d’emoji ;
- compteur de messages sur l’accueil ;
- pagination de l’historique ;
- exceptions sur un schéma de garde.

Absentes du code (elles figuraient dans une version antérieure de ce document) : export PDF, notifications push, accès médiateur, plusieurs familles par compte, recherche dans la messagerie, réactions aux messages.

## Stack

- Interface : React 18, Vite, Tailwind CSS, PWA (`vite-plugin-pwa`)
- Navigation : React Router 6
- État : Zustand pour la session, TanStack Query pour les données
- Données : Supabase (Auth, Postgres avec règles d’accès par famille, Storage, Realtime, Edge Functions)
- E-mails d’invitation : Resend, appelé par la fonction `invite-parent`
- Paiement : Mollie
- Fichiers prévus pour l’hébergement de l’interface : `vercel.json` (reprise de toutes les adresses vers `index.html`)
- Police : Manrope (Google Fonts)

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

Le serveur de développement écoute le port **5173**. Renseigner les variables ci-dessous avant de lancer l’application : sans elles, le client Supabase ne peut pas démarrer.

## Configuration

Aucune valeur secrète ne figure ici. Copier `.env.example` vers `.env.local` et renseigner les noms suivants.

**Côté navigateur** (fichier `.env.local`) :

| Variable | Rôle |
| --- | --- |
| `VITE_SUPABASE_URL` | Adresse du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anon / publishable. Ne jamais y mettre la clé `service_role`. |
| `VITE_APP_URL` | Adresse publique utilisée pour les liens d’invitation et le QR code d’installation |

**Côté fonctions Supabase** (secrets du projet, pas dans le dépôt) :

| Variable | Rôle |
| --- | --- |
| `RESEND_API_KEY` | Envoi de l’e-mail d’invitation |
| `RESEND_FROM` | Expéditeur de cet e-mail |
| `APP_URL` | Adresse de retour utilisée par les fonctions (invitation, paiement) |
| `MOLLIE_API_KEY` | Clé API Mollie |
| `MOLLIE_WEBHOOK_URL` | Facultatif. Sans elle, le webhook est celui de la fonction Supabase |

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis par la plateforme aux fonctions. Ne pas les placer dans `.env.local`.

L’adresse publique écrite dans les mentions légales, dans `.env.example` et en repli dans le code est `https://parenty.vercel.app`.

### Base de données

Appliquer les migrations dans l’ordre des noms de fichiers, via `npm run sb:db:push` ou le SQL Editor :

1. `20260421000001_initial_schema.sql`
2. `20260421000002_rls_policies.sql`
3. `20260422000003_storage_documents.sql`
4. `20260422000004_messages.sql`
5. `20260422000005_profiles_and_avatars.sql`
6. `20260422000006_message_attachments.sql`
7. `20260422000007_user_deletion_cascade.sql`
8. `20260423000001_realtime_shared_tables.sql`
9. `20260423000002_bootstrap_family_rpc.sql`
10. `20260423000003_mollie_billing.sql`
11. `20260423000004_free_plan_children_limit.sql`
12. `20260424000001_free_plan_full_limits.sql`
13. `20260424000002_custody_schedules.sql`
14. `20260424000003_expense_categories_extra.sql`
15. `20260424000004_expense_share_split.sql`
16. `20260424000005_expense_share_amount.sql`

Les trois espaces de fichiers sont créés par les migrations :

| Espace | Visibilité | Usage |
| --- | --- | --- |
| `documents` | Privé | Documents partagés et justificatifs de dépenses |
| `avatars` | Public | Photos de profil |
| `chat-attachments` | Privé | Pièces jointes de la messagerie |

### Fonctions serveur

```bash
npm run sb:deploy
supabase functions deploy mollie-create-subscription
supabase functions deploy mollie-webhook --no-verify-jwt
supabase functions deploy mollie-cancel-subscription
supabase functions deploy mollie-payment-status
```

`npm run sb:deploy` publie `invite-parent` et `accept-invite`. Le webhook Mollie n’exige pas de jeton utilisateur : la fonction relit l’état du paiement auprès de Mollie.

Guides déjà présents dans le dépôt : `docs/mollie-setup.md`, `docs/supabase-email-setup.md`, `SETUP.md`. Le fichier `docs/ARCHITECTURE.md` décrit un état antérieur (paiement présenté comme à venir, hébergeur différent de celui des mentions légales). Ce README s’aligne sur le code actuel.

## Modèle de données

| Élément | Rôle |
| --- | --- |
| `families` | Espace familial, statut d’abonnement, identifiants Mollie |
| `family_members` | Lien compte ↔ famille (`owner` ou `parent`) |
| `profiles` | Prénom, nom, téléphone, photo |
| `children` | Enfants, avec date de retrait possible |
| `events`, `event_history` | Agenda et journal des changements |
| `custody_schedules` | Gardes récurrentes |
| `expenses`, `expense_history` | Dépenses, partage, validation, journal |
| `documents` | Fichiers partagés |
| `messages` | Messagerie et pièces jointes |
| `invitations` | Invitation du co-parent |
| `billing_events` | Journal des événements de paiement reçus |

L’accès aux lignes est limité à la famille du compte connecté. Les règles sensibles (validation d’une dépense, motif de refus, plafonds du gratuit, historique des changements) sont portées par la base.

## Écrans

| Adresse | Accès | Rôle |
| --- | --- | --- |
| `/signin`, `/signup` | Public | Connexion, inscription |
| `/forgot-password`, `/reset-password` | Public | Mot de passe |
| `/invite` | Public | Acceptation d’une invitation |
| `/install` | Public | Installation sur téléphone |
| `/mentions-legales`, `/privacy`, `/cgu`, `/cgv` | Public | Pages légales |
| `/onboarding/child`, `/onboarding/invite` | Compte | Première famille |
| `/` | Famille | Accueil |
| `/calendar` | Famille | Agenda et gardes |
| `/expenses` | Famille | Dépenses |
| `/documents` | Famille | Documents |
| `/chat` | Famille | Messagerie |
| `/profile` | Famille | Profil, enfants, invitation, abonnement |
| `/billing` | Famille | Paiements |
| `/history` | Famille | Journal |
| `/subscribe/success` | Famille | Retour après paiement |

## Commandes

```bash
npm run dev              # serveur de développement
npm run build            # construction de production
npm run preview          # prévisualisation du build
npm run lint             # ESLint
npm run sb:login         # connexion à la CLI Supabase
npm run sb:link          # lien avec le projet distant
npm run sb:db:push       # application des migrations
npm run sb:deploy        # fonctions d’invitation uniquement
npm run sb:secrets       # liste des noms de secrets
npm run sb:logs:invite   # journaux de invite-parent
npm run sb:logs:accept   # journaux de accept-invite
```

## Éditeur indiqué dans l’application

Christian Grohens, auto-entrepreneur, 5 rue Maurice Fonvieille, 31120 Portet-sur-Garonne. Contact affiché dans les pages légales : support@javachrist.fr, +33 9 52 62 31 71. SIRET indiqué dans les CGV : 338 593 312.
