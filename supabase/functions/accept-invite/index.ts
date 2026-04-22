// Supabase Edge Function : accept-invite
// Associe le user authentifié à la famille via un token d'invitation.
// Utilise le service_role pour pouvoir insérer dans family_members (RLS bloque le client).
// Déploiement : supabase functions deploy accept-invite

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    if (!token) {
      return json({ error: 'Token requis' }, 400)
    }

    // 1. Client "auth" avec le JWT du user qui appelle
    const authHeader = req.headers.get('Authorization')!
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return json({ error: 'Tu dois être connecté pour accepter une invitation.' }, 401)
    }

    // 2. Client "admin" avec service_role pour contourner la RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
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

    // 4. Vérifie que l'email du user correspond (soft check)
    if (user.email && invitation.email && user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      // On warn mais on laisse passer : l'important c'est le token
      console.warn('Email mismatch between invitee and user', user.email, invitation.email)
    }

    // 5. Vérifie que le user n'est pas déjà dans une famille
    const { data: existingMember } = await supabaseAdmin
      .from('family_members')
      .select('id, family_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      if (existingMember.family_id === invitation.family_id) {
        // Déjà membre de cette famille, on marque l'invitation comme acceptée
        await supabaseAdmin
          .from('invitations')
          .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
          .eq('id', invitation.id)
        return json({ success: true, alreadyMember: true, familyId: invitation.family_id })
      }
      return json({
        error: 'Tu appartiens déjà à une autre famille. Contacte ton co-parent.',
      }, 400)
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
