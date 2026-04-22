import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFamilyId } from './useFamily'

/**
 * Retourne les événements à partir de maintenant, triés par date.
 */
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
