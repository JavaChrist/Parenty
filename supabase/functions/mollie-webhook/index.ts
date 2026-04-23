// Supabase Edge Function : mollie-webhook
//
// Endpoint public appelé par Mollie à chaque changement d'état d'un paiement
// (cf. https://docs.mollie.com/overview/webhooks).
//
// Mollie POST application/x-www-form-urlencoded avec `id=tr_xxxxx`.
// On ignore volontairement le corps et on va re-fetch l'état du paiement
// depuis l'API Mollie (anti-spoofing : personne ne peut nous faire croire
// qu'un paiement a réussi en forgeant une requête).
//
// Trois cas gérés :
//   1. First payment `paid`  → on crée la subscription Mollie récurrente et
//                              on passe la famille en "active".
//   2. Recurring payment `paid` → on étend subscription_ends_at d'un mois.
//   3. Recurring payment `failed` → on passe en "past_due" pour signaler.
//
// Tous les events sont tracés dans la table billing_events pour audit.
//
// Secret requis :
//   - MOLLIE_API_KEY
//
// Déploiement : supabase functions deploy mollie-webhook --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
}

const PLAN = {
  amount: '6.99',
  currency: 'EUR',
  interval: '1 month',
  description: 'Parenty Premium — abonnement mensuel',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Mollie s'attend à un 200 même si on n'a rien pu traiter, sinon il retry
  // 10 fois sur 24h. On renvoie donc 200 quoi qu'il arrive et on log les
  // vraies erreurs côté serveur.
  try {
    const mollieKey = Deno.env.get('MOLLIE_API_KEY')
    if (!mollieKey) {
      console.error('[mollie-webhook] MOLLIE_API_KEY manquant')
      return ok()
    }

    const id = await extractResourceId(req)
    if (!id) {
      console.warn('[mollie-webhook] corps sans id')
      return ok()
    }

    // On n'accepte que les ids de type payment (tr_) et subscription (sub_)
    // Si c'est autre chose, on ignore.
    if (id.startsWith('tr_')) {
      await handlePayment(mollieKey, id)
    } else if (id.startsWith('sub_')) {
      await handleSubscription(mollieKey, id)
    } else {
      console.warn('[mollie-webhook] id inconnu', id)
    }

    return ok()
  } catch (err) {
    console.error('[mollie-webhook] unhandled', err)
    return ok() // toujours 200 pour Mollie
  }
})

// ---------------------------------------------------------------------------
// Payment handler
// ---------------------------------------------------------------------------

async function handlePayment(mollieKey: string, paymentId: string) {
  const payment = await mollieFetch(mollieKey, 'GET', `/payments/${paymentId}`)
  if (!payment) return

  const familyId = payment?.metadata?.family_id as string | undefined
  if (!familyId) {
    console.warn('[mollie-webhook] payment sans family_id', paymentId)
    return
  }

  const admin = adminClient()

  // Trace l'event (peu importe le statut, pour audit)
  await admin.from('billing_events').insert({
    family_id: familyId,
    mollie_resource_id: paymentId,
    event_type: `payment.${payment.status}`,
    payload: payment,
  })

  if (payment.status !== 'paid') {
    // failed, expired, canceled… si c'est un recurring on marque past_due
    if (payment.sequenceType === 'recurring' && ['failed', 'expired'].includes(payment.status)) {
      await admin
        .from('families')
        .update({ subscription_status: 'past_due' })
        .eq('id', familyId)
    }
    return
  }

  // payment.status === 'paid'
  if (payment.sequenceType === 'first') {
    // Le mandat existe maintenant. On crée la subscription récurrente.
    const mandateId = payment.mandateId as string | undefined
    const customerId = payment.customerId as string | undefined

    if (!customerId) {
      console.error('[mollie-webhook] first payment sans customerId', paymentId)
      return
    }

    const subscription = await mollieFetch(
      mollieKey,
      'POST',
      `/customers/${customerId}/subscriptions`,
      {
        amount: { currency: PLAN.currency, value: PLAN.amount },
        interval: PLAN.interval,
        description: PLAN.description,
        webhookUrl: resolveWebhookUrl(),
        ...(mandateId ? { mandateId } : {}),
        metadata: { family_id: familyId },
      },
    )

    const endsAt = addMonths(new Date(), 1).toISOString()
    await admin
      .from('families')
      .update({
        subscription_status: 'active',
        subscription_ends_at: endsAt,
        mollie_subscription_id: subscription.id,
        mollie_mandate_id: mandateId ?? null,
      })
      .eq('id', familyId)
  } else if (payment.sequenceType === 'recurring') {
    // Paiement mensuel OK → prolonge d'un mois
    const endsAt = addMonths(new Date(), 1).toISOString()
    await admin
      .from('families')
      .update({
        subscription_status: 'active',
        subscription_ends_at: endsAt,
      })
      .eq('id', familyId)
  }
}

