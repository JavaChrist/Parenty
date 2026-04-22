import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useFamilyId } from './useFamily'

/**
 * Liste tous les messages de la famille, chronologiquement.
 * S'abonne aussi au realtime pour recevoir les nouveaux en live.
 */
export function useMessages() {
  const familyId = useFamilyId()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['messages', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, body, created_at, read_at')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })

  // Realtime : écoute des nouveaux messages pour rafraîchir le cache
  useEffect(() => {
    if (!familyId) return
    const channel = supabase
      .channel(`messages-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['messages', familyId] })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [familyId, qc])

  return query
}

export function useSendMessage() {
  const qc = useQueryClient()
  const familyId = useFamilyId()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (body) => {
      if (!familyId || !user) throw new Error('Famille introuvable')
      const trimmed = body?.trim()
      if (!trimmed) throw new Error('Message vide')
      const { data, error } = await supabase
        .from('messages')
        .insert({
          family_id: familyId,
          sender_id: user.id,
          body: trimmed,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', familyId] })
    },
  })
}
