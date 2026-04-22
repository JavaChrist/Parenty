import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFamilyId } from './useFamily'
import { useAuthStore } from '../stores/authStore'

/**
 * Base URL publique utilisée pour forger les liens d'invitation.
 *
 * Priorité :
 *  1. `VITE_APP_URL` si elle est définie ET cohérente avec le mode courant
 *     (pas une URL localhost si on tourne déjà sur un domaine public).
 *  2. `window.location.origin` en fallback — correct en prod, en dev ça donne
 *     localhost mais ce cas est documenté dans `.env.example`.
 *
 * Ce garde-fou évite le piège : si on oublie de configurer `VITE_APP_URL`
 * sur Vercel et qu'elle reste à `http://localhost:5173`, on préfère l'origin
 * réelle du navigateur plutôt que de générer un lien cassé.
 */
function getAppBaseUrl() {
  const envUrl = import.meta.env.VITE_APP_URL
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  if (envUrl) {
    const isEnvLocal = /localhost|127\.0\.0\.1/.test(envUrl)
    const isOriginLocal = /localhost|127\.0\.0\.1/.test(origin)
    // Si on est sur un domaine public mais que la variable est restée locale,
    // on ignore la variable (mauvaise config) et on prend l'origin.
    if (isEnvLocal && origin && !isOriginLocal) return origin.replace(/\/$/, '')
    return envUrl.replace(/\/$/, '')
  }
  return (origin || '').replace(/\/$/, '')
}

/**
 * Liste les invitations non encore acceptées pour la famille courante.
 */
export function useInvitations() {
  const familyId = useFamilyId()

  return useQuery({
    queryKey: ['invitations', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('id, email, token, created_at, expires_at, accepted_at')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

/**
 * Crée une invitation en base (RLS autorise car family member).
 * Le token est généré par défaut côté base.
 * Renvoie l'invitation créée avec son inviteUrl calculée côté client.
 */
export function useInviteCoParent() {
  const qc = useQueryClient()
  const familyId = useFamilyId()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (email) => {
      if (!familyId || !user) throw new Error('Non authentifié')
      const trimmed = email?.trim().toLowerCase()
      if (!trimmed) throw new Error('Email requis')

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          family_id: familyId,
          email: trimmed,
          invited_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      const inviteUrl = `${getAppBaseUrl()}/invite?token=${data.token}`

      return { invitation: data, inviteUrl }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations', familyId] })
    },
  })
}

/**
 * Accepte une invitation : marque l'invitation comme acceptée
 * ET insère family_members pour le user courant.
 * NOTE : l'insert family_members est refusé par la RLS côté client.
 * On doit passer par une Edge Function "accept-invite" qui tourne en service_role.
 */
export function useAcceptInvitation() {
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (token) => {
      if (!user) throw new Error('Tu dois te connecter pour accepter une invitation.')
      if (!token) throw new Error('Token manquant.')

      const { data, error } = await supabase.functions.invoke('accept-invite', {
        body: { token },
      })

      // Quand la fonction renvoie un non-2xx, supabase-js remplit `error` avec un
      // FunctionsHttpError dont le `.message` est générique ("Edge Function
      // returned a non-2xx status code"). Le vrai message métier est dans
      // `error.context.response` (Response native) → on le récupère manuellement.
      if (error) {
        const realMessage = await extractFunctionErrorMessage(error)
        throw new Error(realMessage || error.message || "Échec de l'invitation.")
      }
      if (data?.error) throw new Error(data.error)
      return data
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