// ---------------------------------------------------------------------------
// Subscription handler (cancellations, etc.)
// ---------------------------------------------------------------------------

async function handleSubscription(mollieKey: string, subscriptionId: string) {
  // Les events subscription sont envoyés dans certains cas (annulation par
  // exemple). On re-fetch pour avoir l'état canonique.
  // NB: Mollie n'envoie des webhooks subscription que si tu l'as configuré
  // via la propriété webhookUrl sur la subscription, ce qu'on fait.
  const admin = adminClient()

  const { data: family } = await admin
    .from('families')
    .select('id, subscription_ends_at')
    .eq('mollie_subscription_id', subscriptionId)
    .maybeSingle()

  if (!family) {
    console.warn('[mollie-webhook] sub inconnue en base', subscriptionId)
    return
  }

  // Retrouve la subscription Mollie pour connaître son statut
  const { data: fam } = await admin
    .from('families')
    .select('mollie_customer_id')
    .eq('id', family.id)
    .single()
  if (!fam?.mollie_customer_id) return

  const sub = await mollieFetch(
    mollieKey,
    'GET',
    `/customers/${fam.mollie_customer_id}/subscriptions/${subscriptionId}`,
  )

  await admin.from('billing_events').insert({
    family_id: family.id,
    mollie_resource_id: subscriptionId,
    event_type: `subscription.${sub.status}`,
    payload: sub,
  })

  if (sub.status === 'canceled' || sub.status === 'completed') {
    // On garde la famille "active" jusqu'à la fin de la période déjà payée,
    // puis on la passera à "cancelled" à expiration. Pour l'instant on
    // stocke simplement l'état cancelled immédiatement (UX plus claire :
    // l'utilisateur sait que ça ne se renouvellera pas).
    await admin
      .from('families')
      .update({ subscription_status: 'cancelled' })
      .eq('id', family.id)
  } else if (sub.status === 'suspended') {
    await admin
      .from('families')
      .update({ subscription_status: 'past_due' })
      .eq('id', family.id)
  } else if (sub.status === 'active') {
    await admin
      .from('families')
      .update({ subscription_status: 'active' })
      .eq('id', family.id)
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok() {
  return new Response('ok', { status: 200, headers: corsHeaders })
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )
}

async function extractResourceId(req: Request): Promise<string | null> {
  const contentType = req.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      const body = await req.json()
      return body?.id ?? null
    } catch {
      return null
    }
  }
  // x-www-form-urlencoded (cas Mollie par défaut)
  const text = await req.text()
  const params = new URLSearchParams(text)
  return params.get('id')
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
    // non-JSON
  }
  if (!resp.ok) {
    const msg = data?.detail || data?.title || text || `Mollie ${resp.status}`
    throw new Error(`Mollie: ${msg}`)
  }
  return data
}

function resolveWebhookUrl() {
  const override = (Deno.env.get('MOLLIE_WEBHOOK_URL') ?? '').trim()
  if (override) return override
  const base = Deno.env.get('SUPABASE_URL')
  if (!base) throw new Error('SUPABASE_URL manquant')
  return `${base.replace(/\/$/, '')}/functions/v1/mollie-webhook`
}

function addMonths(d: Date, months: number) {
  const r = new Date(d)
  r.setMonth(r.getMonth() + months)
  return r
}
