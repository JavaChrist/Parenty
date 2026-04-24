import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFamilyId } from './useFamily'

/**
 * Historique des événements de facturation de la famille courante.
 *
 * On lit la table `billing_events` qui est alimentée par le webhook Mollie.
 * Chaque paiement réussi (`payment.paid`) est une "facture" — on extrait
 * le montant, la date et l'identifiant Mollie pour affichage.
 *
 * Le portail Mollie envoie par email les vrais reçus PDF au moment de chaque
 * prélèvement ; cette page sert principalement à offrir une visibilité
 * in-app de l'historique.
 */
export function useBillingHistory() {
  const familyId = useFamilyId()
  return useQuery({
    queryKey: ['billing-history', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_events')
        .select('id, event_type, received_at, payload, mollie_resource_id')
        .eq('family_id', familyId)
        .order('received_at', { ascending: false })
        .limit(60)
      if (error) throw error
      return (data ?? []).map((row) => ({
        id: row.id,
        mollieId: row.mollie_resource_id,
        type: row.event_type,
        receivedAt: row.received_at,
        amount: row.payload?.amount?.value ?? null,
        currency: row.payload?.amount?.currency ?? 'EUR',
        status: row.payload?.status ?? null,
        method: row.payload?.method ?? null,
        description: row.payload?.description ?? null,
        sequenceType: row.payload?.sequenceType ?? null,
      }))
    },
  })
}
