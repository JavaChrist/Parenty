// Supabase Edge Function : mollie-cancel-subscription
//
// Annule la subscription Mollie de la famille de l'utilisateur connecté.
// La base sera mise à jour par le webhook mollie-webhook quand Mollie
// confirme l'annulation (subscription.canceled).
//
// Secret requis : MOLLIE_API_KEY
//
// Déploiement : supabase functions deploy mollie-cancel-subscription

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
    const mollieKey = Deno.env.get('MOLLIE_API_KEY')
    if (!mollieKey) {
      return json({ error: 'MOLLIE_API_KEY non configuré.' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Non authentifié.' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return json({ error: 'Non authentifié.' }, 401)

    const { data: member } = await supabase
      .from('family_members')
      .select('family_id, role, families!inner(mollie_customer_id, mollie_subscription_id)')
      .eq('user_id', user.id)
      .single()

    if (!member) return json({ error: 'Pas de famille.' }, 400)

    // Seul le owner peut résilier (sécurité simple).
    if (member.role !== 'owner') {
      return json({ error: "Seul le responsable de l'espace peut résilier." }, 403)
    }

    const family = (member as any).families as {
      mollie_customer_id: string | null
      mollie_subscription_id: string | null
    }
    if (!family.mollie_customer_id || !family.mollie_subscription_id) {
      return json({ error: "Aucun abonnement actif à r\u00e9silier." }, 400)
    }

    const resp = await fetch(
      `https://api.mollie.com/v2/customers/${family.mollie_customer_id}/subscriptions/${family.mollie_subscription_id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mollieKey}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!resp.ok) {
      const text = await resp.text()
      console.error('[mollie-cancel-subscription] Mollie', resp.status, text)
      return json({ error: "Mollie a refusé l'annulation." }, 502)
    }

    // Optimistic update en base (le webhook confirmera)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )
    await admin
      .from('families')
      .update({ subscription_status: 'cancelled' })
      .eq('id', member.family_id)

    return json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[mollie-cancel-subscription] error', err)
    return json({ error: message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
