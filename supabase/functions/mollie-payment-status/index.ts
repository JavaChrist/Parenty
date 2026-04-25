// Supabase Edge Function : mollie-payment-status
//
// Retourne le statut Mollie d'un paiement donné, après vérification que
// l'utilisateur appartient bien à la famille du paiement (via metadata.family_id).
//
// Utilisé par la page /subscribe/success pour distinguer les cas :
//   - paid       → abonnement en cours d'activation par le webhook
//   - open/pending → l'utilisateur est revenu sans terminer (banque, virement…)
//   - canceled / expired / failed → l'utilisateur a annulé / échec
//
// Secrets requis : MOLLIE_API_KEY
// Déploiement    : npx supabase functions deploy mollie-payment-status

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
      return json({ error: 'MOLLIE_API_KEY non configuré côté serveur.' }, 500)
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

    // Accepte payment_id soit en query string (GET), soit dans le body (POST).
    const url = new URL(req.url)
    let paymentId = url.searchParams.get('payment_id') ?? ''
    if (!paymentId && req.method !== 'GET') {
      try {
        const body = await req.json()
        paymentId = body?.payment_id ?? ''
      } catch {
        /* body absent ou invalide */
      }
    }
    if (!paymentId || !/^tr_[A-Za-z0-9]+$/.test(paymentId)) {
      return json({ error: 'payment_id manquant ou invalide.' }, 400)
    }

    const payment = await mollieFetch(mollieKey, 'GET', `/payments/${paymentId}`)

    // Vérifie que ce paiement appartient bien à la famille de l'utilisateur.
    const familyIdInMeta = payment?.metadata?.family_id as string | undefined
    if (!familyIdInMeta) {
      return json({ error: 'Paiement sans contexte famille.' }, 403)
    }

    const { data: member } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .eq('family_id', familyIdInMeta)
      .maybeSingle()

    if (!member) {
      return json({ error: "Ce paiement ne t'appartient pas." }, 403)
    }

    return json({
      id: payment.id,
      status: payment.status, // open | pending | paid | canceled | expired | failed | authorized
      amount: payment.amount,
      method: payment.method,
      sequenceType: payment.sequenceType,
      isCancelable: !!payment.isCancelable,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[mollie-payment-status] error', err)
    return json({ error: message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function mollieFetch(
  apiKey: string,
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
  path: string,
  body?: unknown,
) {
  const resp = await fetch(`https://api.mollie.com/v2${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await resp.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    /* non-JSON */
  }
  if (!resp.ok) {
    const msg = data?.detail || data?.title || text || `Mollie ${resp.status}`
    throw new Error(`Mollie: ${msg}`)
  }
  return data
}
