// Supabase Edge Function : mollie-create-subscription
//
// Démarre le flow d'abonnement Parenty Premium :
//   1. Crée (ou ré-utilise) un customer Mollie pour la famille
//   2. Crée un "first payment" (sequenceType=first) pour collecter le mandat
//      SEPA/carte et le premier mois d'abonnement (6,99 €)
//   3. Renvoie le checkoutUrl Mollie au client, qui y redirige l'utilisateur
//
// La souscription Mollie à proprement parler est créée dans mollie-webhook
// quand le first payment passe à "paid" (à ce moment le mandat existe).
//
// Secrets requis :
//   - MOLLIE_API_KEY        live_xxx ou test_xxx
//   - APP_URL               https://parenty.vercel.app (pour redirectUrl)
//   - MOLLIE_WEBHOOK_URL    optionnel, par défaut construit depuis la fonction
//
// Déploiement : supabase functions deploy mollie-create-subscription

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const PLAN = {
  name: 'Parenty Premium',
  amount: '6.99',
  currency: 'EUR',
  interval: '1 month',
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

    // Auth
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

    // Récupère la famille du user (avec le customer Mollie éventuel)
    const { data: member } = await supabase
      .from('family_members')
      .select('family_id, families!inner(id, name, subscription_status, mollie_customer_id)')
      .eq('user_id', user.id)
      .single()

    if (!member) return json({ error: "Tu n'as pas encore de famille." }, 400)

    const family = (member as any).families as {
      id: string
      name: string
      subscription_status: string
      mollie_customer_id: string | null
    }

    if (family.subscription_status === 'active') {
      return json({ error: 'Cet espace est déjà abonné.' }, 400)
    }

    // Client admin pour écrire sur families (RLS autorise mais on reste safe)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )

    const appUrl = resolveAppUrl()

    // 1. Customer Mollie
    let customerId = family.mollie_customer_id
    if (!customerId) {
      const customer = await mollieFetch(mollieKey, 'POST', '/customers', {
        name: family.name,
        email: user.email,
        metadata: { family_id: family.id, user_id: user.id },
      })
      customerId = customer.id
      await admin
        .from('families')
        .update({ mollie_customer_id: customerId })
        .eq('id', family.id)
    }

    // 2. First payment (sequenceType=first → crée le mandat)
    const webhookUrl = resolveWebhookUrl()
    const payment = await mollieFetch(mollieKey, 'POST', '/payments', {
      amount: { currency: PLAN.currency, value: PLAN.amount },
      description: `${PLAN.name} — mise en place de l'abonnement`,
      customerId,
      sequenceType: 'first',
      redirectUrl: `${appUrl}/subscribe/success`,
      webhookUrl,
      metadata: {
        family_id: family.id,
        user_id: user.id,
        kind: 'first_payment',
      },
    })

    const checkoutUrl = payment?._links?.checkout?.href
    if (!checkoutUrl) {
      console.error('[mollie-create-subscription] pas de checkoutUrl', payment)
      return json({ error: 'Réponse Mollie inattendue.' }, 502)
    }

    return json({
      checkoutUrl,
      paymentId: payment.id,
      customerId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[mollie-create-subscription] error', err)
    return json({ error: message }, 500)
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    // non-JSON response
  }
  if (!resp.ok) {
    const msg = data?.detail || data?.title || text || `Mollie ${resp.status}`
    throw new Error(`Mollie: ${msg}`)
  }
  return data
}

function resolveAppUrl() {
  const raw = (Deno.env.get('APP_URL') ?? '').trim()
  if (raw && !/localhost|127\.0\.0\.1/.test(raw)) return raw.replace(/\/$/, '')
  return 'https://parenty.vercel.app'
}

function resolveWebhookUrl() {
  const override = (Deno.env.get('MOLLIE_WEBHOOK_URL') ?? '').trim()
  if (override) return override
  const base = Deno.env.get('SUPABASE_URL')
  if (!base) throw new Error('SUPABASE_URL manquant')
  return `${base.replace(/\/$/, '')}/functions/v1/mollie-webhook`
}
