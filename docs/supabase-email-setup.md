# Emails Supabase — configuration Parenty

Document de référence pour configurer les emails transactionnels de Supabase
Auth depuis le Dashboard. Chaque template est donné en HTML + texte brut, en
français, sobre, avec le branding Parenty.

## Sommaire

1. [Configuration générale (Site URL, Redirect URLs)](#configuration-générale)
2. [Template : Reset Password](#template--reset-password)
3. [Template : Confirm signup (si réactivé plus tard)](#template--confirm-signup)
4. [Template : Change email address](#template--change-email-address)
5. [SMTP custom (optionnel mais recommandé en prod)](#smtp-custom)

---

## Configuration générale

**Dashboard Supabase → Authentication → URL Configuration**

| Champ                        | Valeur à mettre |
|------------------------------|------------------------------------------|
| **Site URL**                 | `https://parenty.vercel.app` |
| **Redirect URLs** (allowlist) | `https://parenty.vercel.app/**` |

> Le `/**` autorise `/reset-password`, `/invite`, `/update-email` et toute
> autre page publique à recevoir les redirections. Sans ça, Supabase refuse
> d'envoyer les liens et les emails arrivent avec une URL par défaut cassée.

> Pour le dev local, ajoute aussi `http://localhost:5173/**` à la liste.

---

## Template : Reset Password

**Dashboard → Authentication → Notifications → Email → Templates → Reset Password**

> Dans les versions récentes de Supabase, les templates d'email sont rangés
> sous `Authentication > Notifications > Email`, pas sous `Email Templates`
> directement. Cherche la section **NOTIFICATIONS** dans la barre latérale de
> Authentication, clique sur **Email**, puis sélectionne l'onglet
> **Templates**.

### Subject (objet)

```
Réinitialisation de ton mot de passe Parenty
```

### Message body (HTML)

```html
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1c1e;line-height:1.55;">
  <tr>
    <td style="padding:32px 24px 16px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#00685f;letter-spacing:-0.5px;">Parenty</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 24px 0;">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1a1c1e;">Réinitialisation de ton mot de passe</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#41474d;">
        Tu as demandé à réinitialiser le mot de passe de ton compte Parenty.
        Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 24px 24px;text-align:center;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;background:#00685f;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
        Réinitialiser mon mot de passe
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px 16px;">
      <p style="margin:0 0 8px;font-size:13px;color:#73787e;">
        Ce lien est valide <strong>1 heure</strong>. Si tu n'es pas à l'origine
        de cette demande, ignore cet email — ton mot de passe ne sera pas modifié.
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#73787e;">
        Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur :
      </p>
      <p style="margin:0;font-size:12px;word-break:break-all;">
        <a href="{{ .ConfirmationURL }}" style="color:#00685f;">{{ .ConfirmationURL }}</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:24px;border-top:1px solid #e3e4e6;text-align:center;font-size:12px;color:#73787e;">
      <p style="margin:0 0 4px;">
        Parenty — Organisation parentale partagée, simple et factuelle.
      </p>
      <p style="margin:0;">
        <a href="https://parenty.vercel.app" style="color:#00685f;text-decoration:none;">parenty.vercel.app</a>
        &nbsp;·&nbsp;
        <a href="mailto:support@javachrist.fr" style="color:#00685f;text-decoration:none;">support@javachrist.fr</a>
      </p>
    </td>
  </tr>
</table>
```

---

## Template : Confirm signup

**Dashboard → Authentication → Notifications → Email → Templates → Confirm signup**

À activer uniquement si tu réactives la confirmation email dans
`Authentication → Providers → Email → Confirm email`.

### Subject

```
Bienvenue sur Parenty — confirme ton email
```

### Message body (HTML)

```html
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1c1e;line-height:1.55;">
  <tr>
    <td style="padding:32px 24px 16px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#00685f;letter-spacing:-0.5px;">Parenty</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 24px 0;">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;">Bienvenue 👋</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#41474d;">
        Merci d'avoir créé un compte Parenty. Pour activer ton compte et
        commencer à l'utiliser, confirme ton adresse email en cliquant sur
        le bouton ci-dessous.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 24px 24px;text-align:center;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;background:#00685f;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
        Confirmer mon email
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px 16px;">
      <p style="margin:0 0 8px;font-size:13px;color:#73787e;">
        Si tu n'es pas à l'origine de cette inscription, ignore cet email.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:24px;border-top:1px solid #e3e4e6;text-align:center;font-size:12px;color:#73787e;">
      <p style="margin:0;">
        Parenty · <a href="https://parenty.vercel.app" style="color:#00685f;text-decoration:none;">parenty.vercel.app</a>
        &nbsp;·&nbsp;
        <a href="mailto:support@javachrist.fr" style="color:#00685f;text-decoration:none;">support@javachrist.fr</a>
      </p>
    </td>
  </tr>
</table>
```

---

## Template : Change email address

**Dashboard → Authentication → Notifications → Email → Templates → Change email address**

Envoyé à l'ancienne ET à la nouvelle adresse quand un user modifie son email
depuis `/profile`.

### Subject

```
Confirmation du changement d'adresse email Parenty
```

### Message body (HTML)

```html
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1c1e;line-height:1.55;">
  <tr>
    <td style="padding:32px 24px 16px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#00685f;letter-spacing:-0.5px;">Parenty</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 24px 0;">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;">Changement d'adresse email</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#41474d;">
        Tu as demandé à remplacer ton adresse email par <strong>{{ .NewEmail }}</strong>.
        Pour confirmer, clique sur le bouton ci-dessous.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 24px 24px;text-align:center;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;background:#00685f;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
        Confirmer le changement
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px 16px;">
      <p style="margin:0 0 8px;font-size:13px;color:#73787e;">
        Si tu n'es pas à l'origine de cette demande, ignore cet email et
        change immédiatement ton mot de passe.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:24px;border-top:1px solid #e3e4e6;text-align:center;font-size:12px;color:#73787e;">
      <p style="margin:0;">
        Parenty · <a href="https://parenty.vercel.app" style="color:#00685f;text-decoration:none;">parenty.vercel.app</a>
        &nbsp;·&nbsp;
        <a href="mailto:support@javachrist.fr" style="color:#00685f;text-decoration:none;">support@javachrist.fr</a>
      </p>
    </td>
  </tr>
</table>
```

---

## SMTP custom

Par défaut, Supabase envoie depuis `noreply@mail.app.supabase.io`, un domaine
partagé souvent marqué comme spam. Pour que tes emails arrivent en boîte de
réception, brancher un SMTP custom (Resend, ou SMTP IONOS `javachrist.fr`).

**Dashboard → Authentication → Notifications → Email → SMTP** (onglet à côté de
Templates). Active `Enable Custom SMTP`.

### Option A — Resend (recommandé)

1. Créer un compte sur [resend.com](https://resend.com) (free tier 100/j)
2. Ajouter et **vérifier le domaine `javachrist.fr`** (enregistrements
   SPF + DKIM à ajouter dans ton DNS — voir l'écran de Resend, c'est guidé)
3. Créer une API Key dédiée à Supabase
4. Remplir dans Supabase :

   | Champ | Valeur |
   |---|---|
   | Sender email | `noreply@javachrist.fr` |
   | Sender name | `Parenty` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | la clé API Resend |
   | Minimum interval | `60` (seconds) |

5. Tester avec **Send test email** dans Supabase

### Option B — SMTP IONOS (si tu as déjà `support@javachrist.fr` chez IONOS)

| Champ | Valeur |
|---|---|
| Host | `smtp.ionos.fr` |
| Port | `587` (STARTTLS) ou `465` (SSL) |
| Username | `support@javachrist.fr` (ou le compte que tu veux utiliser) |
| Password | ton mot de passe IONOS |
| Sender email | `noreply@javachrist.fr` ou `support@javachrist.fr` |
| Sender name | `Parenty` |

> Le compte IONOS qui envoie DOIT avoir un alias `noreply@` si tu veux
> utiliser cette adresse en expéditeur, sinon IONOS rejette avec erreur 553.

---

## Email d'invitation co-parent (Edge Function `invite-parent`)

L'invitation co-parent n'utilise PAS les templates Supabase Auth (ceux-ci sont
réservés aux flux d'authentification). On envoie l'email nous-mêmes depuis
l'Edge Function `invite-parent` via l'API Resend.

### 1. Secrets à configurer

**Dashboard Supabase → Project Settings → Edge Functions → Secrets** (ou via CLI)

| Secret | Valeur | Notes |
|---|---|---|
| `APP_URL` | `https://parenty.vercel.app` | Sans slash final |
| `RESEND_API_KEY` | `re_...` | Même clé que pour le SMTP custom, ou une clé dédiée |
| `RESEND_FROM` | `Parenty <noreply@javachrist.fr>` | Optionnel, défaut identique |

Version CLI :

```bash
supabase secrets set APP_URL=https://parenty.vercel.app
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set RESEND_FROM="Parenty <noreply@javachrist.fr>"
```

### 2. Déploiement de la fonction

```bash
supabase functions deploy invite-parent
```

### 3. Template de l'email

Le HTML est intégré au code de la fonction (`supabase/functions/invite-parent/index.ts`),
personnalisé avec le prénom de l'invitant et le nom de la famille. Il reprend
le design des autres emails Parenty.

### 4. Comportement en cas d'échec d'envoi

Si `RESEND_API_KEY` n'est pas défini, ou si l'API Resend répond en erreur,
l'invitation est tout de même créée en base et le `inviteUrl` est renvoyé
dans la réponse. L'UI affiche alors le lien avec un bouton « Copier » pour
que l'invitant puisse le transmettre manuellement (SMS, WhatsApp…).

---

## Vérification post-config

Après avoir collé les templates + activé SMTP :

1. **Test reset password** :
   - Va sur `https://parenty.vercel.app/forgot-password`
   - Saisis ton email de test
   - Tu dois recevoir l'email avec le template Parenty (pas Supabase)
   - Clique le lien → arrive sur `/reset-password`
   - Nouveau mot de passe → redirection `/signin` → connexion OK

2. **Test création compte** (si confirm email activé) :
   - Créer un compte neuf
   - Vérifier l'email reçu et le lien

3. **Test invitation co-parent** :
   - Connecte-toi à ton compte principal
   - Va sur `/onboarding/invite` (ou bouton « Inviter » dans `/profile`)
   - Saisis l'email du second parent
   - Tu dois voir l'écran « Invitation envoyée » (emailSent: true)
   - Le second parent reçoit un email Parenty brandé
   - Clique → `/invite?token=...` → se connecte/inscrit → rejoint la famille
