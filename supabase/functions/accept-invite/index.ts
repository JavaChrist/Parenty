// Supabase Edge Function : accept-invite
// Associe le user authentifié à la famille via un token d'invitation.
// Utilise le service_role pour pouvoir insérer dans family_members (RLS bloque le client).
// Déploiement : npx supabase functions deploy accept-invite
//
// Paramètres :
//   - token  : (obligatoire) token d'invitation
//   - force  : (optionnel) si true, supprime la famille actuelle du user
//              (uniquement s'il en est seul membre) avant de rejoindre la
//              famille invitante. Permet de gérer le cas "j'ai créé une
//              famille par erreur avant d'accepter l'invitation".
//
// Codes de réponse spécifiques (en plus du status HTTP) :
//   - reason: 'already_in_other_family' (status 409) → le user a déjà une
//     famille. Le client peut proposer "Quitter et rejoindre" → renvoyer
//     la requête avec force=true.
//   - reason: 'family_has_other_members' (status 409) → idem mais avec
//     d'autres membres dans la famille actuelle. force ne fonctionnera
//     pas pour préserver les données des autres.

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
    const body = await req.json().catch(() => ({}))
    const token = body?.token
    const force = body?.force === true

    if (!token) {
      return json({ error: 'Token requis' }, 400)
    }

    // 1. Client "auth" avec le JWT du user qui appelle
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Authentification manquante.' }, 401)
    }
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()
    if (!user) {
      return json(
        { error: 'Tu dois être connecté pour accepter une invitation.' },
        401,
      )
    }

    // 2. Client "admin" avec service_role pour contourner la RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )

    // 3. Vérifie l'invitation
    const { data: invitation, error: invErr } = await supabaseAdmin
      .from('invitations')
      .select('id, family_id, email, expires_at, accepted_at')
      .eq('token', token)
      .single()

    if (invErr || !invitation) {
      return json({ error: 'Invitation invalide ou expirée.' }, 404)
    }

    if (invitation.accepted_at) {
      return json({ error: 'Cette invitation a déjà été utilisée.' }, 400)
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return json({ error: 'Cette invitation a expiré.' }, 400)
    }

    // 4. Vérifie que l'email du user correspond (soft check : on log seulement)
    if (
      user.email &&
      invitation.email &&
      user.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      console.warn(
        'Email mismatch between invitee and user',
        invitation.email,
        user.email,
      )
    }

    // 5. Vérifie que le user n'est pas déjà dans une famille
    const { data: existingMember } = await supabaseAdmin
      .from('family_members')
      .select('id, family_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      // Déjà membre de la même famille → idempotent
      if (existingMember.family_id === invitation.family_id) {
        await supabaseAdmin
          .from('invitations')
          .update({
            accepted_at: new Date().toISOString(),
            accepted_by: user.id,
          })
          .eq('id', invitation.id)
        return json({
          success: true,
          alreadyMember: true,
          familyId: invitation.family_id,
        })
      }

      // Déjà membre d'une AUTRE famille : on regarde si on peut détruire
      // l'ancienne famille (=> seul membre), ou si elle est partagée.
      const { count: memberCount } = await supabaseAdmin
        .from('family_members')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', existingMember.family_id)

      const aloneInOldFamily = (memberCount ?? 0) <= 1

      if (!aloneInOldFamily) {
        return json(
          {
            error:
              "Tu fais partie d'une autre famille avec d'autres personnes. Demande-leur de te retirer avant de rejoindre une nouvelle famille.",
            reason: 'family_has_other_members',
          },
          409,
        )
      }

      if (!force) {
        return json(
          {
            error:
              "Tu fais déjà partie d'une autre famille. Confirme pour la quitter et rejoindre celle qui t'invite.",
            reason: 'already_in_other_family',
            currentFamilyId: existingMember.family_id,
          },
          409,
        )
      }

      // force === true et seul membre → on supprime l'ancienne famille
      // (cascade : children, events, expenses, documents, invitations…
      //  toutes les FK sur families ont ON DELETE CASCADE).
      const { error: delErr } = await supabaseAdmin
        .from('families')
        .delete()
        .eq('id', existingMember.family_id)

      if (delErr) {
        console.error('[accept-invite] failed to delete old family', delErr)
        return json(
          {
            error:
              "Impossible de quitter ta famille actuelle : " + delErr.message,
          },
          500,
        )
      }
    }

    // 6. Insère le nouveau membre
    const { error: insertErr } = await supabaseAdmin
      .from('family_members')
      .insert({
        family_id: invitation.family_id,
        user_id: user.id,
        role: 'parent',
      })

    if (insertErr) throw insertErr

    // 7. Marque l'invitation acceptée
    await supabaseAdmin
      .from('invitations')
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq('id', invitation.id)

    return json({ success: true, familyId: invitation.family_id })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[accept-invite] unhandled error', err)
    return json({ error: message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
