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
        .select(
          'id, sender_id, body, created_at, read_at, attachment_path, attachment_mime, attachment_name, attachment_size',
        )
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

/**
 * Nombre de messages non lus pour l'utilisateur courant.
 * Utilise `count: 'exact', head: true` pour ne pas charger les lignes.
 */
export function useUnreadMessagesCount() {
  const familyId = useFamilyId()
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['messages', 'unread-count', familyId, user?.id],
    enabled: !!familyId && !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .neq('sender_id', user.id)
        .is('read_at', null)
      if (error) throw error
      return count ?? 0
    },
  })

  // Realtime : rafraîchit le compteur à chaque nouveau message
  useEffect(() => {
    if (!familyId) return
    const channel = supabase
      .channel(`messages-unread-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          qc.invalidateQueries({
            queryKey: ['messages', 'unread-count', familyId, user?.id],
          })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [familyId, user?.id, qc])

  return query
}

/**
 * Marque tous les messages reçus comme lus.
 * À appeler quand l'utilisateur ouvre la messagerie.
 */
export function useMarkMessagesRead() {
  const qc = useQueryClient()
  const familyId = useFamilyId()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async () => {
      if (!familyId || !user) return 0
      const { error, count } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() }, { count: 'exact' })
        .eq('family_id', familyId)
        .neq('sender_id', user.id)
        .is('read_at', null)
      if (error) throw error
      return count ?? 0
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', 'unread-count', familyId, user?.id] })
      qc.invalidateQueries({ queryKey: ['messages', familyId] })
    },
  })
}

const CHAT_MAX_SIZE = 20 * 1024 * 1024 // 20 Mo

/**
 * Envoie un message. `body` et/ou `file` (optionnels mais au moins un des deux).
 * Le fichier est uploadé dans le bucket privé "chat-attachments".
 */
export function useSendMessage() {
  const qc = useQueryClient()
  const familyId = useFamilyId()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (input) => {
      if (!familyId || !user) throw new Error('Famille introuvable')

      const { body, file } =
        typeof input === 'string' ? { body: input, file: null } : (input ?? {})

      const trimmed = body?.trim() ?? ''
      if (!trimmed && !file) throw new Error('Message vide')

      let attachment = null
      if (file) {
        if (file.size > CHAT_MAX_SIZE) {
          throw new Error('Fichier trop volumineux (20 Mo max).')
        }
        const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
        const uuid =
          globalThis.crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const path = `${familyId}/${uuid}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from('chat-attachments')
          .upload(path, file, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          })
        if (uploadErr) throw uploadErr

        attachment = {
          attachment_path: path,
          attachment_mime: file.type || null,
          attachment_name: file.name,
          attachment_size: file.size,
        }
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          family_id: familyId,
          sender_id: user.id,
          body: trimmed || null,
          ...(attachment ?? {}),
        })
        .select()
        .single()

      if (error) {
        // Rollback du storage si l'insert DB échoue
        if (attachment?.attachment_path) {
          await supabase.storage
            .from('chat-attachments')
            .remove([attachment.attachment_path])
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', familyId] })
    },
  })
}

/**
 * Génère une URL signée (1h) pour télécharger une pièce jointe.
 */
export async function getChatAttachmentUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data?.signedUrl ?? null
}
