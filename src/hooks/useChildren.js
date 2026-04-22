import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFamilyId } from './useFamily'

/**
 * Liste des enfants non soft-deleted de la famille courante.
 */
export function useChildren() {
  const familyId = useFamilyId()

  return useQuery({
    queryKey: ['children', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, birth_date')
        .eq('family_id', familyId)
        .is('deleted_at', null)
        .order('birth_date', { ascending: true })

      if (error) throw error
      return data
    },
  })
}
