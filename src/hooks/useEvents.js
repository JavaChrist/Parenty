import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useFamilyId } from './useFamily'

export const EVENT_KINDS = [
  { value: 'custody', label: 'Garde' },
  { value: 'vacation', label: 'Vacances' },
  { value: 'school', label: 'École' },
  { value: 'medical', label: 'Santé' },
  { value: 'other', label: 'Autre' },
]

export function useUpcomingEvents(limit = 5) {
  const familyId = useFamilyId()
  return useQuery({
    queryKey: ['events', 'upcoming', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('events')
        .select('id, title, kind, starts_at, ends_at, description, child_id')
        .eq('family_id', familyId)
        .is('cancelled_at', null)
        .gte('starts_at', nowIso)
        .order('starts_at', { ascending: true })
        .limit(limit)
      if (error) throw error
      return data
    },
  })
}

export function useEventsForMonth(year, month) {
  const familyId = useFamilyId()
  return useQuery({
    queryKey: ['events', 'month', familyId, year, month],
    enabled: !!familyId,
    queryFn: async () => {
      const from = new Date(Date.UTC(year, month, 1)).toISOString()
      const to = new Date(Date.UTC(year, month + 1, 1)).toISOString()
      const { data, error } = await supabase
        .from('events')
        .select('id, title, kind, starts_at, ends_at, description, child_id, cancelled_at')
        .eq('family_id', familyId)
        .lt('starts_at', to)
        .gte('ends_at', from)
        .order('starts_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useAddEvent() {
  const qc = useQueryClient()
  const familyId = useFamilyId()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (input) => {
      if (!familyId || !user) throw new Error('Famille introuvable')
      if (!input.title?.trim()) throw new Error('Titre requis')
      if (!input.starts_at || !input.ends_at) throw new Error('Dates requises')
      if (new Date(input.ends_at) < new Date(input.starts_at)) {
        throw new Error('La fin doit être après le début.')
      }
      const payload = {
        family_id: familyId,
        child_id: input.child_id || null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        kind: input.kind || 'other',
        starts_at: new Date(input.starts_at).toISOString(),
        ends_at: new Date(input.ends_at).toISOString(),
        created_by: user.id,
      }
      const { data, error } = await supabase
        .from('events')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useCancelEvent() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: async ({ eventId, reason }) => {
      if (!user) throw new Error('Non authentifié')
      const { data, error } = await supabase
        .from('events')
        .update({
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancel_reason: reason?.trim() || null,
        })
        .eq('id', eventId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
