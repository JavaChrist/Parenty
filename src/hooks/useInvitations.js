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
 * Invite un co-parent via la fonction Edge `invite-parent`, qui :
 *   - crée (ou ré-utilise) l'invitation en base
 *   - envoie un email brandé Parenty via Resend (si RESEND_API_KEY défini)
 *
 * Renvoie :
 *   {
 *     email,                     // l'adresse invitée
 *     inviteUrl,                 // lien direct (utile si email non envoyé)
 *     emailSent: boolean,        // true = mail parti chez Resend
 *     warning?: string,          // message explicatif si emailSent=false
 *   }
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

      const { data, error } = await supabase.functions.invoke('invite-parent', {
        body: { email: trimmed },
      })

      if (error) {
        const extracted = await extractFunctionErrorPayload(error)
        throw new Error(
          extracted?.error ||
            error.message ||
            "Échec de l'envoi de l'invitation.",
        )
      }
      if (data?.error) throw new Error(data.error)

      // Fallback inviteUrl au cas où la fonction n'en renverrait pas (ancien
      // déploiement, réseau intermittent…) : on la recalcule côté client.
      const inviteUrl =
        data?.inviteUrl || `${getAppBaseUrl()}/invite?token=${data?.token ?? ''}`

      return {
        email: trimmed,
        inviteUrl,
        emailSent: !!data?.emailSent,
        warning: data?.warning,
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations', familyId] })
    },
  })
}

/**
 * Accepte une invitation : marque l'invitation comme acceptée
 * ET insère family_members pour le user courant.
 *
 * Paramètres : { token, force? }
 *   - force=true : si le user a déjà sa propre famille (seul membre),
 *     elle sera supprimée pour rejoindre celle qui invite.
 *
 * Erreurs métier : on lance un Error enrichi (`err.reason`,
 * `err.currentFamilyId`) pour que l'UI puisse proposer un parcours
 * "Quitter ma famille pour rejoindre celle-ci".
 */
export function useAcceptInvitation() {
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (input) => {
      if (!user)
        throw new Error('Tu dois te connecter pour accepter une invitation.')
      const token = typeof input === 'string' ? input : input?.token
      const force = typeof input === 'object' ? !!input?.force : false
      if (!token) throw new Error('Token manquant.')

      const { data, error } = await supabase.functions.invoke('accept-invite', {
        body: { token, force },
      })

      if (error) {
        const extracted = await extractFunctionErrorPayload(error)
        const message =
          extracted?.error ||
          error.message ||
          "Échec de l'invitation."
        const enriched = new Error(message)
        if (extracted?.reason) enriched.reason = extracted.reason
        if (extracted?.currentFamilyId)
          enriched.currentFamilyId = extracted.currentFamilyId
        throw enriched
      }
      if (data?.error) {
        const enriched = new Error(data.error)
        if (data.reason) enriched.reason = data.reason
        if (data.currentFamilyId) enriched.currentFamilyId = data.currentFamilyId
        throw enriched
      }
      return data
    },
  })
}

/**
 * Extrait le payload JSON d'une FunctionsHttpError pour récupérer
 * { error, reason, currentFamilyId, ... } envoyés par la fonction Edge.
 *
 * Selon la version de supabase-js, `error.context` peut être :
 *   - directement un Response (clones supportés)
 *   - un objet { response: Response, body, ... }
 *   - un body déjà parsé
 */
async function extractFunctionErrorPayload(error) {
  try {
    const ctx = error?.context
    if (!ctx) return null

    if (typeof ctx === 'object' && ctx.body && typeof ctx.body === 'object') {
      return ctx.body
    }

    const response =
      ctx instanceof Response ? ctx : (ctx.response ?? null)
    if (!response || typeof response.clone !== 'function') return null

    const text = await response.clone().text()
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      return { error: text.slice(0, 300) }
    }
  } catch {
    return null
  }
}
