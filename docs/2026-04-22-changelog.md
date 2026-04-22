# Changelog — 22 avril 2026 (après-midi)

Récapitulatif des évolutions apportées pendant la session du 22/04/2026 après-midi.

---

## Résumé

Ajout de la gestion complète du **profil utilisateur** (identité + photo + sécurité),
du **chat avec pièces jointes**, d'un **système de notifications réelles** et de diverses
améliorations UX sur le Dashboard et l'authentification.

## ⚠️ Actions de déploiement requises

Deux nouvelles migrations SQL à appliquer sur l'environnement distant Supabase :

1. `supabase/migrations/20260422_0005_profiles_and_avatars.sql`
2. `supabase/migrations/20260422_0006_message_attachments.sql`

Les buckets Storage **`avatars`** (public) et **`chat-attachments`** (privé) sont créés
automatiquement par ces migrations. Aucune action manuelle dans le dashboard.

### Procédure recommandée

Via le SQL Editor du dashboard Supabase :

- Copier-coller le contenu de chaque fichier `.sql` → Run
- Ordre : 0005 puis 0006

Ou via CLI (si le projet est linké) :

```bash
npx supabase db push
```

---

## 1. Profil utilisateur

### Table `public.profiles` (nouvelle)

- 1:1 avec `auth.users` (`id` = user id)
- Colonnes : `first_name`, `last_name`, `phone`, `avatar_path`, `updated_at` (auto)
- **Trigger** `on_auth_user_created` : crée automatiquement une ligne à chaque inscription
- **Backfill** dans la migration pour les comptes déjà existants
- **RLS** : chacun voit son propre profil **et** ceux des membres de sa famille (fonction helper `is_family_member` en SECURITY DEFINER pour éviter la récursion)
- Helper `touch_updated_at()` sur chaque UPDATE

### Bucket `avatars`

- **Public** (les photos sont affichées via `<img src>`, aucune donnée sensible)
- Convention de path : `<user_id>/avatar-<timestamp>.<ext>`
- Policies : lecture publique, écriture / update / delete uniquement dans son propre dossier

### Composant `PersonalInfoForm.jsx`

Modal d'édition du profil qui permet de modifier :

- Prénom / nom / téléphone (écrits dans `profiles`)
- Email (via `supabase.auth.updateUser({ email })`, déclenche un mail de confirmation)
- **Photo de profil** avec preview locale et bouton « Retirer »

### Photo de profil

- Upload depuis le modal du profil
- **Redimensionnement + recadrage carré automatique côté client** (canvas) :
  - Max 512×512 px
  - Export JPEG qualité 0.9
  - Typiquement une photo de 5 Mo devient ~50 Ko
  - GIFs conservés tels quels pour préserver l'animation
- Affichée partout où il y a une identité : header de l'app, page Profil, Dashboard, bloc co-parent

### Changement de mot de passe

- Nouveau composant `ChangePasswordForm.jsx` accessible depuis une nouvelle ligne « Mot de passe » dans la section Compte
- **Vérification du mot de passe actuel** via `signInWithPassword` (sans perdre la session) avant l'update
- Toggle œil unique pour les 3 champs (actuel / nouveau / confirmation)
- Validation : ≥ 8 caractères, nouveau ≠ actuel, confirmation identique

---

## 2. Chat — Pièces jointes

### Schéma

Ajout de 4 colonnes à `public.messages` :

- `attachment_path`, `attachment_mime`, `attachment_name`, `attachment_size`

Le champ `body` devient **nullable** pour autoriser les messages « photo seule ».
Un nouveau `CHECK` garantit qu'un message a soit du texte non vide, soit une PJ.

### Bucket `chat-attachments`

- **Privé** (URLs signées 1h pour la lecture)
- Convention de path : `<family_id>/<uuid>.<ext>`
- RLS : lecture + upload uniquement par les membres de la famille du dossier
- Pas de DELETE ni UPDATE (les messages sont immutables)

### UI (`Chat.jsx`)

- **Trombone actif** : ouvre un file picker (images, PDF, Word, Excel, texte, CSV)
- Limite : 20 Mo
- **Preview** de la PJ au-dessus de la barre d'envoi avant envoi
- **Affichage des bulles** :
  - Images → inline dans la bulle (max-h-64, cliquable pour ouvrir en grand)
  - Autres fichiers → carte compacte avec nom, taille, icône download
  - Skeleton pendant le chargement de l'URL signée
  - Gestion d'erreur (« Pièce jointe indisponible »)
- **Combinaisons supportées** : image + texte, PJ seule, texte seul

---

## 3. Notifications réelles

Fini les faux points rouges hardcodés.

### Nouveaux hooks (`useMessages.js`)

- `useUnreadMessagesCount()` — compte optimisé (`count: 'exact', head: true`) + realtime pour rafraîchir à chaque INSERT/UPDATE de message
- `useMarkMessagesRead()` — marque en batch tous les messages reçus comme lus

