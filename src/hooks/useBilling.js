import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * Démarre le flow d'abonnement Mollie.
 *
 * Appelle l'Edge Function `mollie-create-subscription` qui crée le customer
 * Mollie et le first payment, puis redirige immédiatement l'utilisateur vers
 * la page de paiement Mollie (checkoutUrl).
 */
export function useStartSubscription() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        'mollie-create-subscription',
        { body: {} },
      )
      if (error) {
        const real = await extractFunctionErrorMessage(error)
        throw new Error(real || error.message || "Impossible de démarrer l'abonnement.")
      }
      if (data?.error) throw new Error(data.error)
      if (!data?.checkoutUrl) throw new Error('Réponse incomplète du serveur.')
      return data
    },
    onSuccess: (data) => {
      // Redirection vers Mollie. On remplace l'URL pour que le bouton Retour
      // du navigateur ne revienne pas sur /profile avec un flow en cours.
      window.location.replace(data.checkoutUrl)
    },
  })
}

/**
 * Résilie l'abonnement Mollie actif.
 */
export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        'mollie-cancel-subscription',
        { body: {} },
      )
      if (error) {
        const real = await extractFunctionErrorMessage(error)
        throw new Error(real || error.message || "Impossible de résilier.")
      }
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family'] })
    },
  })
}

async function extractFunctionErrorMessage(error) {
  try {
    const response = error?.context?.response
    if (!response || typeof response.json !== 'function') return null
    const body = await response.clone().json()
    return body?.error || null
  } catch {
    return null
  }
}
