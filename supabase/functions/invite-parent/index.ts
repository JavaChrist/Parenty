// Supabase Edge Function : invite-parent
//
// 1. Crée (ou ré-utilise) une invitation pour le second parent
// 2. Envoie un email brandé Parenty via l'API Resend
//
// Secrets requis (dashboard Supabase → Edge Functions → Secrets) :
//   - APP_URL           ex: https://parenty.vercel.app
//   - RESEND_API_KEY    clé API Resend (la même que pour le SMTP custom)
//   - RESEND_FROM       optionnel, défaut: "Parenty <noreply@javachrist.fr>"
//
// Déploiement : supabase functions deploy invite-parent

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email: rawEmail } = await req.json()
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Email invalide.' }, 400)
    }

    // Client avec le JWT de l'utilisateur appelant
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Non authentifié.' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    // Récupère l'utilisateur courant
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return json({ error: 'Non authentifié.' }, 401)
    }

    // Sécurité basique : on refuse de s'inviter soi-même
    if (user.email && user.email.toLowerCase() === email) {
      return json({ error: "Tu ne peux pas t'inviter toi-même." }, 400)
    }

    // Récupère la famille du user + son profil (pour personnaliser le mail)
    const { data: member } = await supabase
      .from('family_members')
      .select('family_id, families!inner(name)')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return json({ error: "Tu n'as pas encore de famille." }, 400)
    }

    const familyId = member.family_id as string
    const familyName = (member as any).families?.name ?? 'Parenty'

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .maybeSingle()

    const inviterName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
      user.email?.split('@')[0] ||
      'Ton co-parent'

    // Ré-utilise une invitation non acceptée et non expirée pour ce même email
    // → évite de spammer la boîte mail avec 10 tokens différents
    const { data: existing } = await supabase
      .from('invitations')
      .select('id, token, accepted_at, expires_at')
      .eq('family_id', familyId)
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let invitationToken: string | null = null

    if (
      existing &&
      !existing.accepted_at &&
      new Date(existing.expires_at) > new Date()
    ) {
      invitationToken = existing.token as string
    } else {
      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert({
          family_id: familyId,
          email,
          invited_by: user.id,
        })
        .select('token')
        .single()

      if (error) throw error
      invitationToken = invitation.token as string
    }

    const appUrl = (Deno.env.get('APP_URL') ?? 'https://parenty.vercel.app').replace(
      /\/$/,
      '',
    )
    const inviteUrl = `${appUrl}/invite?token=${invitationToken}`

    // Envoi du mail via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      // Pas de clé → on renvoie quand même l'URL pour que le dev puisse
      // tester en local (copy/paste manuel).
      console.warn('[invite-parent] RESEND_API_KEY non défini, email non envoyé.')
      return json({
        success: true,
        emailSent: false,
        inviteUrl,
        warning: 'Clé Resend absente : email non envoyé.',
      })
    }

    const from = Deno.env.get('RESEND_FROM') ?? 'Parenty <noreply@javachrist.fr>'
    const html = buildInviteHtml({ inviterName, familyName, inviteUrl })
    const text = buildInviteText({ inviterName, familyName, inviteUrl })

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `${inviterName} t'invite à rejoindre Parenty`,
        html,
        text,
      }),
    })

    if (!resp.ok) {
      const body = await resp.text()
      console.error('[invite-parent] Resend error', resp.status, body)
      // On renvoie 200 pour que le client ait accès au inviteUrl et affiche
      // le bloc "Partager le lien manuellement" proprement, plutôt que de
      // lever une exception générique côté supabase-js.
      return json({
        success: true,
        emailSent: false,
        inviteUrl,
        warning: `Resend a refusé l'envoi (${resp.status}). Partage le lien manuellement.`,
      })
    }

    return json({ success: true, emailSent: true, inviteUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[invite-parent] unhandled error', err)
    return json({ error: message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// Templates email
// ---------------------------------------------------------------------------

function buildInviteHtml(
  { inviterName, familyName, inviteUrl }:
    { inviterName: string; familyName: string; inviteUrl: string },
) {
  const safeInviter = escapeHtml(inviterName)
  const safeFamily = escapeHtml(familyName)
  const safeUrl = escapeHtml(inviteUrl)

  return `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f5f7f6;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1c1e;line-height:1.55;background:#ffffff;">
  <tr>
    <td style="padding:32px 24px 16px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#00685f;letter-spacing:-0.5px;">Parenty</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 24px 0;">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1a1c1e;">Tu es invité·e à rejoindre ${safeFamily}</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#41474d;">
        <strong>${safeInviter}</strong> t'invite à rejoindre sa famille sur Parenty,
        l'application pour organiser la coparentalité&nbsp;: plannings, dépenses,
        documents et communication, au même endroit.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 24px 24px;text-align:center;">
      <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;background:#00685f;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
        Rejoindre la famille
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px 16px;">
      <p style="margin:0 0 8px;font-size:13px;color:#73787e;">
        Ce lien est valide <strong>7 jours</strong>. Si tu n'attendais pas cette
        invitation, ignore simplement cet email.
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#73787e;">
        Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur&nbsp;:
      </p>
      <p style="margin:0;font-size:12px;word-break:break-all;">
        <a href="${safeUrl}" style="color:#00685f;">${safeUrl}</a>
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
</body>
</html>`
}

function buildInviteText(
  { inviterName, familyName, inviteUrl }:
    { inviterName: string; familyName: string; inviteUrl: string },
) {
  return [
    `${inviterName} t'invite à rejoindre ${familyName} sur Parenty,`,
    `l'application pour organiser la coparentalité.`,
    ``,
    `Rejoins la famille ici :`,
    inviteUrl,
    ``,
    `Ce lien est valide 7 jours. Si tu n'attendais pas cette invitation,`,
    `ignore simplement cet email.`,
    ``,
    `— Parenty · parenty.vercel.app · support@javachrist.fr`,
  ].join('\n')
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