### Header (cloche)

- Agrège **dépenses à valider** + **messages non lus**
- Badge rouge avec le nombre (9+ au-delà)
- Link intelligent : `/expenses` si pending > 0, sinon `/chat`
- Icône colorée en `primary` quand il y a des notifications
- `aria-label` dynamique pour l'accessibilité

### Bottom nav — Messagerie

- Badge rouge avec le nombre de messages non lus
- Disparaît quand on est sur l'onglet Chat
- Infrastructure extensible : chaque tab peut recevoir un `badgeKey` → futur : badge Dépenses, etc.

### Chat

- Marque les messages comme lus automatiquement à l'arrivée sur la page et à chaque nouveau message reçu pendant qu'on est dessus

---

## 4. Dashboard

### Salutation contextuelle

- « Bonjour », « Bon après-midi », « Bonsoir » ou « Bonne nuit » selon l'heure
- Utilise le **vrai prénom** de la table `profiles` (plus de fallback sur l'email)
- Prénom mis en avant en `text-primary`

### Flux d'activité unifié

Remplace l'ancien affichage qui ne montrait que les dépenses :

- Mélange **événements + dépenses + documents**, triés par date desc
- 5 items max
- Icône contextuelle par type (`Wallet` / `FileText` / `CalendarDays`)
- **Statuts de dépense traduits** : « En attente » / « Validée » / « Refusée » avec pills colorés (`pill-warning` / `pill-success` / `pill-danger`)
- Dates en relatif : « à l'instant », « il y a 12 min », « il y a 3 h », « il y a 2 j », puis date formatée au-delà d'une semaine
- Helper `timeAgo()` réutilisable

### Bandeau « Complète ton profil »

- Apparaît uniquement si `first_name` est vide dans `profiles`
- CTA qui ouvre directement le modal d'édition via deep-link `/profile?edit=personal`
- Disparaît automatiquement après enregistrement

---

## 5. Authentification

### Toggle œil sur les mots de passe

- Icônes `Eye` / `EyeOff` (lucide-react) dans `SignIn.jsx` et `SignUp.jsx`
- Positionnées en absolu à droite du champ
- Accessibilité complète : `aria-label` dynamique, `aria-pressed`, `tabIndex={-1}` pour ne pas casser la navigation clavier

### Store auth

- Ajout de `setUser(user)` et `refreshUser()` dans `authStore` pour rafraîchir l'état depuis n'importe quel composant après un `supabase.auth.updateUser`

---

## 6. AppLayout

- Avatar dans le header dynamique depuis `profiles` (au lieu de l'initiale de l'email)
- Route `/profile` inchangée

---

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `supabase/migrations/20260422_0005_profiles_and_avatars.sql` | Table `profiles`, bucket `avatars`, RLS, triggers |
| `supabase/migrations/20260422_0006_message_attachments.sql` | Colonnes attachment sur `messages`, bucket `chat-attachments` |
| `src/hooks/useProfile.js` | `useMyProfile`, `useProfiles`, `useUpdateProfile`, `useUploadAvatar`, `useRemoveAvatar`, `getAvatarUrl` |
| `src/components/profile/PersonalInfoForm.jsx` | Modal infos personnelles + avatar |
| `src/components/profile/ChangePasswordForm.jsx` | Modal changement de mot de passe |

## Fichiers modifiés

- `src/stores/authStore.js` — `setUser`, `refreshUser`
- `src/hooks/useMessages.js` — `useUnreadMessagesCount`, `useMarkMessagesRead`, `useSendMessage` (avec fichier), `getChatAttachmentUrl`
- `src/pages/Profile.jsx` — avatar, profiles, lignes Mot de passe / Infos perso, deep-link `?edit=personal`
- `src/pages/Dashboard.jsx` — salutation contextuelle, feed unifié, bandeau « Complète ton profil »
- `src/pages/Chat.jsx` — trombone actif, preview, affichage pièces jointes, mark-as-read
- `src/pages/SignIn.jsx` — toggle œil
- `src/pages/SignUp.jsx` — toggle œil
- `src/components/layout/AppLayout.jsx` — avatar dynamique, cloche avec vrai compteur, badge messagerie
- `README.md` — refonte complète avec nouvelles fonctionnalités

---

## Points à traiter dans une prochaine session

- Audit de **contraste** des pills (`pill-warning` / `pill-success` actuellement utilisent les mêmes teintes que `pill-primary` / `pill-accent`)
- **Drag-and-drop** dans le chat pour les pièces jointes
- **Compression côté client** des images envoyées dans le chat (réutiliser `resizeImage` du hook avatar avec un `maxSize: 1600`)
- **Lightbox** pour l'affichage plein écran des images dans le chat (actuellement ouverture dans un nouvel onglet)
- **Renommage des migrations** au format 14 chiffres attendu par le CLI Supabase (pour que `supabase db push` fonctionne sans friction)
