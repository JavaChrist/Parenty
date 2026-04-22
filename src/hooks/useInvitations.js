import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFamilyId } from './useFamily'
import { useAuthStore } from '../stores/authStore'

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

      const base = import.meta.env.VITE_APP_URL || window.location.origin
      const inviteUrl = `${base}/invite?token=${data.token}`

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
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
  })
}
